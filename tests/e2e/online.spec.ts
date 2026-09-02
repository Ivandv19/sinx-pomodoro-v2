// Valida flujo completo online: crear tarea, registrar pomodoro y persistir en la nube
import { expect, test } from "@playwright/test";

const NOMBRE = `E2E online ${Date.now()}`;

test("crear tarea online y registrarla en la nube", async ({ page }) => {
	// 1. Crea la tarea e inicia el pomodoro
	await page.goto("/");
	await page.getByPlaceholder("Nueva tarea...").fill(NOMBRE);
	await page.getByRole("button", { name: "Crear y empezar" }).click();

	await expect(page.getByRole("heading", { name: NOMBRE })).toBeVisible();
	const activa = await page.evaluate(() =>
		localStorage.getItem("pomodoro_active_session"),
	);
	expect(activa).not.toBeNull();

	// 2. Simula paso del tiempo (26 min) para completar el pomodoro
	await page.evaluate(() => {
		const raw = localStorage.getItem("pomodoro_active_session");
		if (!raw) throw new Error("se esperaba una sesión activa");
		const s = JSON.parse(raw);
		s.startedAt = Date.now() - 26 * 60 * 1000;
		localStorage.setItem("pomodoro_active_session", JSON.stringify(s));
	});
	await page.reload();

	// 3. Resuelve modales de reanudación y confirmación
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

	// 4. Confirma registro único de la tarea en la API
	const res = await page.request.get("/api/tareas");
	expect(res.ok()).toBeTruthy();
	const body = JSON.stringify(await res.json());
	expect(body.match(new RegExp(NOMBRE, "g"))).toHaveLength(1);
});
