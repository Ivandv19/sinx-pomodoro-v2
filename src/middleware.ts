import { defineMiddleware } from "astro:middleware";
import { auth } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
    try {
        const env = context.locals.runtime?.env;
        if (!env || !env.DB) {
            console.error("Missing environment or DB binding in middleware");
            context.locals.user = null;
            context.locals.session = null;
            return next();
        }

        const session = await auth(env.DB, env.LUCIA_KV, env).api.getSession({
            headers: context.request.headers,
        });

        if (session) {
            context.locals.user = session.user;
            context.locals.session = session.session;
        } else {
            context.locals.user = null;
            context.locals.session = null;
        }
    } catch (e) {
        console.error("Auth middleware error:", e);
        context.locals.user = null;
        context.locals.session = null;
    }

    return next();
});
