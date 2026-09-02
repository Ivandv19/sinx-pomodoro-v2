// Tests unitarios de configuración (tema visual e idioma)
import { afterEach, describe, expect, it } from "vitest";
import { crearStore } from "./helpers";

describe("settingsSlice — tema e idioma", () => {
	afterEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute("data-theme");
		document.documentElement.classList.remove("dark");
	});

	it("tema inicial por defecto: business, idioma es", () => {
		const store = crearStore();
		expect(store.getState().theme).toBe("business");
		expect(store.getState().lang).toBe("es");
	});

	it("tema inicial desde localStorage", () => {
		localStorage.setItem("theme", "dark");
		const store = crearStore();
		expect(store.getState().theme).toBe("dark");
	});

	it("setTheme persiste y aplica data-theme + clase dark", () => {
		const store = crearStore();
		store.getState().setTheme("business");
		expect(localStorage.getItem("theme")).toBe("business");
		expect(document.documentElement.getAttribute("data-theme")).toBe(
			"business",
		);
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});

	it("setTheme con otro tema no activa la clase dark", () => {
		const store = crearStore();
		store.getState().setTheme("light");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});

	it("setLang cambia el idioma", () => {
		const store = crearStore();
		store.getState().setLang("en");
		expect(store.getState().lang).toBe("en");
	});
});
