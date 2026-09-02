// Tests unitarios de notificaciones toast (ciclo de vida y auto-remoción)
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearStore } from "./helpers";

describe("toastSlice — notificaciones", () => {
	let store: ReturnType<typeof crearStore>;

	beforeEach(() => {
		store = crearStore();
	});

	afterEach(() => {
		localStorage.clear();
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it("addToast agrega con id incremental", () => {
		store.getState().addToast("hola", "info");
		const [toast] = store.getState().toasts;
		expect(toast.message).toBe("hola");
		expect(toast.type).toBe("info");
		expect(toast.id).toMatch(/^toast-\d+$/);
	});

	it("addToast soporta título", () => {
		store.getState().addToast("mensaje", "success", "Título");
		const [toast] = store.getState().toasts;
		expect(toast.title).toBe("Título");
	});

	it("los toasts se auto-eliminan a los 5 segundos", () => {
		vi.useFakeTimers();
		store.getState().addToast("temporal", "error");
		expect(store.getState().toasts).toHaveLength(1);
		vi.advanceTimersByTime(5000);
		expect(store.getState().toasts).toHaveLength(0);
	});

	it("removeToast elimina manualmente", () => {
		vi.useFakeTimers();
		store.getState().addToast("uno", "info");
		store.getState().addToast("dos", "info");
		const [primero] = store.getState().toasts;
		store.getState().removeToast(primero.id);
		expect(store.getState().toasts).toHaveLength(1);
		expect(store.getState().toasts[0].message).toBe("dos");
	});
});
