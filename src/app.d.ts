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
		interface Platform {
			env?: {
				MEDIA?: {
					put(key: string, value: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string; cacheControl?: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
					get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string; cacheControl?: string }; customMetadata?: Record<string, string>; writeHttpMetadata(headers: Headers): void } | null>;
					delete(key: string): Promise<void>;
					list(options?: { cursor?: string; limit?: number; prefix?: string }): Promise<{
						objects: Array<{ key: string; uploaded: Date; size: number }>;
						truncated: boolean;
						cursor?: string;
					}>;
				};
				SENTRY_DSN?: string;
				SENTRY_ENVIRONMENT?: string;
				SENTRY_RELEASE?: string;
			};
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
