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

// Middleware for Auth (simulated for now, better-auth has its own)
const getSession = async (c: any) => {
    return await auth(c.env.DB, c.env.LUCIA_KV, c.env).api.getSession({
        headers: c.req.raw.headers
    });
};

// ... (endpoints remain the same) ...

// Export the Astro API handler
export const ALL = async (context: APIContext) => {
  return app.fetch(context.request, { 
    ...context.locals.runtime.env 
  });
};
