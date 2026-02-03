import type { PagesFunction, KVNamespace, D1Database } from "@cloudflare/workers-types";
import { auth } from "../src/lib/auth";

export const onRequest: PagesFunction<{
  DB: D1Database;
  LUCIA_KV: KVNamespace;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}> = async (context) => {
    const { request, env, next, data } = context;
    
    // Solo procesar si tenemos lo necesario
    if (env.DB) {
        try {
            const session = await auth(env.DB, env.LUCIA_KV, env).api.getSession({
                headers: request.headers as any,
            });

            if (session) {
                // Pasamos los datos al resto de la cadena (Astro y Hono lo verán)
                (data as any).user = session.user;
                (data as any).session = session.session;
            }
        } catch (e) {
            console.error("Auth Middleware Error:", e);
        }
    }

    return next();
};
