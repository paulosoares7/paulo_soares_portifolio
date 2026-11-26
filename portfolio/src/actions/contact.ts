"use server";

import { headers } from "next/headers";
import { prisma } from "@portfolio/database";
import { parseForm } from "@/lib/form";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { hitRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/types/action";
import { contactSchema } from "@/validators/contact";

// Freia spam: 5 mensagens a cada 15 min por IP.
const CONTACT_LIMIT = 5;
const CONTACT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Salva a mensagem do formulário de contato e avisa o professor por e-mail (RF04).
 * @param _state Estado anterior.
 * @param formData Nome, e-mail, assunto e mensagem.
 * @returns Resultado para o formulário.
 */
export async function sendContactMessage(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(contactSchema, formData);
  if (!parsed.success) return parsed.state;
  const { name, email, subject, message, website } = parsed.data;
  // Robô preencheu o campo escondido: finge sucesso e descarta.
  if (website) return { ok: true, message: "Mensagem enviada. Obrigado!" };

  const headerList = await headers();
  const ip = (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "local"
  ).slice(0, 45);
  if (!hitRateLimit(`contact:${ip}`, CONTACT_LIMIT, CONTACT_WINDOW_MS).allowed) {
    return { ok: false, message: "Muitas mensagens em pouco tempo. Tente de novo mais tarde." };
  }

  try {
    await prisma.contactMessage.create({ data: { name, email, subject, message, ipAddress: ip } });
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Não foi possível enviar agora. Tente novamente." };
  }

  // Aviso por e-mail é opcional: a mensagem já está salva no painel.
  if (isMailConfigured()) {
    const admin = await prisma.adminUser.findFirst({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { email: true },
    });
    if (admin) {
      await sendMail({
        to: admin.email,
        subject: `Contato pelo site: ${subject ?? name}`,
        text: `${name} <${email}> escreveu:\n\n${message}`,
        replyTo: email,
      }).catch((error: unknown) => console.error("Aviso de contato não enviado:", error));
    }
  }
  return { ok: true, message: "Mensagem enviada. Obrigado! Respondo pelo seu e-mail." };
}
