'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const { createApp } = require('../../build/service/app.js');

/**
 * Starts an Express app on an ephemeral loopback port.
 *
 * @param {import('express').Express} app - Express application to serve.
 * @returns {Promise<{baseUrl: string, close: () => Promise<void>}>} Running server handle.
 */
function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        reject(new Error('Unable to resolve test server address.'));
        return;
      }

      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((closeResolve, closeReject) => {
          server.close((error) => {
            if (error) {
              closeReject(error);
              return;
            }

            closeResolve();
          });
        })
      });
    });
  });
}

test('service app serves the generated portfolio shell', async () => {
  const rootPath = path.resolve(__dirname, '..', '..', 'build');
  const app = createApp(rootPath);
  const server = await listen(app);

  try {
    const response = await fetch(`${server.baseUrl}/`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /Da'Jour Christophe/);
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.match(response.headers.get('content-security-policy') ?? '', /default-src 'self'/);
    assert.equal(response.headers.get('x-ratelimit-limit'), '1000');
  } finally {
    await server.close();
  }
});

test('service app applies token bucket rate limiting', async () => {
  const rootPath = path.resolve(__dirname, '..', '..', 'build');
  const app = createApp(rootPath, {
    rateLimitCapacity: 2,
    rateLimitRefillRate: 0.01
  });
  const server = await listen(app);

  try {
    const first = await fetch(`${server.baseUrl}/`);
    const second = await fetch(`${server.baseUrl}/`);
    const third = await fetch(`${server.baseUrl}/`);
    const body = await third.json();

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(third.status, 429);
    assert.equal(body.error, 'Too Many Requests');
    assert.equal(third.headers.get('retry-after'), '100');
    assert.equal(third.headers.get('x-ratelimit-limit'), '2');
    assert.equal(third.headers.get('x-ratelimit-remaining'), '0');
  } finally {
    await server.close();
  }
});

test('service app honors forwarded client addresses behind the nginx gateway', async () => {
  const rootPath = path.resolve(__dirname, '..', '..', 'build');
  const app = createApp(rootPath, {
    rateLimitCapacity: 1,
    rateLimitRefillRate: 0.01
  });
  const server = await listen(app);

  try {
    const first = await fetch(`${server.baseUrl}/`, {
      headers: {
        'X-Forwarded-For': '203.0.113.10'
      }
    });
    const second = await fetch(`${server.baseUrl}/`, {
      headers: {
        'X-Forwarded-For': '198.51.100.24'
      }
    });

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
  } finally {
    await server.close();
  }
});

test('service app serves sitemap.xml from the web root', async () => {
  const rootPath = path.resolve(__dirname, '..', '..', 'build');
  const app = createApp(rootPath);
  const server = await listen(app);

  try {
    const response = await fetch(`${server.baseUrl}/sitemap.xml`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /application\/xml/);
    assert.match(body, /<urlset/);
    assert.match(body, /<loc>http:\/\/127\.0\.0\.1:3000\/<\/loc>/);
  } finally {
    await server.close();
  }
});

test('service app serves robots.txt from the web root', async () => {
  const rootPath = path.resolve(__dirname, '..', '..', 'build');
  const app = createApp(rootPath);
  const server = await listen(app);

  try {
    const response = await fetch(`${server.baseUrl}/robots.txt`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /text\/plain/);
    assert.match(body, /User-agent: \*/);
    assert.match(body, /Allow: \//);
    assert.match(body, /Sitemap: http:\/\/127\.0\.0\.1:3000\/sitemap\.xml/);
  } finally {
    await server.close();
  }
});

test('service app serves a health check endpoint', async () => {
  const rootPath = path.resolve(__dirname, '..', '..', 'build');
  const app = createApp(rootPath);
  const server = await listen(app);

  try {
    const response = await fetch(`${server.baseUrl}/healthz`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
  } finally {
    await server.close();
  }
});

test('service app exposes a Sentry debug route and returns the event id on error', async () => {
  const rootPath = path.resolve(__dirname, '..', '..', 'build');
  const app = createApp(rootPath);
  const server = await listen(app);

  try {
    const response = await fetch(`${server.baseUrl}/debug-sentry`);
    const body = await response.text();

    assert.equal(response.status, 500);
    assert.match(body.trim(), /.+/);
  } finally {
    await server.close();
  }
});
