import { getCloudflareContext } from '@opennextjs/cloudflare';

/** Recursos de Cloudflare que declara `wrangler.jsonc`: base de datos e IA. */
export type CfEnv = {
  DB: D1Database;
  AI: Ai;
};

/** Los recursos de Cloudflare de la petición actual (o del aviso programado, ver `worker.ts`). */
export const cf = () => getCloudflareContext().env as unknown as CfEnv;
