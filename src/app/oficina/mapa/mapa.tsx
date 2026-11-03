'use client';

import { useEffect, useRef } from 'react';

export type Punto = { nombre: string; lat: number; lng: number; cuando: string; origen: string };

/** Mapa con la última ubicación conocida de cada conductor (OpenStreetMap + Leaflet). */
export function Mapa({ puntos }: { puntos: Punto[] }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mapa: { remove: () => void } | null = null;
    let vivo = true;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!vivo || !el.current) return;
      const m = L.map(el.current).setView([40.4, -3.7], 6);
      mapa = m;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
      const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
      const pts = puntos.map((p) => {
        L.marker([p.lat, p.lng]).addTo(m).bindPopup(`<b>${esc(p.nombre)}</b><br>${esc(p.origen)} · ${esc(p.cuando)}`);
        return [p.lat, p.lng];
      });
      if (pts.length) m.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
    };
    document.body.appendChild(s);
    return () => {
      vivo = false;
      mapa?.remove();
      css.remove();
      s.remove();
    };
  }, [puntos]);
  return <div className="h-[60dvh] w-full rounded-xl border border-zinc-300" ref={el} />;
}
