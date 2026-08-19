// Warm-up: fuerza la compilación on-demand del bundle de funciones de
// wrangler pages dev ANTES de los tests reales. La primera request a una
// ruta API compila el bundle y puede abortar conexiones concurrentes,
// por eso este spec corre primero (nombre 00-*) para absorber esa ventana.
import { expect, test } from "@playwright/test";

const RUTAS = [
	"/api/auth/get-session",
	"/api/tareas",
	"/api/categorias",
	"/api/pomodoros",
	"/api/pomodoros/stats",
	"/api/breaks",
];

test("warm-up: el bundle de funciones responde en todas las rutas", async ({
	request,
}) => {
	for (const ruta of RUTAS) {
		// Reintenta hasta 3 veces: la primera request compila el bundle y
		// puede abortarse (ventana conocida del webServer).
		let ultimoEstado = 0;
		for (let intento = 0; intento < 3; intento++) {
			try {
				const res = await request.get(ruta);
				ultimoEstado = res.status();
				if (ultimoEstado < 500) break;
			} catch {
				// conexión cortada durante la compilación: reintentar
			}
			await new Promise((resolver) => setTimeout(resolver, 2000));
		}
		expect(ultimoEstado).toBeLessThan(500);
	}
});
