import { defineConfig } from "@playwright/test";

const BINDING_SECRET_TEST =
	"--binding TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA";
const BASE =
	"wrangler pages dev dist/ --compatibility-date=2026-04-30 --ip localhost";

export default defineConfig({
	testDir: "./tests/e2e",
	timeout: 45_000,
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
	projects: [
		{ name: "setup", testMatch: /auth\.setup\.ts/ },
		{
			name: "e2e",
			testIgnore: /resiliencia\.spec\.ts/,
			dependencies: ["setup"],
			use: { storageState: "tests/e2e/.state/storageState.json" },
		},
		{
			name: "resiliencia",
			testMatch: /resiliencia\.spec\.ts/,
			dependencies: ["setup"],
			use: { baseURL: "http://localhost:4322" },
		},
		{
			name: "mobile",
			testMatch: /online\.spec\.ts/,
			dependencies: ["setup"],
			use: {
				storageState: "tests/e2e/.state/storageState.json",
				viewport: { width: 390, height: 844 },
			},
		},
	],
	webServer: [
		{
			command: "bun tests/e2e/hashy-stub.ts",
			url: "http://localhost:3010/health",
			timeout: 30_000,
			reuseExistingServer: false,
		},
		{
			// El health check apunta a una ruta API: fuerza la compilación
			// on-demand del bundle de funciones antes de los tests (wrangler
			// pages dev aborta la primera conexión mientras compila)
			command: `${BASE} --port 4321 ${BINDING_SECRET_TEST}`,
			url: "http://localhost:4321/api/auth/get-session",
			timeout: 60_000,
			reuseExistingServer: false,
		},
		{
			command: `${BASE} --port 4322 ${BINDING_SECRET_TEST} --binding HASH_SERVICE_URL=http://localhost:3999 --binding BETTER_AUTH_URL=http://localhost:4322`,
			url: "http://localhost:4322/api/auth/get-session",
			timeout: 60_000,
			reuseExistingServer: false,
		},
	],
});
