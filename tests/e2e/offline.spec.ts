import { expect, test } from "@playwright/test";

const NOMBRE = `E2E offline ${Date.now()}`;

test("tarea creada sin red se sincroniza al reconectar sin duplicarse", async ({
	page,
}) => {
	// sin red: toda petición a la API aborta
	await page.route("**/api/**", (r) => r.abort());
	await page.goto("/");
	await page.getByPlaceholder("Nueva tarea...").fill(NOMBRE);
	await page.getByRole("button", { name: "Crear y empezar" }).click();
	await expect(page.getByRole("heading", { name: NOMBRE })).toBeVisible();

	// persiste tras recargar sin red
	await page.reload();
	await expect(page.getByRole("heading", { name: NOMBRE })).toBeVisible();

	// reconectar: el sync sube la tarea y no debe duplicarla
	await page.unroute("**/api/**");
	await page.reload();
	await expect(page.getByRole("heading", { name: NOMBRE })).toHaveCount(1);

	const res = await page.request.get("/api/tareas");
	expect(res.ok()).toBeTruthy();
	const body = JSON.stringify(await res.json());
	expect(body.match(new RegExp(NOMBRE, "g"))).toHaveLength(1);
});
