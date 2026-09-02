// Pruebas de regresión visual sobre elementos estáticos
import { expect, test } from "@playwright/test";
import { mockTurnstile } from "./helpers";

test.describe("visual regression", () => {
	// Login sin sesión
	test.describe("login sin sesión", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("la página de login coincide con el baseline", async ({ page }) => {
			await mockTurnstile(page);
			await page.goto("/login");
			await page.getByPlaceholder("ejemplo@correo.com").waitFor();
			await page.waitForLoadState("networkidle").catch(() => {});
			await page.waitForTimeout(500);
			await expect(page).toHaveScreenshot("login.png", {
				animations: "disabled",
			});
		});
	});

	// Hero del dashboard
	test("el hero del dashboard coincide con el baseline", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /salir/i }).waitFor();
		await page.waitForLoadState("networkidle").catch(() => {});
		await page.waitForTimeout(500);
		await expect(page.getByTestId("hero")).toHaveScreenshot("hero.png", {
			animations: "disabled",
		});
	});
});
