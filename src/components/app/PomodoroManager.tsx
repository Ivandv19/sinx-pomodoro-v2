/** @jsxImportSource react */
// React
import { useEffect } from "react";
// Store
import { useShallow } from "zustand/react/shallow";
import { useStore } from "../../stores/store";
import VerifiedHandler from "../Auth/VerifiedHandler";
import HeroSection from "../layout/HeroSection";
import TaskSelector from "../tasks/TaskSelector";
// Componentes
import BreakTimer from "../timer/BreakTimer";
import TimerView from "../timer/TimerView";
import ErrorBoundary from "../ui/ErrorBoundary";
import { toast } from "../ui/toast";

// Props del componente (interfaz local)
interface PomodoroManagerProps {
	lang?: "es" | "en";
}

// Orquesta el flujo principal de la app (hero, temporizador, tareas)
export default function PomodoroManager({ lang = "es" }: PomodoroManagerProps) {
	const {
		isLoggedIn,
		initTareas,
		initCategorias,
		createTarea,
		selectTarea,
		pomodoroActivo,
		breakActivo,
		iniciar,
		initPomodoros,
		setLang,
		toasts,
	} = useStore(
		useShallow((s) => ({
			isLoggedIn: s.isLoggedIn,
			initTareas: s.initTareas,
			initCategorias: s.initCategorias,
			createTarea: s.createTarea,
			selectTarea: s.selectTarea,
			pomodoroActivo: s.pomodoroActivo,
			breakActivo: s.breakActivo,
			iniciar: s.iniciar,
			initPomodoros: s.initPomodoros,
			setLang: s.setLang,
			toasts: s.toasts,
		})),
	);

	// Sincroniza el idioma del store con el de la página
	useEffect(() => {
		setLang(lang);
	}, [lang, setLang]);

	// Puente store → toasts Base UI (el Toaster vive en el Layout)
	useEffect(() => {
		if (toasts.length === 0) return;
		const last = toasts[toasts.length - 1];
		toast.add({
			title: last.title,
			description: last.message,
			type: last.type,
		});
	}, [toasts]);

	// Inicializa datos al montar el componente o cambiar sesión
	useEffect(() => {
		initTareas(isLoggedIn);
		initCategorias(isLoggedIn);
		initPomodoros(isLoggedIn);
	}, [isLoggedIn, initTareas, initCategorias, initPomodoros]);

	// Crea una nueva tarea y la inicia inmediatamente
	const handleStartTask = async (nombre: string, categoriaId?: number) => {
		const tarea = await createTarea(nombre, isLoggedIn, categoriaId);
		if (tarea) {
			selectTarea(tarea);
			iniciar(tarea.id, isLoggedIn);
		}
	};

	// Inicia un pomodoro con una tarea existente
	const handleSelectTask = (tareaId: number) => {
		iniciar(tareaId, isLoggedIn);
	};

	return (
		<ErrorBoundary>
			<VerifiedHandler />
			<div className="w-full">
				{/* Hero con modo focus o default según el estado */}
				<HeroSection mode={pomodoroActivo ? "focus" : "default"} />

				{pomodoroActivo ? (
					<TimerView />
				) : breakActivo ? (
					<BreakTimer />
				) : (
					<TaskSelector
						onSelectTask={handleSelectTask}
						onCreateTask={handleStartTask}
					/>
				)}
			</div>
		</ErrorBoundary>
	);
}
