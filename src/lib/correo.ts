import { site } from '@/lib/site';

/**
 * Envía un correo con Resend (gratis hasta 3.000 al mes). Necesita el secreto `RESEND_API_KEY` y, para enviar a
 * cualquier dirección, `EMAIL_FROM` con un dominio verificado en Resend (p. ej. `avisos@tuempresa.es`). Sin clave, el
 * correo solo se escribe en el registro (útil en local).
 */
export async function enviarCorreo(m: { to: string | string[]; subject: string; html: string; idempotencyKey?: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = `${site.name} <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`;
  if (!key) {
    console.log('correo (sin RESEND_API_KEY, no enviado):', m.subject, m.to);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...(m.idempotencyKey && { 'idempotency-key': m.idempotencyKey }),
    },
    body: JSON.stringify({ from, to: m.to, subject: m.subject, html: m.html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
