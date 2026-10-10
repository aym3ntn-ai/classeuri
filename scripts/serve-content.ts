// Local stand-in for GitHub Pages while developing the apps:
//
//   node scripts/serve-content.ts [--port 8787] [--host localhost]
//
// Builds the catalog with URLs pointing at this server, then serves it and the PDFs
// from dist/content with CORS open. For a phone on the same Wi-Fi, pass the
// computer's LAN address as --host.

import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: { port: { type: 'string', default: '8787' }, host: { type: 'string', default: 'localhost' } },
});
const root = path.resolve('dist/content');
const baseUrl = `http://${values.host}:${values.port}/`;

execFileSync(
  process.execPath,
  ['scripts/build-catalog.ts', '--out', path.join(root, 'catalog.json'), '--files-out', path.join(root, 'files'), '--base-url', baseUrl],
  { stdio: 'inherit' },
);

const TYPES: Record<string, string> = { '.json': 'application/json; charset=utf-8', '.pdf': 'application/pdf' };

createServer(async (req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url ?? '/', baseUrl).pathname));
  const info = file.startsWith(root) ? await stat(file).catch(() => null) : null;
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!info?.isFile()) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    'Content-Length': info.size,
    'Cache-Control': 'no-store',
  });
  if (req.method === 'HEAD') res.end();
  else createReadStream(file).pipe(res);
}).listen(Number(values.port), '0.0.0.0', () => console.log(`Serving ${baseUrl}catalog.json`));
