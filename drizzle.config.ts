import { defineConfig } from "drizzle-kit";

/**
 * Configuración principal de Drizzle Kit para Tempo
 * Define la ruta del esquema fuente y las credenciales para sincronizar migraciones con Cloudflare D1.
 */
export default defineConfig({
	// Esquema fuente de la base de datos (source of truth)
	schema: "./src/db/schema.ts",

	// Directorio de salida donde se generan las migraciones SQL
	out: "./drizzle",

	// Dialecto y driver HTTP de Cloudflare D1
	dialect: "sqlite",
	driver: "d1-http",

	// Credenciales de acceso a Cloudflare D1 obtenidas de variables de entorno
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
		databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || "",
		token: process.env.CLOUDFLARE_API_TOKEN || "",
	},
});
