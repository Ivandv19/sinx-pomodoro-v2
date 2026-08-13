// Hono
import type { OpenAPIHono } from "@hono/zod-openapi";
// Drizzle
import { and, asc, eq, gte, lt } from "drizzle-orm";
// Schema
import { break_ } from "../../../src/db/schema";
// Helpers
import { getDb, toMs, toMsReq } from "../_db";
import type { Bindings } from "../_helpers";
import { getSession } from "../_helpers";
// OpenAPI
import { crearBreakRoute, listarBreaksRoute } from "../openapi/breaks";

// Registra las rutas de descansos en la aplicación
export function registerBreaks(app: OpenAPIHono<{ Bindings: Bindings }>) {
	// POST /api/breaks - Registra un descanso completado o saltado
	app.openapi(crearBreakRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Valida y extrae los datos del body (tipo, status, minutos reales)
		const { tipo, status, minutesActual } = c.req.valid("json");
		// 3. Calcula los minutos planificados: 15 para largo, 5 para corto
		const minutesPlanned = tipo === "long" ? 15 : 5;

		// 4. Inserta el descanso en la base de datos
		const db = getDb(c.env);
		const [row] = await db
			.insert(break_)
			.values({
				userId: session.user.id,
				tipo,
				status,
				minutesPlanned,
				minutesActual: minutesActual ?? null,
				createdAt: new Date(),
			})
			.returning({ id: break_.id });

		// 5. Responde con el descanso creado y código 201
		return c.json(
			{
				data: {
					id: row.id,
					tipo,
					status,
					minutesPlanned,
					minutesActual: minutesActual ?? null,
					createdAt: Date.now(),
					completedAt: null,
				},
			},
			201,
		);
	});

	// GET /api/breaks - Lista descansos del día con filtro de fecha opcional
	app.openapi(listarBreaksRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Obtiene la fecha del query param o usa la fecha actual
		const { fecha: fechaQuery } = c.req.valid("query");
		const fecha = fechaQuery || new Date().toISOString().split("T")[0];
		// 3. Calcula el inicio y fin del día en timestamp
		const inicioDelDia = new Date(fecha).getTime();
		const finDelDia = inicioDelDia + 86400000;

		// 4. Consulta los descansos del usuario en ese rango de fecha
		const db = getDb(c.env);
		const rows = await db
			.select({
				id: break_.id,
				tipo: break_.tipo,
				status: break_.status,
				minutesPlanned: break_.minutesPlanned,
				minutesActual: break_.minutesActual,
				createdAt: break_.createdAt,
				completedAt: break_.completedAt,
			})
			.from(break_)
			.where(
				and(
					eq(break_.userId, session.user.id),
					gte(break_.createdAt, new Date(inicioDelDia)),
					lt(break_.createdAt, new Date(finDelDia)),
				),
			)
			.orderBy(asc(break_.createdAt));

		// 5. Convierte las fechas a timestamps numéricos y responde
		const results = rows.map((b) => ({
			...b,
			createdAt: toMsReq(b.createdAt),
			completedAt: toMs(b.completedAt),
		}));
		return c.json({ data: results }, 200);
	});
}
