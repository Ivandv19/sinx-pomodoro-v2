import { defineMiddleware } from "astro:middleware";
import { initializeLucia } from "./lib/auth";

export const onRequest = defineMiddleware((context, next) => {
    return next();
});
