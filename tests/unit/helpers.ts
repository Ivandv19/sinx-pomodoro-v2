// Helpers para los tests unitarios de los slices

import { vi } from "vitest";
import { createStore } from "zustand/vanilla";
import { crearSliceBreaks } from "../../src/stores/slices/breakSlice";
import { crearSliceCategorias } from "../../src/stores/slices/categoriaSlice";
import { crearSlicePomodoros } from "../../src/stores/slices/pomodoroSlice";
import { crearSliceSettings } from "../../src/stores/slices/settingsSlice";
import { crearSliceTareas } from "../../src/stores/slices/tareaSlice";
import { crearToastSlice } from "../../src/stores/slices/toastSlice";
import { crearSliceUsuario } from "../../src/stores/slices/userSlice";
import type { AppState } from "../../src/stores/store";

// Crea un store fresco con los 7 slices (misma composición que store.ts)
export const crearStore = () =>
	createStore<AppState>()((set, get) => {
		const tareaSlice = crearSliceTareas(set, get);
		const pomodoroSlice = crearSlicePomodoros(set, get);
		const toastSlice = crearToastSlice(set);
		const userSlice = crearSliceUsuario(set);
		const settingsSlice = crearSliceSettings(set);
		const categoriaSlice = crearSliceCategorias(set, get);
		const breakSlice = crearSliceBreaks(set, get);

		return {
			...tareaSlice,
			...pomodoroSlice,
			...toastSlice,
			...userSlice,
			...settingsSlice,
			...categoriaSlice,
			...breakSlice,
			initTareas: tareaSlice.init,
			initPomodoros: pomodoroSlice.init,
			initCategorias: categoriaSlice.initCategorias,
		};
	});

// Tipo del store de prueba
export type StoreDePrueba = ReturnType<typeof crearStore>;

// Sesión de prueba para setUser
export const sesionPrueba = {
	user: { id: "user-1", email: "test@tempo.dev", name: "Test" },
};

// Loguea al usuario de prueba en el store
export const loguear = (store: StoreDePrueba) => {
	store.getState().setUser(sesionPrueba);
};

// Respuesta JSON exitosa con { data }
export const jsonOk = (data: unknown) =>
	new Response(JSON.stringify({ data }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});

// Mock de fetch que delega por URL a un handler
export const mockFetch = (
	handler: (url: string, init?: RequestInit) => Response,
) => {
	const fn = vi.fn(
		async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
			const url =
				typeof input === "string"
					? input
					: input instanceof URL
						? input.toString()
						: input.url;
			return handler(url, init);
		},
	);
	vi.stubGlobal("fetch", fn);
	return fn;
};
