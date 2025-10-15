const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'dist');
const BACKEND_URL = process.env.BACKEND_URL || 'https://asmlmbackend-production.up.railway.app';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Reverse proxy for API calls to avoid CORS
  if (req.url.startsWith('/api/')) {
    try {
      const targetUrl = new URL(req.url, BACKEND_URL);

      // Collect request body (if any)
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;

      // Prepare headers (avoid overriding Host)
      const headers = { ...req.headers };
      delete headers.host;
      // Forward cookies and auth headers as-is

      const upstreamRes = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
        // Disable compression auto-decode differences
        redirect: 'manual'
      });

      // Write status and headers back to client
      const hdrs = {};
      upstreamRes.headers.forEach((value, key) => {
        // Avoid setting any CORS headers (same-origin now)
        if (!['access-control-allow-origin', 'access-control-allow-credentials'].includes(key)) {
          hdrs[key] = value;
        }
      });
      res.writeHead(upstreamRes.status, hdrs);
      const buf = Buffer.from(await upstreamRes.arrayBuffer());
      res.end(buf);
      return;
    } catch (e) {
      console.error('Proxy error:', e);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway', details: e.message }));
      return;
    }
  }

  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If file doesn't exist, serve index.html for client-side routing
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>', 'utf-8');
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${error.code}`, 'utf-8');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

