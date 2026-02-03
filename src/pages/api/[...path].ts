import type { KVNamespace, D1Database } from "@cloudflare/workers-types";
import { Hono } from 'hono';
import { auth } from '../../lib/auth';
import type { APIContext } from 'astro';

const app = new Hono<{
  Bindings: {
    DB: D1Database;
    LUCIA_KV: KVNamespace;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
  };
}>().basePath('/api');

// Better Auth integration
app.on(['POST', 'GET'], '/auth/**', async (c) => {
  return auth(c.env.DB, c.env.LUCIA_KV, c.env).handler(c.req.raw);
});

// Middleware for Auth
const getSession = async (c: any) => {
    return await auth(c.env.DB, c.env.LUCIA_KV, c.env).api.getSession({
        headers: c.req.raw.headers
    });
};

// Pomodoro Endpoints
app.post('/pomodoros', async (c) => {
    const session = await getSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json();
    const { type, minutes, createdAt } = body;
    
    await c.env.DB.prepare(
        "INSERT INTO pomodoro_log (user_id, type, minutes, created_at) VALUES (?, ?, ?, ?)"
    ).bind(session.user.id, type, minutes, createdAt).run();

    return c.json({ success: true });
});

app.get('/pomodoros', async (c) => {
    const session = await getSession(c);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const { results } = await c.env.DB.prepare(
        "SELECT id, type, minutes, created_at as createdAt FROM pomodoro_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
    ).bind(session.user.id).all();

    return c.json(results.map((row: any) => ({
        ...row,
        startTime: new Date(row.createdAt - (row.minutes * 60000)).toISOString(),
        endTime: new Date(row.createdAt).toISOString()
    })));
});

// Export the Astro API handler
export const ALL = async (context: APIContext) => {
  const env = context.locals.runtime?.env;
  if (!env) {
    return new Response("Environment not available", { status: 500 });
  }
  return app.fetch(context.request, env);
};
