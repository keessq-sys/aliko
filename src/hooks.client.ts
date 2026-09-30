import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';

if (env.PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: env.PUBLIC_SENTRY_DSN,
    environment: env.PUBLIC_SENTRY_ENVIRONMENT ?? 'production',
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
    }
  });
}

export const handleError = Sentry.handleErrorWithSentry();
