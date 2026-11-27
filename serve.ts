// serve.ts — tiny static server for local play-testing (Node 22, stdlib only).
// Serves game/ at http://localhost:8080. Not part of the entry; the shipped
// game is static files and needs no server at all.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'game');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

createServer(async (req, res) => {
  try {
    const rawPath = decodeURIComponent(req.url.split('?')[0]);
    const path = rawPath === '/' ? '/index.html' : rawPath;
    const file = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' });
    res.end(file);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
}).listen(8080, () => console.log('Turkey Run at http://localhost:8080'));
