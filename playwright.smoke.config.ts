import { defineConfig } from "@playwright/test";

const BINDING_SECRET_TEST =
	"--binding TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA";

// Smoke contra el dev server local con hashy REAL (Docker en :3010) —
// a diferencia de la suite E2E, aquí NO se levanta el stub.
export default defineConfig({
	testDir: "./tests/smoke",
	timeout: 60_000,
	expect: { timeout: 10_000 },
	fullyParallel: false,
	workers: 1,
	retries: 0,
	reporter: [["list"]],
	use: {
		baseURL: "http://localhost:4321",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [{ name: "smoke", testMatch: /smoke\.spec\.ts/ }],
	webServer: [
		{
			// Health check en una ruta API: espera la compilación on-demand
			// del bundle de funciones (wrangler pages dev aborta la primera
			// conexión mientras compila)
			command: `wrangler pages dev dist/ --compatibility-date=2026-04-30 --ip localhost --port 4321 ${BINDING_SECRET_TEST}`,
			url: "http://localhost:4321/api/auth/get-session",
			timeout: 60_000,
			reuseExistingServer: false,
		},
	],
});
