import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearStore, jsonOk, loguear, mockFetch } from "./helpers";

describe("categoriaSlice — categorías", () => {
	let store: ReturnType<typeof crearStore>;

	beforeEach(() => {
		store = crearStore();
	});

	afterEach(() => {
		localStorage.clear();
		vi.unstubAllGlobals();
	});

	it("initCategorias sin sesión no llama a la API", async () => {
		const fetchFn = mockFetch(() => jsonOk([]));
		await store.getState().initCategorias();
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it("initCategorias carga desde la API", async () => {
		loguear(store);
		mockFetch(() => jsonOk([{ id: 1, nombre: "Trabajo" }]));
		await store.getState().initCategorias();
		const s = store.getState();
		expect(s.categorias).toEqual([{ id: 1, nombre: "Trabajo" }]);
		expect(s.cargando).toBe(false);
	});

	it("initCategorias siembra las por defecto cuando viene vacío", async () => {
		loguear(store);
		const fetchFn = mockFetch((url, init) => {
			const method = init?.method ?? "GET";
			if (url === "/api/categorias" && method === "GET") return jsonOk([]);
			if (url === "/api/categorias/seed" && method === "POST")
				return jsonOk([
					{ id: 1, nombre: "Trabajo" },
					{ id: 2, nombre: "Personal" },
				]);
			return jsonOk(null);
		});
		await store.getState().initCategorias();
		expect(fetchFn).toHaveBeenCalledWith(
			"/api/categorias/seed",
			expect.anything(),
		);
		expect(store.getState().categorias).toHaveLength(2);
	});

	it("createCategoria sin sesión no crea", async () => {
		const fetchFn = mockFetch(() => jsonOk({}));
		const cat = await store.getState().createCategoria("X");
		expect(cat).toBeNull();
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it("createCategoria agrega la categoría devuelta por la API", async () => {
		loguear(store);
		mockFetch((url, init) => {
			const method = init?.method ?? "GET";
			if (url === "/api/categorias" && method === "POST")
				return jsonOk({ id: 7, nombre: "Estudio" });
			return jsonOk(null);
		});
		const cat = await store.getState().createCategoria("Estudio");
		expect(cat?.id).toBe(7);
		expect(store.getState().categorias).toContainEqual({
			id: 7,
			nombre: "Estudio",
		});
	});

	it("updateCategoria actualiza la API y el store", async () => {
		loguear(store);
		mockFetch((url, init) => {
			const method = init?.method ?? "GET";
			if (url === "/api/categorias" && method === "GET")
				return jsonOk([{ id: 1, nombre: "Antes" }]);
			if (url === "/api/categorias/1" && method === "PATCH")
				return jsonOk({ success: true });
			return jsonOk(null);
		});
		await store.getState().initCategorias();
		await store.getState().updateCategoria(1, { nombre: "Después" });
		expect(store.getState().categorias).toEqual([{ id: 1, nombre: "Después" }]);
	});

	it("deleteCategoria elimina la categoría del store", async () => {
		loguear(store);
		mockFetch((url, init) => {
			const method = init?.method ?? "GET";
			if (url === "/api/categorias" && method === "GET")
				return jsonOk([
					{ id: 1, nombre: "A" },
					{ id: 2, nombre: "B" },
				]);
			if (url === "/api/categorias/1" && method === "DELETE")
				return jsonOk({ success: true });
			return jsonOk(null);
		});
		await store.getState().initCategorias();
		await store.getState().deleteCategoria(1);
		expect(store.getState().categorias).toEqual([{ id: 2, nombre: "B" }]);
	});
});
