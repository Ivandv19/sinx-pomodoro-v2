// Auditoría de accesibilidad con axe-core
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// color-contrast queda excluido como deuda registrada: la paleta del tema
// business (dark) tiene varios componentes con contraste insuficiente
// (badges, cards, timer). Pendiente de rediseño de paleta — ver
// docs/TECHNIQUES.md (ficha de axe-core).
const EXCLUSIONES_DOCUMENTADAS = ["color-contrast"];

test.describe("accesibilidad", () => {
	// Página de login sin sesión (storageState vacío explícito)
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

	// Dashboard con sesión (storageState del setup)
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
