// Algoritmo de sync local → nube (ADR-001).
//
// Este módulo NO importa el store (evita ciclos de imports).
// La orquestación con el store vive en src/lib/syncLocalToCloud.ts.
//
// Idea central: los IDs de tareas offline son inventados
// (Date.now() + random, ≈1.7e12) y no existen en la nube (autoincrement).
// Antes de cualquier POST de pomodoro, el ID fake se traduce al ID real:
//   1. si ya está en el mapa tempo_id_map → se usa el real
//   2. si ya está en las tareas de la nube → es real, se usa tal cual
//   3. si no → se crea la tarea en la nube al vuelo y se guarda el mapa

const MAP_KEY = "tempo_id_map";
const FALLBACK_NOMBRE = "Tarea";

// Carga el mapa idLocal → idReal desde localStorage
export const cargarMapaIds = (): Record<number, number> => {
	if (typeof localStorage === "undefined") return {};
	try {
		const saved = localStorage.getItem(MAP_KEY);
		return saved ? JSON.parse(saved) : {};
	} catch {
		localStorage.removeItem(MAP_KEY);
		return {};
	}
};

// Persiste el mapa idLocal → idReal en localStorage
export const guardarMapaIds = (map: Record<number, number>) => {
	try {
		localStorage.setItem(MAP_KEY, JSON.stringify(map));
	} catch (error) {
		console.warn("[Sync] guardarMapaIds error:", error);
	}
};

// Crea una tarea en la nube y devuelve su ID real (null si falla)
export const crearTareaEnNube = async (
	nombre: string,
): Promise<number | null> => {
	try {
		const res = await fetch("/api/tareas", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ nombre: nombre || FALLBACK_NOMBRE }),
		});
		if (!res.ok) return null;
		const json = await res.json();
		return (json.data?.id as number) ?? null;
	} catch {
		return null;
	}
};

// Traduce un ID local de tarea al ID real de la nube.
// Crea la tarea al vuelo si no existe (el nombre se obtiene de getNombre).
// El mapa se actualiza y persiste si se creó una tarea nueva.
export const traducirTareaId = async (opts: {
	tareaId: number | null;
	tareasNube: { id: number }[];
	getNombre: (id: number) => string | undefined;
}): Promise<number | null> => {
	const { tareaId, tareasNube, getNombre } = opts;
	if (tareaId === null) return null;

	// 1. Ya traducido antes → id real
	const mapa = cargarMapaIds();
	if (mapa[tareaId] !== undefined) return mapa[tareaId];

	// 2. Ya es un id real (existe en las tareas de la nube)
	if (tareasNube.some((t) => t.id === tareaId)) return tareaId;

	// 3. Es un id local → crear la tarea en la nube al vuelo
	const nombre = getNombre(tareaId);
	const idReal = await crearTareaEnNube(nombre ?? FALLBACK_NOMBRE);
	if (idReal === null) return null;

	mapa[tareaId] = idReal;
	guardarMapaIds(mapa);
	return idReal;
};

// Sube un pomodoro a la API y devuelve true si se registró
export const subirPomodoro = async (opts: {
	tareaId: number;
	status: "completed" | "interrupted";
	minutesActual: number;
	createdAt: number;
}): Promise<boolean> => {
	try {
		const res = await fetch("/api/pomodoros", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(opts),
		});
		return res.ok;
	} catch {
		return false;
	}
};

// Sube un break a la API y devuelve true si se registró
export const subirBreak = async (opts: {
	tipo: "short" | "long";
	status: "completed" | "skipped";
	minutesActual: number;
	createdAt: number;
}): Promise<boolean> => {
	try {
		const res = await fetch("/api/breaks", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(opts),
		});
		return res.ok;
	} catch {
		return false;
	}
};
