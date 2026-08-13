// React
import { useEffect } from "react";
// Store
import { useStore } from "../stores/store";

// Redirige al home si el usuario ya tiene sesión activa.
// Devuelve true mientras la sesión carga o si está autenticado
// (para que el componente no renderice su contenido en ese lapso).
export function useRedirectIfAuthed(redirectTo: string): boolean {
	const isLoggedIn = useStore((s) => s.isLoggedIn);
	const sessionLoading = useStore((s) => s.sessionLoading);

	useEffect(() => {
		if (sessionLoading || !isLoggedIn) return;
		window.location.replace(redirectTo);
	}, [sessionLoading, isLoggedIn, redirectTo]);

	return sessionLoading || isLoggedIn;
}
