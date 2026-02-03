import type { KVNamespace, D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import bcrypt from "bcryptjs";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export const auth = (db: D1Database, kv: KVNamespace | null, env?: { BETTER_AUTH_SECRET?: string, BETTER_AUTH_URL?: string }) => {
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
        ]
    });
};
