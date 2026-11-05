'use client';

import { useState } from 'react';

/** Miniatura que abre la foto original a pantalla completa. */
export function Visor({ id }: { id: string }) {
  const [abierto, setAbierto] = useState(false);
  const src = `/api/albaranes/${id}/foto`;
  return (
    <>
      <button className="block" onClick={() => setAbierto(true)} type="button">
        <img alt="Foto del albarán" className="h-12 w-12 rounded-md border border-zinc-300 object-cover" loading="lazy" src={src} />
      </button>
      {abierto && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/85 p-4" onClick={() => setAbierto(false)} role="dialog">
          <img alt="Foto original del albarán" className="max-h-[80dvh] max-w-full rounded-lg object-contain" src={src} />
          <div className="flex gap-3">
            <a className="rounded-lg bg-white px-4 py-2 font-bold" href={src} onClick={(e) => e.stopPropagation()} rel="noreferrer" target="_blank">
              Abrir original
            </a>
            <button className="rounded-lg bg-brand px-4 py-2 font-bold text-white" type="button">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
