// Compilación automática de Cloudflare (Workers Builds, WORKERS_CI=1): su `npx wrangler deploy` publica directamente
// lo ya construido sin construirlo, así que se construye aquí, al acabar `npm ci` (postinstall), y se aplican las
// migraciones pendientes de la base de datos de producción. Fuera de Cloudflare no hace nada.
import { spawnSync } from 'node:child_process';

if (process.env.WORKERS_CI !== '1') process.exit(0);

const run = (cmd) => {
  console.log(`> ${cmd}`);
  const r = spawnSync(cmd, { stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run('npx opennextjs-cloudflare build');
run('npx wrangler d1 migrations apply excapp --remote');
