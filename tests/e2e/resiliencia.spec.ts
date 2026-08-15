import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("el login falla limpio cuando el servicio de hash no responde", async ({
	page,
}) => {
	await login(page, "e2e@tempo.dev", "TestE2E!pass2026");

	await expect(
		page.getByText(/Ocurrió un error|Servicio de autenticación no disponible/),
	).toBeVisible();
	await expect(page).toHaveURL(/login/);
});
