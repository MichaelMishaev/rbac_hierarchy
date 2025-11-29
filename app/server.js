#!/usr/bin/env node
/**
 * Standalone Next.js Server for Railway Production
 *
 * This server runs the Next.js standalone build optimized for Docker/Railway deployments.
 * It uses the built-in Next.js server with proper environment handling.
 */

const { createServer } = require('node:http');
const { parse } = require('node:url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app
const app = next({
  dev,
  hostname,
  port,
  dir: __dirname // Points to /app directory
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Environment: ${process.env.NODE_ENV}`);
    });
});
