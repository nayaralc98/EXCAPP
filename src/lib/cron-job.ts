const text = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** Clave de un solo uso que `worker.ts` pone al lanzar un aviso programado (mismo proceso, nunca sale fuera). */
const CLAVE = Symbol.for('excapp.cron');
export function esLlamadaCron(req: Request): boolean {
  const k = (globalThis as Record<symbol, string | undefined>)[CLAVE];
  return !!k && req.headers.get('x-excapp-cron') === k;
}

/**
 * Tarea programada: solo la lanza el cron de Cloudflare (ver `triggers.crons` en wrangler.jsonc y `scheduled` en
 * worker.ts). Se reintenta una vez si falla, así que debe poder repetirse sin efectos dobles.
 */
export async function cronJob(
  req: Request,
  name: string,
  work: (signal: AbortSignal) => Promise<unknown>,
  { timeoutMs = 25_000, retries = 1 } = {},
): Promise<Response> {
  if (!esLlamadaCron(req)) return Response.json({ ok: false }, { status: 401 });
  const signal = AbortSignal.timeout(timeoutMs);
  let error = '';
  for (let attempt = 0; attempt <= retries && !signal.aborted; attempt++) {
    try {
      const result = await work(signal);
      return Response.json({ ok: true, ...(result === undefined ? {} : { result }) });
    } catch (err) {
      error = text(err);
      console.error(`${name} failed (attempt ${String(attempt + 1)}): ${error}`);
    }
  }
  return Response.json({ ok: false, error }, { status: 500 });
}
