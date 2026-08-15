import { test as setup } from "@playwright/test";
import { expectLoginExitoso, login } from "./helpers";

const AUTH_STATE = "tests/e2e/.state/storageState.json";

setup("login como usuario E2E", async ({ page }) => {
	await login(page, "e2e@tempo.dev", "TestE2E!pass2026");
	await expectLoginExitoso(page);
	await page.context().storageState({ path: AUTH_STATE });
});
