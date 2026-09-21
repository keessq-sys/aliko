// src/app.d.ts
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Set by hooks.server.ts when the request's User-Agent matches a
			 *  known AI crawler/answer-engine — used only for server-side
			 *  observability (see AEO/GEO bot logging in hooks.server.ts). */
			aiBot?: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
