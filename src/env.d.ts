/// <reference path="../.astro/types.d.ts" />

type D1Database = import("@cloudflare/workers-types").D1Database;
type ENV = {
	DB: D1Database;
	LUCIA_KV: KVNamespace;
};

type Runtime = import("@astrojs/cloudflare").Runtime<ENV>;

declare namespace App {
	interface Locals extends Runtime {
		user: import("better-auth").User | null;
		session: import("better-auth").Session | null;
	}
}
