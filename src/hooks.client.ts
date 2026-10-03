import type { HandleClientError } from "@sveltejs/kit";
import { env } from "$env/dynamic/public";

// Keep the monitoring SDK out of the startup bundle when it is unconfigured.
// Configured errors await the same initialization, including errors during load.
const reporting = env.PUBLIC_SENTRY_DSN
  ? import("@sentry/sveltekit")
      .then((Sentry) => {
        Sentry.init({
          dsn: env.PUBLIC_SENTRY_DSN,
          environment: env.PUBLIC_SENTRY_ENVIRONMENT ?? "production",
          release: env.PUBLIC_SENTRY_RELEASE,
          tracesSampleRate: 0.1,
          beforeSend(event) {
            if (event.request) {
              delete event.request.cookies;
              delete event.request.headers;
              delete event.request.query_string;
              delete event.request.data;
            }
            if (event.user) event.user = { id: event.user.id };
            return event;
          },
        });
        return Sentry.handleErrorWithSentry<HandleClientError>((event) => ({
          message: event.message,
        }));
      })
      .catch(() => null)
  : null;

export const handleError: HandleClientError = async (event) => {
  const handler = reporting ? await reporting : null;
  if (handler) return handler(event);
  return { message: event.message };
};
