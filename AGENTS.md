# Tempo

App de Pomodoro + gestión de tareas. Astro 7 + React 19 + Cloudflare (Pages + D1 + KV).

## Antes de tocar código

Lee `docs/DOCUMENTACION.md` — arquitectura, offline-first, sync y reglas.
Verifica índice: `codegraph status /home/ivan/software-dev/tempo` (y `codegraph sync` si tocaste `src/`).

## Comandos útiles (bun)

- `bun run dev` — Astro dev (solo frontend, puerto 4321)
- `bun run dev:full` — `astro build && wrangler pages dev dist/ --port 4321` (con API + D1 local)
- `bun run build` / `bun run preview`
- `bun run check` (= `biome check --write` lint+format) | `bun run lint` solo lint
- `bun run test:unit` (Vitest) | `bun run test:e2e` (seed + Playwright)
- `bunx wrangler pages dev dist/ --port 4321` — wrangler local directo (si no usas `dev:full`)
- `bunx wrangler d1 execute pomodoro-db --local --file=<sql>` — aplicar SQL local

## Convenciones

- Español en código/comentarios.

## Entornos

- Local: `.dev.vars` con `BETTER_AUTH_URL=http://localhost:4321`, `BETTER_AUTH_SECRET`, `HASH_SERVICE_URL=http://localhost:3010`, keys Turnstile. Corre con `bun run dev:full`.
- Prod: secrets en GitHub Actions / Cloudflare (`BETTER_AUTH_SECRET`, `CLOUDFLARE_API_TOKEN`, etc.). URL `https://tempo.mgdc.site`.

## Que NO hacer

- No mandar IDs locales `Date.now()+random` a `/api/*` sin `traducirTareaId` (`src/lib/sync.ts:58`).
- No iniciar pomodoro sin `tareaId`.