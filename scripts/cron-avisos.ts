import { totalum } from 'totalum-sdk';

const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/avisos`;
const jobs = await totalum.cron.list();
const job =
  jobs.find((j) => j.name === 'avisos-diarios') ??
  (await totalum.cron.create({
    name: 'avisos-diarios',
    env: 'dev',
    schedule: '0 8 * * *',
    timezone: 'Europe/Madrid',
    description: 'Aviso diario a la oficina: albaranes sin obra y entradas sin salida de ayer',
    request: { method: 'POST', url },
  }));
console.log(job.id);
