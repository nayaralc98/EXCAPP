// Construcción para Cloudflare. `wrangler deploy` la lanza sola (wrangler.jsonc → build.command), así funciona aunque
// el panel de Cloudflare no tenga comando de compilación. En la compilación de Cloudflare (WORKERS_CI=1) también
// aplica las migraciones pendientes a la base de datos de producción antes de publicar.
import { spawnSync } from 'node:child_process';

const run = (cmd) => {
  console.log(`> ${cmd}`);
  const r = spawnSync(cmd, { stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run('npx opennextjs-cloudflare build --skipWranglerConfigCheck');
if (process.env.WORKERS_CI === '1') run('npx wrangler d1 migrations apply excapp --remote');
