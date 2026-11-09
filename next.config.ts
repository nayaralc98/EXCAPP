import { existsSync, readFileSync } from 'node:fs';

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

// The brand colour of globals.css (`--color-brand`) for the generated browser icon (src/app/site-icon.svg/route.ts).
const css = existsSync('src/app/globals.css') ? readFileSync('src/app/globals.css', 'utf8') : '';
const brand = /--color-brand:\s*([^;]+);/.exec(css)?.[1]?.trim() ?? '';

// Solo renderizado en servidor, sin optimización de imágenes.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: { TOTALUM_BRAND_COLOR: brand.startsWith('var(') ? '' : brand },
  poweredByHeader: false,
  images: { unoptimized: true },
  // los tipos se comprueban aparte con `npm run check-types-errors`
  typescript: { ignoreBuildErrors: true },
};

// `npm run dev`: los recursos de wrangler.jsonc (base de datos, fotos e IA) en local con Miniflare (`.wrangler/`).
export default async function config(phase: string): Promise<NextConfig> {
  // La IA de Cloudflare solo funciona en remoto: en local se usa si hay CLOUDFLARE_API_TOKEN (o `wrangler login`).
  if (phase === PHASE_DEVELOPMENT_SERVER) await initOpenNextCloudflareForDev({ remoteBindings: !!process.env.CLOUDFLARE_API_TOKEN });
  return nextConfig;
}
