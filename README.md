# EXCAPP

Albaranes y fichajes de conductores desde el móvil (también sin cobertura), con panel de control para la oficina.
Next.js 16 en Cloudflare Workers: base de datos D1 con Drizzle, fotos en R2, lectura de fotos con Workers AI y
cuentas con better-auth.

- **Publicar y configurar:** [DESPLIEGUE.md](DESPLIEGUE.md)
- **En local:** `npm ci` y `npm run dev` → <http://localhost:3100>

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | App en local con base de datos y fotos en `.wrangler/` |
| `npm run deploy` | Migra la base de datos, compila y publica en Cloudflare |
| `npm run preview` | Compila para Cloudflare y la sirve en local (<http://localhost:8787>) |
| `npm run db:generate` | Crea la migración tras cambiar `src/db/schema.ts` |
| `npm run check-types-errors` | Comprueba los tipos |
