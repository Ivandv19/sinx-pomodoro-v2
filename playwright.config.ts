import { defineConfig } from "@playwright/test";

const TURNSTILE_TEST = {
	PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
	TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
};

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
	],
	webServer: [
		{
			command: "bun tests/e2e/hashy-stub.ts",
			url: "http://localhost:3010/health",
			timeout: 30_000,
			reuseExistingServer: false,
		},
		{
			command: `${BASE} --port 4321 ${BINDING_SECRET_TEST}`,
			url: "http://localhost:4321",
			timeout: 60_000,
			reuseExistingServer: false,
		},
		{
			command: `${BASE} --port 4322 ${BINDING_SECRET_TEST} --binding HASH_SERVICE_URL=http://localhost:3999 --binding BETTER_AUTH_URL=http://localhost:4322`,
			url: "http://localhost:4322",
			timeout: 60_000,
			reuseExistingServer: false,
		},
	],
});
