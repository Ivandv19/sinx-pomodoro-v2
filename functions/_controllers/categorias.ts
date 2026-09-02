// Hono
import type { OpenAPIHono } from "@hono/zod-openapi";
// Drizzle
import { asc, desc, eq } from "drizzle-orm";
// Schema
import { categoria } from "../../src/db/schema";
// Helpers & DB
import { getDb } from "../_db/db";
// OpenAPI
import {
	listarCategoriasRoute,
	seedCategoriasRoute,
} from "../_openapi/categorias";
import { getSession } from "../_shared/helpers";
import type { Bindings } from "../_shared/types";

// Registra las rutas de categorías en la aplicación
export function registerCategorias(app: OpenAPIHono<{ Bindings: Bindings }>) {
	// GET /api/categorias - Lista todas las categorías del usuario autenticado
	app.openapi(listarCategoriasRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Consulta todas las categorías del usuario ordenadas por id
		const db = getDb(c.env);
		const results = await db
			.select({ id: categoria.id, nombre: categoria.nombre })
			.from(categoria)
			.where(eq(categoria.userId, session.user.id))
			.orderBy(asc(categoria.id));

		// 3. Responde con la lista de categorías
		return c.json({ data: results }, 200);
	});

	// POST /api/categorias/seed - Crea las 3 categorías por defecto (Trabajo, Estudio, Personal)
	app.openapi(seedCategoriasRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Define las tres categorías por defecto para el usuario
		const userId = session.user.id;
		const defaults = [
			{ nombre: "Trabajo", userId },
			{ nombre: "Estudio", userId },
			{ nombre: "Personal", userId },
		];

		// 3. Inserta las categorías en la base de datos
		const db = getDb(c.env);
		await db.insert(categoria).values(defaults);

		// 4. Consulta las categorías recién creadas
		const results = await db
			.select({ id: categoria.id, nombre: categoria.nombre })
			.from(categoria)
			.where(eq(categoria.userId, userId))
			.orderBy(desc(categoria.id))
			.limit(3);

		// 5. Responde con las categorías creadas
		return c.json({ data: results }, 200);
	});
}
