import { createAuthClient } from "better-auth/react";

// Variable global para el token de Turnstile
export const turnstileToken = {
    current: null as string | null
};

export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:4321",
    fetchOptions: {
        onRequest: async (context) => {
            if (turnstileToken.current) {
                const headers = new Headers(context.headers);
                headers.set("x-turnstile-token", turnstileToken.current);
                context.headers = headers;
            }
            return context;
        }
    }
});

export const { signIn, signUp, signOut, useSession } = authClient;
