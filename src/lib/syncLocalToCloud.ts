// Orquestación del sync local → nube (ADR-001).
// Importado únicamente por SessionProvider: no hay ciclos de imports.
//
// Flujo: 1) tareas offline → nube (construye el mapa de IDs)
//        2) pomodoros del historial local no sincronizados
//        3) breaks del historial local no sincronizados
//
// Idempotente: cada entrada marcada con synced:true no se vuelve a subir.
// Un fallo de red deja la entrada sin synced → se reintenta en el próximo login.

import type { BreakLogEntry } from "../stores/slices/breakSlice";
import type { LogEntry } from "../stores/slices/pomodoroSlice";
import { useStore } from "../stores/store";
import {
	cargarMapaIds,
	guardarMapaIds,
	subirBreak,
	subirPomodoro,
	traducirTareaId,
} from "./sync";
import type { TareaResponse } from "./validations";

const TAREAS_KEY = "tempo_tareas";

// Tarea local: además de lo que devuelve la API, lleva el flag de sync.
// Los IDs locales se generan con Date.now() + random (≈1.7e12); los IDs
// reales de D1 son secuenciales (AUTOINCREMENT), siempre < 1e12.
type TareaLocal = TareaResponse & { synced?: boolean };

const UMBRAL_ID_REAL = 1_000_000_000_000;

