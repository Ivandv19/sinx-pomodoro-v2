/// <reference path="../.astro/types.d.ts" />

type D1Database = import("@cloudflare/workers-types").D1Database;
type ENV = {
	DB: D1Database;
	LUCIA_KV: KVNamespace;
};

type Runtime = import("@astrojs/cloudflare").Runtime<ENV>;

declare namespace App {
	interface Locals extends Runtime {
		session: import("lucia").Session | null;
		user: import("lucia").User | null;
	}
}
