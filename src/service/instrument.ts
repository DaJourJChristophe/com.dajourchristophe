import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? 'https://744f8bc4655cab91b076825eb8d27d4b@o4509017062637568.ingest.us.sentry.io/4511203008315392',
  sendDefaultPii: true
});
