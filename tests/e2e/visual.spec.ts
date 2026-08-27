// Visual regression con toHaveScreenshot (baselines commiteados)
import { expect, test } from "@playwright/test";
import { mockTurnstile } from "./helpers";

// Solo zonas estáticas: la lista de tareas depende del orden de ejecución de
// los specs y el timer es dinámico. Ver docs/TECHNIQUES.md (ficha visual).
test.describe("visual regression", () => {
	// Página de login sin sesión (storageState vacío explícito)
	test.describe("login sin sesión", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("la página de login coincide con el baseline", async ({ page }) => {
			// El widget Turnstile real se auto-resuelve con latencia variable
			// (estado visual no determinista): se mockea como en el login real
			await mockTurnstile(page);
			await page.goto("/login");
			await page.getByPlaceholder("ejemplo@correo.com").waitFor();
			// Esperar a que fuentes Outfit + Turnstile stub terminen (race de networkidle)
			await page.waitForLoadState("networkidle").catch(() => {});
			await page.waitForTimeout(500);
			await expect(page).toHaveScreenshot("login.png", {
				animations: "disabled",
			});
		});
	});

	// Hero del dashboard (estático; la sesión del setup no trae pomodoro
	// activo en localStorage, así que no aparece el modal de interrupción)
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
