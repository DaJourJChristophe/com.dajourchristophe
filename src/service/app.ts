import express from 'express';
import path from 'node:path';

export function createApp(rootPath: string): express.Express {
  const app = express();

  app.disable('x-powered-by');

  app.use('/assets', express.static(path.join(rootPath, 'assets')));

  app.get('/', (_request, response) => {
    response.sendFile(path.join(rootPath, 'template', 'index.html'));
  });

  return app;
}
