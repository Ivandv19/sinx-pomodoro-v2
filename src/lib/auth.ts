import type { KVNamespace, D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import bcrypt from "bcryptjs";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export const auth = (db: D1Database, kv: KVNamespace | null, env?: { BETTER_AUTH_SECRET?: string, BETTER_AUTH_URL?: string, TURNSTILE_SECRET_KEY?: string }) => {
    if (!db) {
        throw new Error("Database (D1) is required for auth");
    }
    const d1 = drizzle(db, { schema });
    return betterAuth({
        database: drizzleAdapter(d1, {
            provider: "sqlite",
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
            }
        }),
        secret: env?.BETTER_AUTH_SECRET,
        baseURL: env?.BETTER_AUTH_URL,
        secondaryStorage: kv ? {
            get: async (key: string) => {
                const value = await kv.get(key);
                return value ? JSON.parse(value) : null;
            },
            set: async (key: string, value: any, ttl?: number) => {
                if (ttl) {
                    await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
                } else {
                    await kv.put(key, JSON.stringify(value));
                }
            },
            delete: async (key: string) => {
                await kv.delete(key);
            }
        } : undefined,
        emailAndPassword: {
            enabled: true,
            password: {
                hash: async (password) => {
                    return await bcrypt.hash(password, 4);
                },
                verify: async ({ hash, password }) => {
                    return await bcrypt.compare(password, hash);
                }
            }
        },
        trustedOrigins: [
            "http://localhost:4321",
            "https://sinx-pomodoro.mgdc.site"
        ],
        hooks: {
            before: async (context) => {
                if (!context.request) return;
                
                const url = new URL(context.request.url);
                const path = url.pathname;
                
                // Verificar Turnstile solo en registro y login por email
                if (path.endsWith("/sign-up/email") || path.endsWith("/sign-in/email")) {
                    const token = context.request.headers.get("x-turnstile-token");
                    const secret = env?.TURNSTILE_SECRET_KEY;

                    if (!secret) {
                        console.error("TURNSTILE_SECRET_KEY missing in environment");
                        return;
                    }

                    if (!token) {
                        throw new Error("Security verification is required");
                    }

                    const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: `secret=${secret}&response=${token}`,
                    });

                    const outcome: any = await result.json();
                    if (!outcome.success) {
                        throw new Error("Security verification failed. Please try again.");
                    }
                }
            }
        }
    });
};
