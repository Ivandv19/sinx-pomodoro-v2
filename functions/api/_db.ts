// Drizzle
import { drizzle } from "drizzle-orm/d1";
// Schema
import * as schema from "../../src/db/schema";
// Helpers
import type { Bindings } from "./_helpers";

// Instancia de Drizzle tipada contra D1 (source of truth: src/db/schema.ts)
export const getDb = (env: Bindings) => drizzle(env.DB, { schema });

// Convierte fechas de Drizzle (Date) a timestamps numéricos para las respuestas REST
export const toMs = (d: Date | null | undefined): number | null =>
	d ? d.getTime() : null;

// Igual que toMs pero para columnas no-nullables (createdAt)
export const toMsReq = (d: Date): number => d.getTime();
