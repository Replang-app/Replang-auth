import { Resend } from "resend";
import nodemailer from "nodemailer";
import { env } from "./env.js";

// Transport choisi une fois à l'initialisation du module (pas à chaque appel).
// En prod (RESEND_API_KEY définie) → SDK Resend via HTTPS.
// En dev (clé absente) → Nodemailer vers Mailpit (SMTP :1025, UI web :8025).
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const smtp = resend
  ? null
  : nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false,
    });

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail({ to, subject, html, text }: MailMessage): Promise<void> {
  if (resend) {
    const { error } = await resend.emails.send({
      from: env.MAIL_FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });
    if (error) throw new Error(`[Resend] ${error.message}`);
    return;
  }

  // smtp est forcément défini si resend est null (voir initialisation).
  await smtp!.sendMail({ from: env.MAIL_FROM, to, subject, html, text });
}
