# Tempo

App de Pomodoro + gestión de tareas. Astro + React + Cloudflare (Workers + D1).

## Antes de tocar código

Lee primero:

- `docs/ARCHITECTURE.md` — stack, schema de la BD, capas, flujo offline-first
- `docs/BUSINESS-RULES.md` — reglas de negocio vigentes (no romperlas sin discutir)
- `docs/DECISIONS.md` — decisiones de diseño y pendientes registrados

## Comandos

- `bun run dev` — dev local (Astro)
- `bun run build` — build de producción (prebuild = `bun install`)
- `bun run check` — biome check --write (formato + lint)
- `bun run db:gen` — genera migraciones de Drizzle
- `bunx wrangler d1 execute pomodoro-db --local|--remote --file=<sql>` — aplicar migraciones

## Convenciones del repo

- Comentarios y código en español
- Store: Zustand con slices (`src/stores/slices/*.ts`)
- API: Hono + zod-openapi en `functions/api/` (handlers + schemas separados)
- Offline-first: toda mutación local persiste en localStorage y la API se usa si `isLoggedIn`