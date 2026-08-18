import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearStore, jsonOk, loguear, mockFetch } from "./helpers";

describe("pomodoroSlice — pomodoros (reglas de negocio)", () => {
	let store: ReturnType<typeof crearStore>;

	beforeEach(() => {
		store = crearStore();
	});

	afterEach(() => {
		localStorage.clear();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it("iniciar crea un pomodoro de 25 minutos y lo persiste", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
		store.getState().iniciar(1);
		const p = store.getState().pomodoroActivo;
		expect(p?.tareaId).toBe(1);
		expect(p?.minutesPlanned).toBe(25);
		expect(p?.status).toBe("active");
		const persisted = JSON.parse(
			localStorage.getItem("pomodoro_active_session") ?? "null",
		);
		expect(persisted?.tareaId).toBe(1);
	});

	it("iniciar respeta el tiempo pendiente de la tarea", () => {
		vi.useFakeTimers();
		store.setState({ tareasPendientes: { 2: 900 } });
		store.getState().iniciar(2);
		expect(store.getState().pomodoroActivo?.minutesPlanned).toBe(15);
	});

	it("completar offline registra completed con synced false y limpia", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
		store.setState({
			tareas: [
				{
					id: 1,
					nombre: "Tarea A",
					categoriaId: null,
					estado: "pending",
					createdAt: 1,
					completedAt: null,
				},
			],
		});
		store.getState().iniciar(1);
		await store.getState().completar();
		const s = store.getState();
		expect(s.pomodoroActivo).toBeNull();
		expect(s.history).toHaveLength(1);
		expect(s.history[0]).toMatchObject({
			status: "completed",
			synced: false,
			minutes: 25,
			tareaId: 1,
			tareaNombre: "Tarea A",
		});
		expect(localStorage.getItem("pomodoro_active_session")).toBeNull();
	});

	it("completar sin sesión activa no hace nada", async () => {
		await store.getState().completar();
		expect(store.getState().history).toHaveLength(0);
	});

	it("completar online con id real sincroniza y marca synced", async () => {
		loguear(store);
		const fetchFn = mockFetch((url, init) => {
			const method = init?.method ?? "GET";
			if (url === "/api/pomodoros" && method === "POST")
				return jsonOk({ success: true });
			return jsonOk(null);
		});
		store.setState({
			tareas: [
				{
					id: 5,
					nombre: "Real",
					categoriaId: null,
					estado: "pending",
					createdAt: 1,
					completedAt: null,
				},
			],
		});
		store.getState().iniciar(5);
		await store.getState().completar();
		expect(fetchFn).toHaveBeenCalledWith("/api/pomodoros", expect.anything());
		expect(store.getState().history[0].synced).toBe(true);
	});

	it("completar online con id local crea la tarea al vuelo y traduce", async () => {
		loguear(store);
		const fetchFn = mockFetch((url, init) => {
			const method = init?.method ?? "GET";
			if (url === "/api/tareas" && method === "POST")
				return jsonOk({
					id: 500,
					nombre: "Tarea",
					categoriaId: null,
					estado: "pending",
					createdAt: 2,
					completedAt: null,
				});
			if (url === "/api/pomodoros" && method === "POST")
				return jsonOk({ success: true });
			return jsonOk(null);
		});
		const idLocal = 9999999;
		store.getState().iniciar(idLocal);
		await store.getState().completar();
		// el mapa tempo_id_map registró la traducción
		const mapa = JSON.parse(localStorage.getItem("tempo_id_map") ?? "{}");
		expect(mapa[idLocal]).toBe(500);
		// el POST de pomodoro usó el id real
		const usoIdReal = fetchFn.mock.calls.some(([, init]) =>
			String(init?.body ?? "").includes('"tareaId":500'),
		);
		expect(usoIdReal).toBe(true);
	});

	it("completar online con fallo HTTP registra local sin synced", async () => {
		loguear(store);
		mockFetch(() => new Response("boom", { status: 500 }));
		store.setState({
			tareas: [
				{
					id: 7,
					nombre: "F",
					categoriaId: null,
					estado: "pending",
					createdAt: 1,
					completedAt: null,
				},
			],
		});
		store.getState().iniciar(7);
		await store.getState().completar();
		const s = store.getState();
		expect(s.history).toHaveLength(1);
		expect(s.history[0].status).toBe("completed");
		expect(s.history[0].synced).toBe(false);
		expect(s.toasts.some((t) => t.type === "error")).toBe(false);
	});

	it("completar online con fallo de red registra local y muestra error", async () => {
		loguear(store);
		mockFetch(() => {
			throw new Error("Network down");
		});
		store.setState({
			tareas: [
				{
					id: 8,
					nombre: "F",
					categoriaId: null,
					estado: "pending",
					createdAt: 1,
					completedAt: null,
				},
			],
		});
		store.getState().iniciar(8);
		await store.getState().completar();
		const s = store.getState();
		expect(s.history).toHaveLength(1);
		expect(s.history[0].status).toBe("completed");
		expect(s.history[0].synced).toBe(false);
		expect(s.toasts.some((t) => t.type === "error")).toBe(true);
	});

	it("interrumpir guarda el tiempo restante y registra interrupted", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
		store.setState({
			tareas: [
				{
					id: 3,
					nombre: "T",
					categoriaId: null,
					estado: "pending",
					createdAt: 1,
					completedAt: null,
				},
			],
		});
		store.getState().iniciar(3);
		await store.getState().interrumpir(10);
		const s = store.getState();
		expect(s.tareasPendientes[3]).toBe((25 - 10) * 60);
		expect(s.history[0].status).toBe("interrupted");
		expect(s.history[0].minutes).toBe(10);
	});

	it("interrumpir con 0 minutos restantes no deja pendiente", async () => {
		vi.useFakeTimers();
		store.setState({
			tareas: [
				{
					id: 4,
					nombre: "T",
					categoriaId: null,
					estado: "pending",
					createdAt: 1,
					completedAt: null,
				},
			],
		});
		store.getState().iniciar(4);
		await store.getState().interrumpir(25);
		expect(store.getState().tareasPendientes[4]).toBeUndefined();
	});

	it("completar limpia el tiempo pendiente de la tarea", async () => {
		vi.useFakeTimers();
		store.setState({ tareasPendientes: { 1: 600 } });
		store.getState().iniciar(1);
		await store.getState().completar();
		expect(store.getState().tareasPendientes[1]).toBeUndefined();
	});

	it("restaurar recupera la sesión persistida tras recargar", () => {
		vi.useFakeTimers();
		store.getState().iniciar(1);
		const storeRecargado = crearStore();
		const restaurado = storeRecargado.getState().restaurar();
		expect(restaurado?.tareaId).toBe(1);
		expect(storeRecargado.getState().pomodoroActivo?.tareaId).toBe(1);
	});

	it("restaurar sin sesión devuelve null", () => {
		expect(store.getState().restaurar()).toBeNull();
	});

	it("reset limpia la sesión activa", () => {
		vi.useFakeTimers();
		store.getState().iniciar(1);
		store.getState().reset();
		expect(store.getState().pomodoroActivo).toBeNull();
		expect(localStorage.getItem("pomodoro_active_session")).toBeNull();
	});

	it("clearTareaPendiente elimina solo la tarea indicada", () => {
		store.setState({ tareasPendientes: { 1: 600, 2: 300 } });
		store.getState().clearTareaPendiente(1);
		expect(store.getState().tareasPendientes).toEqual({ 2: 300 });
		expect(localStorage.getItem("pomodoro_remaining")).toContain("2");
	});

	it("traducirSesionActiva traduce el id de la sesión en curso", () => {
		vi.useFakeTimers();
		store.getState().iniciar(9);
		store.getState().traducirSesionActiva(42);
		expect(store.getState().pomodoroActivo?.tareaId).toBe(42);
		const persisted = JSON.parse(
			localStorage.getItem("pomodoro_active_session") ?? "null",
		);
		expect(persisted?.tareaId).toBe(42);
	});

	it("init online mapea el historial de la nube con synced true", async () => {
		loguear(store);
		mockFetch((url) => {
			if (url === "/api/pomodoros")
				return jsonOk([
					{
						id: 1,
						tareaId: 1,
						status: "completed",
						minutesActual: 25,
						createdAt: 1780000000000,
					},
				]);
			return jsonOk([]);
		});
		await store.getState().initPomodoros();
		const entry = store.getState().history[0];
		expect(entry.synced).toBe(true);
		expect(entry.status).toBe("completed");
		expect(entry.minutes).toBe(25);
		expect(entry.startTime).toBe(
			new Date(1780000000000 - 25 * 60000).toISOString(),
		);
	});

	it("init offline combina el historial de localStorage", async () => {
		const previa = [
			{
				id: 1,
				type: "focus",
				minutes: 25,
				startTime: "a",
				endTime: "b",
				status: "completed",
				synced: false,
			},
		];
		localStorage.setItem("pomodoro_history", JSON.stringify(previa));
		await store.getState().initPomodoros();
		expect(store.getState().history).toEqual(previa);
	});

	it("guardarLocal registra con startTime reconstruido", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-17T12:25:00Z"));
		store.getState().guardarLocal("focus", 25);
		const entry = store.getState().history[0];
		expect(entry.startTime).toBe("2026-08-17T12:00:00.000Z");
		expect(entry.endTime).toBe("2026-08-17T12:25:00.000Z");
	});
});
