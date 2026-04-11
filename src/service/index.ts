import path from 'node:path';
import { createApp } from './app';

/**
 * Loopback host used by the local development service.
 */
const host = process.env.HOST ?? '127.0.0.1';

/**
 * TCP port used by the local development service.
 */
const port = Number.parseInt(process.env.PORT ?? (process.env.NODE_ENV === 'production' ? '80' : '3000'), 10);

/**
 * Absolute build root resolved from the compiled service entrypoint.
 */
const rootPath = path.resolve(__dirname, '..');

/**
 * Express app configured with static asset and document routes.
 */
const app = createApp(rootPath);

app.listen(port, host, () => {
  console.log(`com.dajour is running at http://${host}:${port}`);
});
