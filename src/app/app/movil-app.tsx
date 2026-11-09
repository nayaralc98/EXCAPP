'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { guardar, nuevoId, pedirUbicacion, permisoUbicacion, posicion, sincronizar, todos, type Estado, type Registro } from './cola';

type Vista = 'inicio' | 'camara' | 'lista' | 'fichaje';
type Vehiculo = { id: string; matricula: string; nombre: string };
type Obra = { id: string; nombre: string; cliente: string };

const fmt = (ms: number) =>
  new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', dateStyle: 'short', timeStyle: 'short' }).format(new Date(ms));

const estilos: Record<Estado, { t: string; c: string; i: string }> = {
  pendiente: { t: 'Pendiente', c: 'bg-amber-300 text-black', i: '⏳' },
  sincronizado: { t: 'Sincronizado', c: 'bg-green-700 text-white', i: '✓' },
  error: { t: 'Error', c: 'bg-red-700 text-white', i: '!' },
};
function Insignia({ e }: { e: Estado }) {
  const s = estilos[e];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${s.c}`}>
      <span aria-hidden>{s.i}</span> {s.t}
    </span>
  );
}

const big = 'flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-7 text-2xl font-extrabold shadow-md active:scale-[0.98]';

export function MovilApp({ userId, nombre }: { userId: string; nombre: string }) {
  const [vista, setVista] = useState<Vista>('inicio');
  const [regs, setRegs] = useState<Registro[]>([]);
  const [online, setOnline] = useState(true);

  const recargar = useCallback(async () => setRegs(await todos(userId)), [userId]);
  const sync = useCallback(async () => {
    if (await sincronizar(userId)) await recargar();
  }, [userId, recargar]);

  useEffect(() => {
    recargar();
    sync();
    setOnline(navigator.onLine);
    const on = () => (setOnline(true), sync());
    const off = () => setOnline(false);
    const vis = () => document.visibilityState === 'visible' && sync();
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    document.addEventListener('visibilitychange', vis);
    const t = setInterval(vis, 30000);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      document.removeEventListener('visibilitychange', vis);
      clearInterval(t);
    };
  }, [recargar, sync]);

  const pendientes = regs.filter((r) => r.estado !== 'sincronizado').length;
  const alta = async (r: Registro) => {
    await guardar(r);
    await recargar();
    sync();
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg flex-col bg-white px-4 pb-8 pt-4 text-black">
      <div className="mb-4 flex items-center justify-between gap-2 text-base font-bold">
        <span className="truncate">👷 {nombre}</span>
        <span className={`rounded-full px-3 py-1 text-sm ${online ? 'bg-green-700 text-white' : 'bg-zinc-900 text-white'}`}>
          {online ? 'Con conexión' : 'Sin conexión'}
        </span>
      </div>
      {vista === 'inicio' && <Inicio pendientes={pendientes} ir={setVista} sync={sync} />}
      {vista === 'camara' && <Camara userId={userId} alta={alta} volver={() => setVista('inicio')} />}
      {vista === 'lista' && <Lista regs={regs.filter((r) => r.tipo === 'albaran')} volver={() => setVista('inicio')} />}
      {vista === 'fichaje' && <Fichaje userId={userId} regs={regs.filter((r) => r.tipo === 'fichaje')} alta={alta} volver={() => setVista('inicio')} />}
    </div>
  );
}

function Volver({ onClick, children }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button className="mb-4 self-start rounded-xl border-2 border-black px-5 py-3 text-lg font-bold" onClick={onClick} type="button">
      ← {children ?? 'Inicio'}
    </button>
  );
}

function Inicio({ pendientes, ir, sync }: { pendientes: number; ir: (v: Vista) => void; sync: () => void }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <button className={`${big} bg-brand text-white`} onClick={() => ir('camara')} type="button">
        <span aria-hidden className="text-4xl">📷</span> Fotografiar albarán
      </button>
      <button className={`${big} bg-zinc-900 text-white`} onClick={() => ir('fichaje')} type="button">
        <span aria-hidden className="text-4xl">⏱</span> Fichar entrada/salida
      </button>
      <div className="flex items-center justify-between rounded-2xl border-2 border-black p-4">
        <div>
          <p className="text-4xl font-extrabold">{pendientes}</p>
          <p className="text-lg font-bold">registros pendientes</p>
        </div>
        {pendientes > 0 && (
          <button className="rounded-xl bg-amber-300 px-4 py-3 font-bold" onClick={sync} type="button">
            Enviar ahora
          </button>
        )}
      </div>
      <button className="rounded-2xl border-2 border-black px-6 py-5 text-xl font-bold" onClick={() => ir('lista')} type="button">
        Mis albaranes
      </button>
    </div>
  );
}

function Camara({ userId, alta, volver }: { userId: string; alta: (r: Registro) => Promise<void>; volver: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const [fallo, setFallo] = useState(false);
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraSel, setObraSel] = useState('');
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [vehSel, setVehSel] = useState('');
  const [hecho, setHecho] = useState<{ url: string; uuid: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const abrir = useCallback(async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (video.current) video.current.srcObject = stream.current;
      setFallo(false);
    } catch {
      setFallo(true);
    }
  }, []);
  const cerrar = () => stream.current?.getTracks().forEach((t) => t.stop());

  useEffect(() => {
    try {
      const c = localStorage.getItem('obras');
      if (c) setObras(JSON.parse(c));
      setObraSel(localStorage.getItem('obraSel') ?? '');
      setVehSel(localStorage.getItem('vehSel') ?? '');
      const v = localStorage.getItem('vehiculos');
      if (v) setVehiculos(JSON.parse(v));
    } catch {}
    fetch('/api/obras')
      .then((r) => (r.ok ? (r.json() as Promise<{ obras?: Obra[] }>) : null))
      .then((j) => {
        if (j?.obras) (setObras(j.obras), localStorage.setItem('obras', JSON.stringify(j.obras)));
      })
      .catch(() => {});
    fetch('/api/vehiculos')
      .then((r) => (r.ok ? (r.json() as Promise<{ vehiculos?: Vehiculo[] }>) : null))
      .then((j) => {
        if (j?.vehiculos) (setVehiculos(j.vehiculos), localStorage.setItem('vehiculos', JSON.stringify(j.vehiculos)));
      })
      .catch(() => {});
    abrir();
    return cerrar;
  }, [abrir]);

  const guardarFoto = async (blob: Blob) => {
    setGuardando(true);
    const o = obras.find((x) => x.id === obraSel);
    const p = await posicion(3000);
    const uuid = nuevoId();
    await alta({
      uuid, tipo: 'albaran', userId, fechaHora: Date.now(), estado: 'pendiente', foto: blob,
      obra: o?.nombre ?? '', cliente: o?.cliente ?? '', matricula: vehSel, lat: p?.lat ?? null, lng: p?.lng ?? null,
    });
    cerrar();
    setHecho({ url: URL.createObjectURL(blob), uuid });
    setGuardando(false);
  };

  const disparar = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const w = Math.min(1600, v.videoWidth);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = Math.round((v.videoHeight * w) / v.videoWidth);
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((b) => b && guardarFoto(b), 'image/jpeg', 0.82);
  };

  if (hecho)
    return (
      <div className="flex flex-1 flex-col gap-4">
        <p className="rounded-2xl bg-green-700 p-4 text-center text-2xl font-extrabold text-white">✓ Albarán guardado</p>
        <img alt="Albarán guardado" className="max-h-[50dvh] w-full rounded-2xl border-2 border-black object-contain" src={hecho.url} />
        <button className={`${big} bg-brand text-white`} onClick={() => (setHecho(null), abrir())} type="button">
          Otro albarán
        </button>
        <button className="rounded-2xl border-2 border-black px-6 py-5 text-xl font-bold" onClick={volver} type="button">
          Volver al inicio
        </button>
      </div>
    );

  return (
    <div className="flex flex-1 flex-col gap-3">
      <Volver onClick={() => (cerrar(), volver())} />
      <label className="text-lg font-bold">
        Obra (opcional)
        <select
          className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-4 text-lg"
          onChange={(e) => (setObraSel(e.target.value), localStorage.setItem('obraSel', e.target.value))}
          value={obraSel}
        >
          <option value="">Sin indicar</option>
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre} · {o.cliente}
            </option>
          ))}
        </select>
      </label>
      {vehiculos.length > 0 && (
        <label className="text-lg font-bold">
          Máquina o camión (opcional)
          <select
            className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-4 text-lg"
            onChange={(e) => (setVehSel(e.target.value), localStorage.setItem('vehSel', e.target.value))}
            value={vehSel}
          >
            <option value="">Sin indicar</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.matricula}>
                {v.matricula} · {v.nombre}
              </option>
            ))}
          </select>
        </label>
      )}
      {fallo ? (
        <div className="rounded-2xl border-2 border-black p-4">
          <p className="mb-3 text-lg font-bold">No se puede abrir la cámara integrada. Usa la cámara del móvil:</p>
          <label className={`${big} cursor-pointer bg-brand text-white`}>
            📷 Hacer foto y guardar
            <input
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) await guardarFoto(await reducir(f)); }}
              type="file"
            />
          </label>
        </div>
      ) : (
        <>
          <video autoPlay className="aspect-[3/4] w-full rounded-2xl bg-black object-cover" muted playsInline ref={video} />
          <button className={`${big} bg-brand text-white disabled:opacity-60`} disabled={guardando} onClick={disparar} type="button">
            {guardando ? 'Guardando…' : '📸 Guardar albarán'}
          </button>
          <p className="text-center text-base font-bold">Un toque hace la foto y la guarda.</p>
        </>
      )}
    </div>
  );
}

function Lista({ regs, volver }: { regs: Registro[]; volver: () => void }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const m: Record<string, string> = {};
    regs.forEach((r) => r.foto && (m[r.uuid] = URL.createObjectURL(r.foto)));
    setUrls(m);
    return () => Object.values(m).forEach(URL.revokeObjectURL);
  }, [regs]);
  return (
    <div className="flex flex-1 flex-col">
      <Volver onClick={volver} />
      <h1 className="mb-3 text-3xl font-extrabold">Mis albaranes</h1>
      {regs.length === 0 && <p className="text-lg font-bold">Todavía no has guardado ningún albarán.</p>}
      <ul className="grid gap-3">
        {regs.map((r) => {
          const src = urls[r.uuid] ?? (r.serverId ? `/api/albaranes/${r.serverId}/foto` : '');
          return (
            <li className="flex gap-3 rounded-2xl border-2 border-black p-3" key={r.uuid}>
              {src ? <img alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" src={src} /> : <div className="h-20 w-20 shrink-0 rounded-lg bg-zinc-200" />}
              <div className="min-w-0">
                <p className="text-lg font-bold">{fmt(r.fechaHora)}</p>
                <p className="truncate text-base">{r.obra || 'Sin obra indicada'}</p>
                <div className="mt-1">
                  <Insignia e={r.estado} />
                </div>
                {r.estado === 'error' && r.mensaje && <p className="mt-1 text-sm font-bold text-red-700">{r.mensaje}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type Paso = 'ubicacion' | 'foto' | 'confirmar';
type Pos = { lat: number; lng: number; precision: number };

/** Ventana a pantalla completa para cada paso del fichaje. */
function Ventana({ titulo, children, cerrar }: { titulo: string; children: ReactNode; cerrar: () => void }) {
  return (
    <div aria-modal className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" role="dialog">
      <div className="flex max-h-[95dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-3xl bg-white p-5 text-black sm:rounded-3xl">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-extrabold">{titulo}</h2>
          <button aria-label="Cancelar" className="rounded-xl border-2 border-black px-3 py-2 text-lg font-bold" onClick={cerrar} type="button">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Fichaje({ userId, regs, alta, volver }: { userId: string; regs: Registro[]; alta: (r: Registro) => Promise<void>; volver: () => void }) {
  const [paso, setPaso] = useState<Paso | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [errPos, setErrPos] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [km, setKm] = useState('');
  const [veh, setVeh] = useState('');
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const ultimo = regs[0];
  const siguiente = ultimo?.accion === 'entrada' ? 'salida' : 'entrada';
  const kmEntrada = siguiente === 'salida' ? ultimo?.km ?? null : null;
  const fotoUrl = useMemo(() => (foto ? URL.createObjectURL(foto) : ''), [foto]);
  useEffect(() => () => void (fotoUrl && URL.revokeObjectURL(fotoUrl)), [fotoUrl]);

  useEffect(() => {
    try {
      setVeh(localStorage.getItem('vehSel') ?? '');
      const v = localStorage.getItem('vehiculos');
      if (v) setVehiculos(JSON.parse(v));
    } catch {}
    fetch('/api/vehiculos')
      .then((r) => (r.ok ? (r.json() as Promise<{ vehiculos?: Vehiculo[] }>) : null))
      .then((j) => j?.vehiculos && (setVehiculos(j.vehiculos), localStorage.setItem('vehiculos', JSON.stringify(j.vehiculos))))
      .catch(() => {});
  }, []);

  const localizar = async () => {
    setBuscando(true);
    setErrPos('');
    const r = await pedirUbicacion();
    setBuscando(false);
    if ('error' in r) return setErrPos(r.error);
    setPos(r);
    setPaso('foto');
  };
  const empezar = async () => {
    setPos(null);
    setFoto(null);
    setKm('');
    setErrPos('');
    setPaso('ubicacion');
    // Si el permiso ya está concedido, localiza sin esperar al toque.
    if ((await permisoUbicacion()) === 'granted') localizar();
  };
  const cancelar = () => setPaso(null);

  const kmNum = km.trim() === '' ? null : Number(km.replace(/[.\s]/g, '').replace(',', '.'));
  const kmValido = kmNum === null || (Number.isFinite(kmNum) && kmNum >= 0 && kmNum < 10_000_000);
  const kmMenor = kmNum !== null && kmEntrada != null && kmNum < kmEntrada;

  const fichar = async () => {
    if (!foto || !kmValido) return;
    setOcupado(true);
    try { localStorage.setItem('vehSel', veh); } catch {}
    await alta({
      uuid: nuevoId(), tipo: 'fichaje', userId, fechaHora: Date.now(), estado: 'pendiente', accion: siguiente,
      lat: pos?.lat ?? null, lng: pos?.lng ?? null, fotoKm: foto, km: kmNum !== null ? Math.round(kmNum) : null, matricula: veh,
    });
    setOcupado(false);
    setPaso(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Volver onClick={volver} />
      <button
        className={`${big} py-12 text-3xl ${siguiente === 'entrada' ? 'bg-green-700 text-white' : 'bg-zinc-900 text-white'}`}
        onClick={empezar}
        type="button"
      >
        {siguiente === 'entrada' ? 'Fichar entrada' : 'Fichar salida'}
      </button>
      <p className="text-center text-base font-bold">Pide tu ubicación y una foto de los km del camión.</p>

      {paso === 'ubicacion' && (
        <Ventana cerrar={cancelar} titulo="📍 Tu ubicación">
          <p className="text-lg">Para registrar bien el fichaje necesitamos saber dónde estás. Si el móvil pregunta, pulsa <b>Permitir</b>.</p>
          {errPos && (
            <div className="rounded-2xl border-2 border-red-700 bg-red-50 p-4">
              <p className="text-lg font-bold text-red-700">{errPos}</p>
              <p className="mt-1 text-base">Activa la ubicación en los ajustes del móvil (Ajustes → Ubicación → navegador) y vuelve a intentarlo.</p>
            </div>
          )}
          <button className={`${big} bg-brand text-white disabled:opacity-60`} disabled={buscando} onClick={localizar} type="button">
            {buscando ? 'Buscando señal GPS…' : errPos ? 'Reintentar' : 'Permitir ubicación'}
          </button>
          {errPos && (
            <button className="rounded-2xl border-2 border-black px-6 py-4 text-lg font-bold" onClick={() => setPaso('foto')} type="button">
              Seguir sin ubicación
            </button>
          )}
        </Ventana>
      )}

      {paso === 'foto' && (
        <Ventana cerrar={cancelar} titulo="🚚 Km del camión">
          {pos ? (
            <p className="rounded-xl bg-green-700 px-4 py-2 font-bold text-white">✓ Ubicación lista (±{pos.precision} m)</p>
          ) : (
            <p className="rounded-xl bg-amber-300 px-4 py-2 font-bold">Sin ubicación en este fichaje</p>
          )}
          <p className="text-lg">Haz una foto clara del cuentakilómetros {siguiente === 'entrada' ? 'al empezar' : 'al terminar'} la jornada.</p>
          <label className={`${big} cursor-pointer bg-brand text-white`}>
            📷 Foto de los km
            <input
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) (setFoto(await reducir(f)), setPaso('confirmar'));
              }}
              type="file"
            />
          </label>
        </Ventana>
      )}

      {paso === 'confirmar' && foto && (
        <Ventana cerrar={cancelar} titulo={siguiente === 'entrada' ? 'Confirmar entrada' : 'Confirmar salida'}>
          <img alt="Cuentakilómetros" className="max-h-[35dvh] w-full rounded-2xl border-2 border-black object-contain" src={fotoUrl} />
          <button className="self-start text-base font-bold underline" onClick={() => setPaso('foto')} type="button">Repetir foto</button>
          {vehiculos.length > 0 && (
            <label className="text-lg font-bold">
              Camión
              <select className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-4 text-lg" onChange={(e) => setVeh(e.target.value)} value={veh}>
                <option value="">Sin indicar</option>
                {vehiculos.map((v) => <option key={v.id} value={v.matricula}>{v.matricula} · {v.nombre}</option>)}
              </select>
            </label>
          )}
          <label className="text-lg font-bold">
            Km (opcional)
            <input
              className="mt-1 w-full rounded-xl border-2 border-black px-3 py-4 text-2xl font-extrabold"
              inputMode="numeric"
              onChange={(e) => setKm(e.target.value)}
              placeholder="Se leerá de la foto"
              value={km}
            />
          </label>
          <p className="text-base">Si lo dejas vacío, los km se leerán automáticamente de la foto al sincronizar.</p>
          {kmEntrada != null && <p className="text-base font-bold">Km al entrar: {kmEntrada.toLocaleString('es-ES')}</p>}
          {!kmValido && <p className="font-bold text-red-700">Escribe solo números.</p>}
          {kmMenor && <p className="font-bold text-amber-700">Ojo: es menos que al entrar. Revísalo.</p>}
          <button
            className={`${big} disabled:opacity-60 ${siguiente === 'entrada' ? 'bg-green-700 text-white' : 'bg-zinc-900 text-white'}`}
            disabled={ocupado || !kmValido}
            onClick={fichar}
            type="button"
          >
            {ocupado ? 'Guardando…' : siguiente === 'entrada' ? '✓ Fichar entrada' : '✓ Fichar salida'}
          </button>
        </Ventana>
      )}

      <div className="rounded-2xl border-2 border-black p-4">
        <p className="text-lg font-bold">Última acción</p>
        {ultimo ? (
          <>
            <p className="text-2xl font-extrabold capitalize">
              {ultimo.accion} · {fmt(ultimo.fechaHora)}
            </p>
            <p className="text-lg font-bold">{ultimo.km != null ? `${ultimo.km.toLocaleString('es-ES')} km` : ultimo.estado === 'sincronizado' ? 'Km no leídos' : 'Km: se leerán al sincronizar'}</p>
            <div className="mt-2">
              <Insignia e={ultimo.estado} />
            </div>
            {ultimo.lat == null && <p className="mt-2 text-base">Sin ubicación GPS en este fichaje.</p>}
          </>
        ) : (
          <p className="text-lg">Todavía no has fichado en este móvil.</p>
        )}
      </div>
      {regs.length > 1 && (
        <ul className="grid gap-2">
          {regs.slice(1, 6).map((r) => (
            <li className="flex items-center justify-between gap-2 rounded-xl border-2 border-zinc-300 p-3" key={r.uuid}>
              <span className="font-bold capitalize">
                {r.accion} · {fmt(r.fechaHora)}{r.km != null ? ` · ${r.km.toLocaleString('es-ES')} km` : ''}
              </span>
              <Insignia e={r.estado} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Reduce la foto a 1600 px de ancho (JPEG) para que pese poco al enviarla sin cobertura buena. */
async function reducir(f: File): Promise<Blob> {
  try {
    const img = await createImageBitmap(f);
    const w = Math.min(1600, img.width);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = Math.round((img.height * w) / img.width);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b ?? f), 'image/jpeg', 0.85));
  } catch {
    return f;
  }
}
