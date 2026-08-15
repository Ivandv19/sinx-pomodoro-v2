import { expect, test } from "@playwright/test";

const NOMBRE = `E2E online ${Date.now()}`;

test("crear tarea online y registrarla en la nube", async ({ page }) => {
	await page.goto("/");
	await page.getByPlaceholder("Nueva tarea...").fill(NOMBRE);
	await page.getByRole("button", { name: "Crear y empezar" }).click();

	// se crea y arranca el pomodoro
	await expect(page.getByRole("heading", { name: NOMBRE })).toBeVisible();
	const activa = await page.evaluate(() =>
		localStorage.getItem("pomodoro_active_session"),
	);
	expect(activa).not.toBeNull();

	// completar el pomodoro retrocediendo el inicio 26 minutos
	await page.evaluate(() => {
		const s = JSON.parse(localStorage.getItem("pomodoro_active_session")!);
		s.startedAt = Date.now() - 26 * 60 * 1000;
		localStorage.setItem("pomodoro_active_session", JSON.stringify(s));
	});
	await page.reload();

	// al recargar aparece el modal de sesión guardada: continuar para
	// que el timer llegue a 0 y pregunte si se completó
	await page
		.getByText(/Sesión interrumpida|¿Terminaste la tarea\?/)
		.first()
		.waitFor();
	if (await page.getByRole("button", { name: "Continuar" }).isVisible()) {
		await page.getByRole("button", { name: "Continuar" }).click();
		await page.getByRole("button", { name: "Sí, completada" }).waitFor({
			timeout: 10_000,
		});
	}
	await page.getByRole("button", { name: "Sí, completada" }).click();

	// la tarea sigue pendiente, sin duplicarse
	await expect(page.getByRole("heading", { name: NOMBRE })).toHaveCount(1);

	// la tarea quedó registrada en la nube, una sola vez
	const res = await page.request.get("/api/tareas");
	expect(res.ok()).toBeTruthy();
	const body = JSON.stringify(await res.json());
	expect(body.match(new RegExp(NOMBRE, "g"))).toHaveLength(1);
});
