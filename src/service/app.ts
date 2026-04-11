import express from 'express';
import path from 'node:path';

/**
 * Creates the Express application used by the local loopback service.
 *
 * @param rootPath - Absolute build root path used to resolve static assets and the generated HTML shell.
 * @returns Configured Express application instance.
 */
export function createApp(rootPath: string): express.Express {
  const app = express();

  app.disable('x-powered-by');

  app.use('/assets', express.static(path.join(rootPath, 'client', 'assets')));

  app.get('/', (_request, response) => {
    response.sendFile(path.join(rootPath, 'client', 'index.html'));
  });

  return app;
}
