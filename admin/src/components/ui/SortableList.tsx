"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useId, useState, useTransition, type ReactNode } from "react";
import type { ActionState } from "@/types/action";

type SortableItem = { id: number; content: ReactNode };

type SortableListProps = {
  items: SortableItem[];
  /** Server action que grava a nova ordem (lista de IDs). */
  onReorder: (ids: number[]) => Promise<ActionState>;
  empty?: ReactNode;
};

/**
 * Lista com arrastar para ordenar (mouse, toque e teclado: Espaço + setas).
 * A nova ordem aparece na hora e é gravada no servidor em seguida.
 */
export function SortableList({ items, onReorder, empty }: SortableListProps) {
  // ID estável evita diferença de atributos entre servidor e cliente (hidratação).
  const dndId = useId();
  const [order, setOrder] = useState(items.map((item) => item.id));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Dados novos do servidor (item criado/removido/reordenado) substituem a
  // ordem local. Ajuste durante a renderização, como recomenda o React.
  const itemKey = items.map((item) => item.id).join(",");
  const [syncedKey, setSyncedKey] = useState(itemKey);
  if (itemKey !== syncedKey) {
    setSyncedKey(itemKey);
    setOrder(items.map((item) => item.id));
  }

  if (items.length === 0) return <>{empty ?? null}</>;
  const byId = new Map(items.map((item) => [item.id, item]));

  function handleDragEnd({ active, over }: DragEndEvent): void {
    if (!over || active.id === over.id) return;
    const next = arrayMove(order, order.indexOf(Number(active.id)), order.indexOf(Number(over.id)));
    const previous = order;
    setOrder(next);
    startTransition(async () => {
      const result = await onReorder(next);
      if (!result.ok) {
        setOrder(previous);
        setError(result.message ?? "Não foi possível salvar a ordem.");
      } else {
        setError(null);
      }
    });
  }

  return (
    <div aria-busy={pending}>
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2">
            {order.map((id) => {
              const item = byId.get(id);
              return item ? (
                <Row key={id} id={id}>
                  {item.content}
                </Row>
              ) : null;
            })}
          </ul>
        </SortableContext>
      </DndContext>
      {error ? (
        <p role="alert" className="text-danger mt-2 text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Row({ id, children }: { id: number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-btn border-border bg-surface-2 flex items-start gap-2 border p-2 ${isDragging ? "z-10 opacity-80 shadow-lg" : ""}`}
    >
      <button
        type="button"
        className="text-muted hover:text-text mt-1 cursor-grab touch-none rounded p-1 active:cursor-grabbing"
        aria-label="Arrastar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}
