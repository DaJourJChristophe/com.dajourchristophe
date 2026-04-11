import * as Sentry from '@sentry/node';

const sentryDsn = process.env.SENTRY_DSN?.trim();

// This module is imported for its side effect so Sentry is initialized
// before the Express app and route handlers are created.
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE,
    sendDefaultPii: true
  });
}
