// src/app.d.ts
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      /** Identified crawler, when the request came from a known answer engine. */
      aiBot?: string | null;
      user?: { _id?: string; name?: string; email?: string; role?: string; phone?: string };
    }
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
