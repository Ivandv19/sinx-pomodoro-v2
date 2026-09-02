// Hono
import type { OpenAPIHono } from "@hono/zod-openapi";
// Drizzle
import { and, count, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
// Schema
import { pomodoro, tarea } from "../../src/db/schema";
// Helpers & DB
import { dateToTimestampRequired, getDb } from "../_db/db";
// OpenAPI
import {
	crearPomodoroRoute,
	listarPomodorosRoute,
	statsPomodorosRoute,
} from "../_openapi/pomodoros";
import { getSession } from "../_shared/helpers";
import type { Bindings } from "../_shared/types";

// Registra las rutas de pomodoros en la aplicación
export function registerPomodoros(app: OpenAPIHono<{ Bindings: Bindings }>) {
	// POST /api/pomodoros - Registra un pomodoro completado o interrumpido
	app.openapi(crearPomodoroRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Valida y extrae los datos del body (tareaId, status, minutos reales)
		const { tareaId, status, minutesActual, createdAt } = c.req.valid("json");

		// 3. Inserta el pomodoro con 25 minutos planificados por defecto.
		//    createdAt opcional: preserva el momento del historial local (sync)
		const db = getDb(c.env);
		const [row] = await db
			.insert(pomodoro)
			.values({
				tareaId,
				status,
				minutesPlanned: 25,
				minutesActual: minutesActual ?? null,
				createdAt: createdAt ? new Date(createdAt) : new Date(),
			})
			.returning({ id: pomodoro.id });

		// 4. Responde con el pomodoro creado y código 201
		return c.json(
			{
				data: {
					id: row.id,
					tareaId,
					status,
					minutesPlanned: 25,
					minutesActual: minutesActual ?? null,
					createdAt: createdAt ?? Date.now(),
				},
			},
			201,
		);
	});

	// GET /api/pomodoros - Lista pomodoros del día con join a tareas
	app.openapi(listarPomodorosRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Obtiene la fecha del query param o usa la fecha actual
		const { fecha: fechaQuery } = c.req.valid("query");
		const fecha = fechaQuery || new Date().toISOString().split("T")[0];
		// 3. Calcula el inicio y fin del día en timestamp
		const inicioDelDia = new Date(fecha).getTime();
		const finDelDia = inicioDelDia + 86400000;

		// 4. Consulta pomodoros del día con join a tareas para obtener el nombre
		const db = getDb(c.env);
		const rows = await db
			.select({
				id: pomodoro.id,
				tareaId: pomodoro.tareaId,
				status: pomodoro.status,
				minutesPlanned: pomodoro.minutesPlanned,
				minutesActual: pomodoro.minutesActual,
				createdAt: pomodoro.createdAt,
				tareaNombre: tarea.nombre,
			})
			.from(pomodoro)
			.innerJoin(tarea, eq(tarea.id, pomodoro.tareaId))
			.where(
				and(
					eq(tarea.userId, session.user.id),
					gte(pomodoro.createdAt, new Date(inicioDelDia)),
					lt(pomodoro.createdAt, new Date(finDelDia)),
				),
			)
			.orderBy(desc(pomodoro.createdAt));

		// 5. Convierte las fechas a timestamps numéricos y responde
		const results = rows.map((p) => ({
			...p,
			createdAt: dateToTimestampRequired(p.createdAt),
		}));
		return c.json({ data: results }, 200);
	});

	// GET /api/pomodoros/stats - Estadísticas del día (total de pomodoros y tiempo acumulado)
	app.openapi(statsPomodorosRoute, async (c) => {
		// 1. Verifica que el usuario esté autenticado
		const session = await getSession(c);
		if (!session) return c.json({ error: "Unauthorized" }, 401);

		// 2. Obtiene la fecha del query param o usa la fecha actual
		const { fecha: fechaQuery } = c.req.valid("query");
		const fecha = fechaQuery || new Date().toISOString().split("T")[0];
		// 3. Calcula el inicio y fin del día en timestamp
		const inicioDelDia = new Date(fecha).getTime();
		const finDelDia = inicioDelDia + 86400000;

		// 4. Consulta el total de pomodoros y el tiempo acumulado
		//    (solo tareas del usuario autenticado; regla de negocio 2:
		//    los interrumpidos también cuentan)
		const db = getDb(c.env);
		const tareasDelUsuario = db
			.select({ id: tarea.id })
			.from(tarea)
			.where(eq(tarea.userId, session.user.id));
		const [row] = await db
			.select({
				total: count(),
				totalTime: sql<number>`coalesce(SUM(${pomodoro.minutesActual}), 0)`,
			})
			.from(pomodoro)
			.where(
				and(
					inArray(pomodoro.tareaId, tareasDelUsuario),
					gte(pomodoro.createdAt, new Date(inicioDelDia)),
					lt(pomodoro.createdAt, new Date(finDelDia)),
					inArray(pomodoro.status, [
						"completed",
						"completed_early",
						"interrupted",
					]),
				),
			);

		// 5. Responde con las estadísticas
		return c.json({ data: row ?? { total: 0, totalTime: 0 } }, 200);
	});
}
