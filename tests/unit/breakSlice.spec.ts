import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearStore, jsonOk, loguear, mockFetch } from "./helpers";

describe("breakSlice — descansos", () => {
	let store: ReturnType<typeof crearStore>;

	beforeEach(() => {
		store = crearStore();
	});

	afterEach(() => {
		localStorage.clear();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it("iniciarBreak por defecto: corto de 5 minutos y persistido", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
		store.getState().iniciarBreak();
		const b = store.getState().breakActivo;
		expect(b?.tipo).toBe("short");
		expect(b?.minutesPlanned).toBe(5);
		const persisted = JSON.parse(
			localStorage.getItem("break_active_session") ?? "null",
		);
		expect(persisted?.tipo).toBe("short");
	});

	it("iniciarBreak largo: 15 minutos", () => {
		store.getState().iniciarBreak("long");
		expect(store.getState().breakActivo?.minutesPlanned).toBe(15);
	});

	it("completarBreak offline registra en historial y limpia la sesión", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
		store.getState().iniciarBreak();
		await store.getState().completarBreak();
		const s = store.getState();
		expect(s.breakActivo).toBeNull();
		expect(s.breakHistory).toHaveLength(1);
		expect(s.breakHistory[0].status).toBe("completed");
		expect(s.breakHistory[0].synced).toBe(false);
	});

	it("completarBreak online sincroniza con la API", async () => {
		loguear(store);
		const fetchFn = mockFetch((url, init) => {
			const method = init?.method ?? "GET";
			if (url === "/api/breaks" && method === "POST")
				return jsonOk({ success: true });
			return jsonOk(null);
		});
		store.getState().iniciarBreak("short");
		await store.getState().completarBreak();
		expect(fetchFn).toHaveBeenCalledWith("/api/breaks", expect.anything());
		expect(store.getState().breakHistory[0].synced).toBe(true);
	});

	it("completarBreak sin sesión activa no hace nada", async () => {
		await store.getState().completarBreak();
		expect(store.getState().breakHistory).toHaveLength(0);
	});

	it("saltarBreak calcula los minutos transcurridos", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-08-17T12:00:00Z"));
		store.getState().iniciarBreak();
		vi.setSystemTime(new Date("2026-08-17T12:07:30Z"));
		await store.getState().saltarBreak();
		const entry = store.getState().breakHistory[0];
		expect(entry.status).toBe("skipped");
		expect(entry.minutes).toBe(8);
		expect(store.getState().breakActivo).toBeNull();
	});

	it("resetBreak limpia la sesión activa", () => {
		store.getState().iniciarBreak();
		store.getState().resetBreak();
		expect(store.getState().breakActivo).toBeNull();
		expect(localStorage.getItem("break_active_session")).toBeNull();
	});

	it("setBreakHistory reemplaza el historial", () => {
		store.getState().setBreakHistory([]);
		expect(store.getState().breakHistory).toHaveLength(0);
	});

	it("el historial local no excede 200 entradas", async () => {
		vi.useFakeTimers();
		for (let i = 0; i < 205; i++) {
			vi.setSystemTime(new Date(2026, 7, 17, 12, 0, i));
			store.getState().iniciarBreak("short");
			await store.getState().completarBreak();
		}
		expect(store.getState().breakHistory.length).toBeLessThanOrEqual(200);
		const persisted = JSON.parse(localStorage.getItem("break_history") ?? "[]");
		expect(persisted.length).toBeLessThanOrEqual(200);
	});
});
