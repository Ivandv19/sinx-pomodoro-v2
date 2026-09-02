// Tests unitarios de usuario (estado de sesión y autenticación)
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearStore } from "./helpers";

describe("userSlice — sesión y autenticación", () => {
	let store: ReturnType<typeof crearStore>;

	beforeEach(() => {
		store = crearStore();
	});

	afterEach(() => {
		localStorage.clear();
		vi.unstubAllGlobals();
	});

	it("estado inicial: deslogueado y cargando", () => {
		const s = store.getState();
		expect(s.user).toBeNull();
		expect(s.isLoggedIn).toBe(false);
		expect(s.sessionLoading).toBe(true);
	});

	it("setUser(null) desloguea y termina la carga", () => {
		store.getState().setUser(null);
		const s = store.getState();
		expect(s.user).toBeNull();
		expect(s.isLoggedIn).toBe(false);
		expect(s.sessionLoading).toBe(false);
	});

	it("setUser con sesión mapea el usuario y loguea", () => {
		store.getState().setUser({
			user: { id: "user-1", email: "test@tempo.dev", name: "Test" },
		});
		const s = store.getState();
		expect(s.isLoggedIn).toBe(true);
		expect(s.sessionLoading).toBe(false);
		expect(s.user).toEqual({
			id: "user-1",
			email: "test@tempo.dev",
			name: "Test",
		});
	});

	it("setSessionDone solo termina la carga", () => {
		store.getState().setSessionDone();
		const s = store.getState();
		expect(s.sessionLoading).toBe(false);
		expect(s.isLoggedIn).toBe(false);
	});
});
