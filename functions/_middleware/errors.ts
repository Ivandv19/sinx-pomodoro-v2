// Hono
import type { OpenAPIHono } from "@hono/zod-openapi";
// Zod
import { ZodError } from "zod";
// Helpers
import type { Bindings } from "../_shared/types";

// Registra el manejo global de errores y 404 de la API
export function registerErrors(app: OpenAPIHono<{ Bindings: Bindings }>) {
	// 404 JSON para rutas no registradas
	app.notFound((c) => c.json({ error: "Not found" }, 404));

	// Errores no capturados: zod -> 400 con issues, resto -> 500 genérico + request-id
	app.onError((err, c) => {
		const requestId = crypto.randomUUID();
		console.error(`[API][${requestId}] ${c.req.method} ${c.req.path}`, err);

		if (err instanceof ZodError) {
			return c.json({ error: { issues: err.issues } }, 400);
		}

		return c.json({ error: "Internal server error" }, 500);
	});
}
