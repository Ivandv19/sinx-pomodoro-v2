// Auditoría de accesibilidad WCAG con axe-core
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Exclusión temporal por contraste en tema dark
const EXCLUSIONES_DOCUMENTADAS = ["color-contrast"];

test.describe("accesibilidad", () => {
	// Página de login sin sesión
	test.describe("login sin sesión", () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test("la página de login no tiene violaciones WCAG", async ({ page }) => {
			await page.goto("/login");
			await page.getByPlaceholder("ejemplo@correo.com").waitFor();

			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "best-practice"])
				.analyze();

			expect(
				results.violations.filter(
					(v) => !EXCLUSIONES_DOCUMENTADAS.includes(v.id),
				),
			).toEqual([]);
		});
	});

	// Dashboard con sesión
	test("el dashboard no tiene violaciones WCAG", async ({ page }) => {
		await page.goto("/");
		await page.getByRole("button", { name: /salir/i }).waitFor();

		const results = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "best-practice"])
			.analyze();

		expect(
			results.violations.filter(
				(v) => !EXCLUSIONES_DOCUMENTADAS.includes(v.id),
			),
		).toEqual([]);
	});
});
