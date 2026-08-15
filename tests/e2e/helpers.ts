import { expect, type Page } from "@playwright/test";

export const DUMMY_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

// Turnstile no carga en headless: se mockea el script con un stub que
// resuelve el token dummy (las test keys lo aceptan en siteverify).
export async function mockTurnstile(page: Page) {
	await page.route("**/challenges.cloudflare.com/**", (route) =>
		route.fulfill({
			contentType: "application/javascript",
			body: `window.turnstile = {
				render: (_el, opts) => {
					setTimeout(() => opts.callback && opts.callback("${DUMMY_TOKEN}"), 100);
					return "dummy-widget";
				},
				remove: () => {},
				reset: () => {},
				getResponse: () => "${DUMMY_TOKEN}",
			};`,
		}),
	);
}

export async function login(page: Page, email: string, password: string) {
	await mockTurnstile(page);
	await page.goto("/login");
	await page.getByPlaceholder("ejemplo@correo.com").fill(email);
	await page.getByPlaceholder("••••••••").fill(password);
	await page.getByRole("button", { name: "Entrar" }).click();
}

export async function expectLoginExitoso(page: Page) {
	await expect(page).toHaveURL(/localhost:4321\/(es\/)?$/, { timeout: 15_000 });
}
