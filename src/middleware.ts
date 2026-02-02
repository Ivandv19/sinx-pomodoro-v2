import { defineMiddleware } from "astro:middleware";
import { initializeLucia } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
    // 1. Check if we have access to the Cloudflare environment (D1)
    if (!context.locals.runtime?.env?.DB) {
        // If meant to happen in dev without wrangler proxy, we might need a fallback or just pass
        console.warn("D1 Database not found in context.locals.runtime.env");
        context.locals.user = null;
        context.locals.session = null;
        return next();
    }

    const db = context.locals.runtime.env.DB;
    const lucia = initializeLucia(db);

    // 2. Read session cookie
    const sessionId = context.cookies.get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
        context.locals.user = null;
        context.locals.session = null;
        return next();
    }

    // ⚡ OPTIMIZACIÓN KV: Intentar leer del caché primero
    // check if runtime and env are available
    const kv = context.locals.runtime.env.SESSION;
    let user = null;
    let session = null;

    if (kv) {
        try {
            const cachedUser = await kv.get(sessionId);
            if (cachedUser) {
                 // ¡HIT! Encontramos al usuario en caché. Nos ahorramos llamar a D1.
                 // El caché guarda el objeto { user, session } serializado
                 const result = JSON.parse(cachedUser);
                 user = result.user;
                 session = result.session;
            }
        } catch (e) {
            console.error("Error reading/parsing session from KV", e);
            // If cache is corrupted, proceed as if it's a miss
        }
    }

    // Si NO estaba en caché (MISS) o falló, preguntamos a la Base de Datos (Source of Truth)
    if (!session) {
        const result = await lucia.validateSession(sessionId);
        user = result.user;
        session = result.session;

        // Si fue válido, guardamos en caché para la próxima (Write-Through)
        if (session && user && kv) {
            // Guardamos por 24 horas (86400 segundos) para reducir escrituras en KV
            await kv.put(sessionId, JSON.stringify({ user, session }), { expirationTtl: 60 * 60 * 24 }); 
        }
    }

    // 4. Handle cookie refreshing
    if (session && session.fresh) {
        const sessionCookie = lucia.createSessionCookie(session.id);
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }
    if (!session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        context.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    }

    // 5. Set locals
    context.locals.session = session;
    context.locals.user = user;

    return next();
});
