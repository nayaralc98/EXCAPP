# Publicar EXCAPP en Cloudflare (gratis)

Todo lo que usa la app cabe en el plan gratuito de Cloudflare:

| Pieza | Servicio | Límite gratuito |
|---|---|---|
| Web y servidor | Workers | 100.000 peticiones al día |
| Base de datos y fotos | D1 | 5 GB (unas 15.000 fotos además de los datos) |
| Lectura de fotos con IA | Workers AI | 10.000 «neuronas» al día (cientos de fotos) |
| Aviso diario a la oficina | Cron de Workers | incluido |
| Correos | Resend (aparte) | 3.000 al mes |

No hace falta registrar tarjeta.

## 1. Preparar (una vez)

Necesitas Node 22 y una cuenta gratuita en <https://dash.cloudflare.com>.

```bash
npm ci
npx wrangler login
```

Crea la base de datos:

```bash
npx wrangler d1 create excapp
```

`d1 create` muestra un `database_id`: cópialo en `wrangler.jsonc` en lugar de `00000000-0000-0000-0000-000000000000`.

## 2. Secretos

```bash
npx wrangler secret put BETTER_AUTH_SECRET   # una cadena aleatoria larga (p. ej. la salida de: openssl rand -hex 32)
npx wrangler secret put CAPTCHA_SECRET       # otra cadena aleatoria: activa el anti-bots del registro
npx wrangler secret put ADMIN_EMAIL          # tu correo: esa cuenta será gerente
npx wrangler secret put RESEND_API_KEY       # opcional: clave de https://resend.com para enviar correos
npx wrangler secret put EMAIL_FROM           # opcional: p. ej. avisos@tuempresa.es (dominio verificado en Resend)
```

Sin `RESEND_API_KEY` la app funciona, pero no envía correos (códigos de recuperar contraseña ni avisos diarios).
Sin dominio propio verificado en Resend, solo se puede enviar al correo con el que te registraste en Resend.

## 3. Publicar

```bash
npm run deploy
```

Aplica las migraciones a la base de datos, compila y publica. Al terminar muestra la dirección
(`https://excapp.<tu-subdominio>.workers.dev`). Regístrate con el correo de `ADMIN_EMAIL` y ya eres gerente;
desde **Oficina → Equipo** das rol a los demás.

Cada cambio posterior se publica con el mismo `npm run deploy`.

## Trabajar en local

```bash
npm run dev
```

Abre <http://localhost:3100>. La base de datos (con las fotos) se guarda en `.wrangler/` (bórrala para empezar de cero).
La IA de Cloudflare no funciona en local salvo con `CLOUDFLARE_API_TOKEN` definido: sin ella, las fotos se guardan
igual y los datos se rellenan a mano.

Tras cambiar `src/db/schema.ts`: `npm run db:generate` crea la migración y `npm run dev` / `npm run deploy` la aplican.

## Dominio propio (opcional)

En Cloudflare: **Workers → excapp → Settings → Domains & Routes → Add custom domain**. Después añade el dominio a
`PUBLIC_HOSTS` (`npx wrangler secret put PUBLIC_HOSTS`, p. ej. `app.tuempresa.es`).
