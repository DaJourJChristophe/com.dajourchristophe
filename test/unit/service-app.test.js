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
  } finally {
    await server.close();
  }
});
