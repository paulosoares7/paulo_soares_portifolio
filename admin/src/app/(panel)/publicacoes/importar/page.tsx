import type { Metadata } from "next";
import { prisma } from "@portfolio/database";
import { ImportPanel } from "@/components/forms/ImportPanel";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Td, Th } from "@/components/ui/Table";
import { formatDateTime } from "@/lib/format";
import { isOrcidId } from "@/lib/orcid";

export const metadata: Metadata = { title: "Importar publicações" };

const SOURCE_LABEL = { lattes_xml: "Lattes (XML)", orcid_api: "ORCID" } as const;
const STATUS_TONE = { running: "warning", success: "success", failed: "danger" } as const;
const STATUS_LABEL = { running: "em andamento", success: "concluída", failed: "falhou" } as const;

/** Importação do Lattes e do ORCID com prévia + histórico (RF24). */
export default async function ImportPage() {
  const [profile, jobs] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 }, select: { orcidId: true } }),
    prisma.importJob.findMany({
      orderBy: { startedAt: "desc" },
      take: 30,
      include: { starter: { select: { name: true } } },
    }),
  ]);
  const orcidId = [profile?.orcidId, process.env.ORCID_ID].find(
    (value) => isOrcidId(value) && value !== "0000-0000-0000-0000",
  );

  return (
    <>
      <PageHeader
        title="Importar publicações"
        back={{ href: "/publicacoes", label: "Publicações" }}
        description="Nada é gravado antes de você conferir a prévia e escolher os itens."
      />
      <ImportPanel orcidLabel={orcidId ? `ORCID ${orcidId}` : null} />

      <Card className="mt-6">
        <CardTitle>Histórico de importações</CardTitle>
        {jobs.length === 0 ? (
          <EmptyState>Nenhuma importação feita ainda.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Quando</Th>
                <Th>Fonte</Th>
                <Th>Resultado</Th>
                <Th>Novas</Th>
                <Th>Atualizadas</Th>
                <Th>Ignoradas</Th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <Td>
                    {formatDateTime(job.startedAt)}
                    {job.starter ? (
                      <span className="text-muted block text-xs">{job.starter.name}</span>
                    ) : null}
                  </Td>
                  <Td>
                    {SOURCE_LABEL[job.source]}
                    {job.fileName ? (
                      <span className="text-muted block text-xs">{job.fileName}</span>
                    ) : null}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[job.status]}>{STATUS_LABEL[job.status]}</Badge>
                    {job.message ? (
                      <span className="text-danger block text-xs">{job.message}</span>
                    ) : null}
                  </Td>
                  <Td>{job.itemsCreated}</Td>
                  <Td>{job.itemsUpdated}</Td>
                  <Td>{job.itemsSkipped}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
