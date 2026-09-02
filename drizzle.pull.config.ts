import { defineConfig } from "drizzle-kit";

/**
 * Configuración de Drizzle Kit para inspección y extracción de esquemas remotos (drizzle-kit pull)
 * Descarga el estado actual de la base de datos D1 remota en un directorio temporal de Wrangler.
 */
export default defineConfig({
	// Esquema local de referencia
	schema: "./src/db/schema.ts",

	// Directorio de salida temporal para volcar el esquema introspeccionado
	out: ".wrangler/drizzle-pull",

	// Dialecto y driver HTTP de Cloudflare D1
	dialect: "sqlite",
	driver: "d1-http",

	// Credenciales de acceso a Cloudflare D1
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
		databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || "",
		token: process.env.CLOUDFLARE_API_TOKEN || "",
	},
});