// Lee las tareas offline desde localStorage (con sus IDs inventados)
const cargarTareasLocales = (): TareaLocal[] => {
	if (typeof localStorage === "undefined") return [];
	try {
		const saved = localStorage.getItem(TAREAS_KEY);
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
};

// Reescribe las tareas offline en localStorage con sus IDs reales
const persistirTareasLocales = (tareas: TareaLocal[]) => {
	try {
		localStorage.setItem(TAREAS_KEY, JSON.stringify(tareas));
	} catch {}
};

// Marca como sincronizadas las tareas locales que ya tienen un ID real
// (subidas por un sync anterior): evita re-subirlas en cada login.
const sanearTareasLocales = (locales: TareaLocal[]): TareaLocal[] => {
	const saneadas = locales.map((t) =>
		t.id >= UMBRAL_ID_REAL ? t : { ...t, synced: true },
	);
	persistirTareasLocales(saneadas);
	return saneadas;
};

// 1. Sube las tareas offline, construye el mapa y traduce todo lo que
//    dependa de los IDs inventados (tareasPendientes, sesión activa).
const syncTareasLocales = async (): Promise<void> => {
	const { tareas, setTareas } = useStore.getState();
	const mapa = cargarMapaIds();
	// Poda del mapa: las claves con ID real son residuo del bug de re-subida
	for (const k of Object.keys(mapa).map(Number)) {
		if (k < UMBRAL_ID_REAL) delete mapa[k];
	}
	guardarMapaIds(mapa);

	let locales = cargarTareasLocales();
	if (locales.length === 0) return;
	// Las tareas con ID real ya están en la nube: marcar sincronizadas
	locales = sanearTareasLocales(locales);

	const porSubir = locales.filter(
		(t) => !t.synced && mapa[t.id] === undefined && t.id >= UMBRAL_ID_REAL,
	);
	if (porSubir.length === 0) return;

	const traducidas: TareaLocal[] = [];
	for (const t of porSubir) {
		const idReal = await traducirTareaId({
			tareaId: t.id,
			tareasNube: tareas.filter((x) => x.id < UMBRAL_ID_REAL),
			getNombre: () => t.nombre,
		});
		if (idReal === null) {
			traducidas.push(t); // fallo de red → se reintenta el próximo login
			continue;
		}
		mapa[t.id] = idReal;
		traducidas.push({ ...t, id: idReal, synced: true });
	}
	guardarMapaIds(mapa);
	persistirTareasLocales(traducidas);

	// Las tareas recién creadas en la nube entran al store sustituyendo los IDs locales
	const nuevas = traducidas
		.filter((t) => t.synced)
		.map(({ synced: _synced, ...t }) => t);
	if (nuevas.length > 0) {
		const tareasReales = tareas.filter((x) => x.id < UMBRAL_ID_REAL);
		setTareas([
			...nuevas,
			...tareasReales.filter((x) => !nuevas.some((n) => n.id === x.id)),
		]);
	}

	// Traduce las claves de tareasPendientes (tiempo restante por tarea)
	const { tareasPendientes, setTareasPendientes } = useStore.getState();
	const claves = Object.keys(tareasPendientes).map(Number);
	const tieneClavesLocales = claves.some(
		(k) => mapa[k] !== undefined && k !== mapa[k],
	);
	if (tieneClavesLocales) {
		const traducido: Record<number, number> = {};
		for (const k of claves) {
			const real = mapa[k];
			traducido[real ?? k] = tareasPendientes[k];
		}
		setTareasPendientes(traducido);
		guardarMapaIds(mapa);
	}

	// Traduce el ID de la sesión activa si está en curso
	const { pomodoroActivo } = useStore.getState();
	if (pomodoroActivo && mapa[pomodoroActivo.tareaId] !== undefined) {
		useStore.getState().traducirSesionActiva(mapa[pomodoroActivo.tareaId]);
	}
};

// Lee el historial local de pomodoros desde localStorage. Es la fuente de
// verdad para el sync: el store puede no estar hidratado aún cuando corre
// el sync (SessionProvider lo dispara antes de que init() termine).
const cargarHistorialPomodoro = (): LogEntry[] => {
	if (typeof localStorage === "undefined") return [];
	try {
		const saved = localStorage.getItem("pomodoro_history");
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
};

const persistirHistorialPomodoro = (history: LogEntry[]) => {
	try {
		localStorage.setItem(
			"pomodoro_history",
			JSON.stringify(history.slice(-200)),
		);
	} catch {}
};

// Marca una entrada del historial como sincronizada (localStorage + store)
const marcarPomodoroSynced = (id: number) => {
	const local = cargarHistorialPomodoro().map((e) =>
		e.id === id ? { ...e, synced: true } : e,
	);
	persistirHistorialPomodoro(local);
	const { history, setHistory } = useStore.getState();
	setHistory(history.map((e) => (e.id === id ? { ...e, synced: true } : e)));
};

// Lee el historial local de breaks desde localStorage
const cargarHistorialBreak = (): BreakLogEntry[] => {
	if (typeof localStorage === "undefined") return [];
	try {
		const saved = localStorage.getItem("break_history");
		return saved ? JSON.parse(saved) : [];
	} catch {
		return [];
	}
};

const persistirHistorialBreak = (history: BreakLogEntry[]) => {
	try {
		localStorage.setItem("break_history", JSON.stringify(history.slice(-200)));
	} catch {}
};

// Marca un break del historial como sincronizado (localStorage + store)
const marcarBreakSynced = (id: number) => {
	const local = cargarHistorialBreak().map((b) =>
		b.id === id ? { ...b, synced: true } : b,
	);
	persistirHistorialBreak(local);
	const { breakHistory, setBreakHistory } = useStore.getState();
	setBreakHistory(
		breakHistory.map((b) => (b.id === id ? { ...b, synced: true } : b)),
	);
};

// 2. Sube los pomodoros locales no sincronizados
const syncPomodoros = async (): Promise<void> => {
	const { tareas, isLoggedIn } = useStore.getState();
	if (!isLoggedIn) return;

	const local = cargarHistorialPomodoro();
	const porSubir = local.filter(
		(e: LogEntry) => e.type === "focus" && !e.synced,
	);
	if (porSubir.length === 0) return;

	for (const e of porSubir) {
		const tareaId = await traducirTareaId({
			tareaId: e.tareaId ?? null,
			tareasNube: tareas,
			getNombre: (id) =>
				useStore.getState().tareas.find((t) => t.id === id)?.nombre ??
				e.tareaNombre,
		});
		// Sin tarea no se puede registrar (regla de negocio 1): se crea con
		// el nombre guardado, o se deja pendiente si la creación falla.
		const idFinal = tareaId ?? (await crearTareaFallback(e));
		if (idFinal === null) continue;

		const ok = await subirPomodoro({
			tareaId: idFinal,
			status: e.status ?? "completed",
			minutesActual: e.minutes,
			createdAt: new Date(e.endTime).getTime(),
		});
		if (ok) marcarPomodoroSynced(e.id);
	}
};

// Crea una tarea de respaldo si la entrada no tiene tarea asociada
const crearTareaFallback = async (e: LogEntry): Promise<number | null> => {
	const { createTarea } = useStore.getState();
	const nombre = e.tareaNombre?.trim();
	if (!nombre) return null;
	const tarea = await createTarea(nombre);
	return tarea?.id ?? null;
};

// 3. Sube los breaks locales no sincronizados
const syncBreaks = async (): Promise<void> => {
	const { isLoggedIn } = useStore.getState();
	if (!isLoggedIn) return;

	const local = cargarHistorialBreak();
	const porSubir = local.filter((b: BreakLogEntry) => !b.synced);
	if (porSubir.length === 0) return;

	for (const b of porSubir) {
		const ok = await subirBreak({
			tipo: b.tipo,
			status: b.status,
			minutesActual: b.minutes,
			createdAt: new Date(b.endTime).getTime(),
		});
		if (ok) marcarBreakSynced(b.id);
	}
};

// Helper para exponer estado del sync a E2E (Playwright waitForFunction)
// Patrón estándar para tests de sync offline: exponer flag global + evento
const setSyncFlag = (done: boolean) => {
	if (typeof window === "undefined") return;
	(window as unknown as Record<string, unknown>).__tempoSyncDone = done;
	window.dispatchEvent(
		new CustomEvent(done ? "tempo-sync-done" : "tempo-sync-start"),
	);
};

// Orquesta el sync completo. Seguro de llamar en cada login/page load.
export const syncLocalToCloud = async (): Promise<void> => {
	const { isLoggedIn } = useStore.getState();
	if (!isLoggedIn) return;

	setSyncFlag(false);
	try {
		await syncTareasLocales();
	} catch (error) {
		console.error("[Sync] syncTareasLocales error:", error);
	}
	try {
		await syncPomodoros();
	} catch (error) {
		console.error("[Sync] syncPomodoros error:", error);
	}
	try {
		await syncBreaks();
	} catch (error) {
		console.error("[Sync] syncBreaks error:", error);
	}
	setSyncFlag(true);
};
