/// <reference path="../.astro/types.d.ts" />

type D1Database = import("@cloudflare/workers-types").D1Database;
type KVNamespace = import("@cloudflare/workers-types").KVNamespace;

type ENV = {
	DB: D1Database;
	LUCIA_KV: KVNamespace;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
};

declare namespace App {
	interface Locals {
		user: import("better-auth").User | null;
		session: import("better-auth").Session | null;
		runtime: import("@astrojs/cloudflare").Runtime<ENV> & {
            data: {
                user: import("better-auth").User | null;
                session: import("better-auth").Session | null;
            }
        };
	}
}
