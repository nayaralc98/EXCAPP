const TZ = 'Europe/Madrid';

export const fmtFechaHora = (ms: number) =>
  new Intl.DateTimeFormat('es-ES', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }).format(new Date(ms));

function offsetMin(utcMs: number) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return (asUtc - utcMs) / 60000;
}

/** Medianoche (hora de Madrid) del día "AAAA-MM-DD", en milisegundos; null si no es una fecha. */
export function inicioDia(s: string | undefined): number | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  return guess - offsetMin(guess) * 60000;
}
export const finDia = (s: string | undefined) => {
  const i = inicioDia(s);
  return i === null ? null : i + 86_400_000 - 1;
};
