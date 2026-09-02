// Drizzle
import { drizzle } from "drizzle-orm/d1";
// Schema
import * as schema from "../../src/db/schema";
// Helpers
import type { Bindings } from "../_shared/types";

// Instancia de Drizzle tipada contra D1 (source of truth: src/db/schema.ts)
export const getDb = (env: Bindings) => drizzle(env.DB, { schema });

// Convierte Date (o null) a timestamp en milisegundos para respuestas API
export const dateToTimestamp = (d: Date | null | undefined): number | null =>
	d ? d.getTime() : null;

// Convierte Date requerido a timestamp en milisegundos para respuestas API
export const dateToTimestampRequired = (d: Date): number => d.getTime();
