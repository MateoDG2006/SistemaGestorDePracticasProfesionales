import nodemailer, { type Transporter } from "nodemailer";

// ServicioCorreo (Tabla 23): adaptador SMTP con TLS. Si no hay SMTP_HOST,
// usa un transporte de log (no envia) para poder ejecutar sin credenciales.
let transporter: Transporter | null = null;

function obtenerTransporte(): Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null; // modo log
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: Number(process.env.SMTP_PORT ?? "587") === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  return transporter;
}

export async function enviarCorreo(destino: string, asunto: string, cuerpo: string): Promise<void> {
  const t = obtenerTransporte();
  const remitente = process.env.CORREO_REMITENTE ?? "no-reply@sgpp.local";
  if (!t) {
    console.log(`[correo:log] -> ${destino} | ${asunto} | ${cuerpo}`);
    return;
  }
  await t.sendMail({ from: remitente, to: destino, subject: asunto, text: cuerpo });
}
