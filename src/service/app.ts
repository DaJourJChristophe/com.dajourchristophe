import express from 'express';
import path from 'node:path';
import { createTokenBucketRateLimiter } from './token-bucket';

/**
 * Service configuration supported by the local loopback backend.
 */
export interface AppOptions {
  /**
   * Maximum number of requests allowed in one burst for a single client.
   */
  rateLimitCapacity?: number;
  /**
   * Number of request tokens restored per second for a single client.
   */
  rateLimitRefillRate?: number;
}

/**
 * Creates the Express application used by the local loopback service.
 *
 * @param rootPath - Absolute build root path used to resolve static assets and the generated HTML shell.
 * @param options - Optional service configuration for rate limiting behavior.
 * @returns Configured Express application instance.
 */
export function createApp(rootPath: string, options: AppOptions = {}): express.Express {
  const app = express();
  const rateLimitCapacity = options.rateLimitCapacity ?? Number.parseInt(process.env.RATE_LIMIT_CAPACITY ?? '1000', 10);
  const rateLimitRefillRate = options.rateLimitRefillRate ?? Number.parseFloat(process.env.RATE_LIMIT_REFILL_RATE ?? '300');

  // Trust the edge proxy so request.ip reflects the original client address behind nginx.
  app.set('trust proxy', true);
  app.disable('x-powered-by');
  app.use((_, response, next) => {
    response.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  app.use('/assets', express.static(path.join(rootPath, 'client', 'assets')));
  app.use(createTokenBucketRateLimiter({
    capacity: rateLimitCapacity,
    refillRate: rateLimitRefillRate
  }));

  app.get('/sitemap.xml', (_request, response) => {
    response.type('application/xml');
    response.sendFile(path.join(rootPath, 'client', 'sitemap.xml'));
  });

  app.get('/robots.txt', (_request, response) => {
    response.type('text/plain');
    response.sendFile(path.join(rootPath, 'client', 'robots.txt'));
  });

  app.get('/healthz', (_request, response) => {
    response.status(200).json({
      status: 'ok'
    });
  });

  app.get('/', (_request, response) => {
    response.sendFile(path.join(rootPath, 'client', 'index.html'));
  });

  return app;
}
