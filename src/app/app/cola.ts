// Almacén local (IndexedDB) de albaranes y fichajes del móvil: sobrevive a cerrar la app y a no tener cobertura.
export type Estado = 'pendiente' | 'sincronizado' | 'error';
export type Registro = {
  uuid: string;
  tipo: 'albaran' | 'fichaje';
  userId: string;
  fechaHora: number;
  estado: Estado;
  lat: number | null;
  lng: number | null;
  // albarán
  foto?: Blob | null;
  obra?: string;
  cliente?: string;
  matricula?: string;
  serverId?: string;
  // fichaje
  accion?: 'entrada' | 'salida';
  fotoKm?: Blob | null;
  km?: number | null;
  mensaje?: string;
};

let dbp: Promise<IDBDatabase> | null = null;
function abrir() {
  dbp ??= new Promise((res, rej) => {
    const q = indexedDB.open('gestion-diaria', 1);
    q.onupgradeneeded = () => q.result.createObjectStore('registros', { keyPath: 'uuid' });
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
  return dbp;
}
const req = <T,>(r: IDBRequest<T>) => new Promise<T>((res, rej) => ((r.onsuccess = () => res(r.result)), (r.onerror = () => rej(r.error))));

export async function guardar(r: Registro) {
  const d = await abrir();
  await req(d.transaction('registros', 'readwrite').objectStore('registros').put(r));
}
export async function todos(userId: string): Promise<Registro[]> {
  const d = await abrir();
  const all = await req(d.transaction('registros').objectStore('registros').getAll() as IDBRequest<Registro[]>);
  return all.filter((r) => r.userId === userId).sort((a, b) => b.fechaHora - a.fechaHora);
}

export const nuevoId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

/** Posición GPS si hay permiso y señal; si no, null (el resto sigue funcionando). */
export function posicion(ms = 4000): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((res) => {
    const t = setTimeout(() => res(null), ms + 500);
    navigator.geolocation.getCurrentPosition(
      (p) => (clearTimeout(t), res({ lat: p.coords.latitude, lng: p.coords.longitude })),
      () => (clearTimeout(t), res(null)),
      { timeout: ms, maximumAge: 120000, enableHighAccuracy: false },
    );
  });
}

export type PermisoUbicacion = 'granted' | 'denied' | 'prompt' | 'unsupported';
/** Estado del permiso de ubicación (sin pedirlo). */
export async function permisoUbicacion(): Promise<PermisoUbicacion> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'unsupported';
  try {
    const p = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
    return (p?.state as PermisoUbicacion) ?? 'prompt';
  } catch {
    return 'prompt';
  }
}
/** Pide la ubicación con alta precisión (abre el aviso del navegador si hace falta). */
export function pedirUbicacion(ms = 12000): Promise<{ lat: number; lng: number; precision: number } | { error: string }> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve({ error: 'Este móvil no permite ubicación.' });
  return new Promise((res) =>
    navigator.geolocation.getCurrentPosition(
      (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude, precision: Math.round(p.coords.accuracy) }),
      (e) => res({ error: e.code === e.PERMISSION_DENIED ? 'Permiso de ubicación denegado.' : 'No se encuentra la señal GPS.' }),
      { timeout: ms, maximumAge: 30000, enableHighAccuracy: true },
    ),
  );
}

async function enviar(r: Registro): Promise<{ ok: boolean; red: boolean; id?: string; km?: number | null; msg?: string }> {
  try {
    let res: Response;
    if (r.tipo === 'albaran') {
      const f = new FormData();
      f.set('uuid_local', r.uuid);
      f.set('fecha_hora', String(r.fechaHora));
      f.set('obra', r.obra ?? '');
      f.set('cliente', r.cliente ?? '');
      f.set('matricula', r.matricula ?? '');
      if (r.lat != null && r.lng != null) (f.set('lat', String(r.lat)), f.set('lng', String(r.lng)));
      if (r.foto) f.set('foto', r.foto, 'albaran.jpg');
      res = await fetch('/api/sync/albaran', { method: 'POST', body: f });
    } else if (r.fotoKm) {
      const f = new FormData();
      f.set('uuid_local', r.uuid);
      f.set('fecha_hora', String(r.fechaHora));
      f.set('tipo', r.accion ?? '');
      f.set('matricula', r.matricula ?? '');
      if (r.km != null) f.set('km', String(r.km));
      if (r.lat != null && r.lng != null) (f.set('lat', String(r.lat)), f.set('lng', String(r.lng)));
      f.set('foto_km', r.fotoKm, 'km.jpg');
      res = await fetch('/api/sync/fichaje', { method: 'POST', body: f });
    } else {
      res = await fetch('/api/sync/fichaje', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uuid_local: r.uuid, fecha_hora: r.fechaHora, tipo: r.accion, lat: r.lat, lng: r.lng, km: r.km ?? null, matricula: r.matricula ?? '' }),
      });
    }
    if (res.ok) {
      const j = (await res.json()) as { id?: string; km?: number | null };
      return { ok: true, red: false, id: j.id, km: j.km };
    }
    // sin sesión o servidor caído: se reintentará solo; otro fallo: error visible (también se reintenta)
    if (res.status === 401 || res.status >= 500) return { ok: false, red: true };
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    return { ok: false, red: false, msg: j.error ?? `Error ${res.status}` };
  } catch {
    return { ok: false, red: true };
  }
}

let enCurso = false;
/** Envía todo lo pendiente o con error. `uuid_local` evita duplicados si un envío se repite. */
export async function sincronizar(userId: string): Promise<boolean> {
  if (enCurso || (typeof navigator !== 'undefined' && navigator.onLine === false)) return false;
  enCurso = true;
  let cambios = false;
  try {
    const lista = (await todos(userId)).filter((r) => r.estado !== 'sincronizado').reverse();
    for (const r of lista) {
      const o = await enviar(r);
      if (o.ok) await guardar({ ...r, estado: 'sincronizado', serverId: o.id, foto: null, fotoKm: null, km: o.km ?? r.km ?? null, mensaje: undefined });
      else if (!o.red) await guardar({ ...r, estado: 'error', mensaje: o.msg });
      else continue;
      cambios = true;
    }
  } finally {
    enCurso = false;
  }
  return cambios;
}
