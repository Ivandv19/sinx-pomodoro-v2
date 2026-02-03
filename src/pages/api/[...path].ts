import { Hono } from 'hono';
import { auth } from '../../lib/auth';
import type { APIContext } from 'astro';

const app = new Hono<{
  Bindings: {
    DB: any;
    APP_KV: any;
  };
}>().basePath('/api');

// Better Auth integration
app.on(['POST', 'GET'], '/auth/**', async (c) => {
  return auth(c.env.DB, c.env.APP_KV).handler(c.req.raw);
});

// Middleware for Auth (simulated for now, better-auth has its own)
const getSession = async (c: any) => {
    return await auth(c.env.DB, c.env.APP_KV).api.getSession({
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
  return app.fetch(context.request, { 
    DB: context.locals.runtime.env.DB,
    APP_KV: context.locals.runtime.env.LUCIA_KV
  });
};
