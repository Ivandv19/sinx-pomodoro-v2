import { defineMiddleware } from "astro:middleware";
import { auth } from "./lib/auth";

export const onRequest = defineMiddleware(async (context, next) => {
    const db = context.locals.runtime.env.DB;
    const kv = context.locals.runtime.env.LUCIA_KV;
    const session = await auth(db, kv).api.getSession({
        headers: context.request.headers,
    });

    if (session) {
        context.locals.user = session.user;
        context.locals.session = session.session;
    } else {
        context.locals.user = null;
        context.locals.session = null;
    }

    return next();
});
