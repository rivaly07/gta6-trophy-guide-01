import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./out', import.meta.url)));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const port = Number(process.argv[2] || 8098);
createServer((req, res) => {
  const u = new URL(req.url ?? '/', 'http://localhost');
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = resolve(join(root, p));
  if (f !== root && !f.startsWith(root + sep)) { res.writeHead(403).end('forbidden'); return; }
  try { const s = statSync(f); if (!s.isFile()) throw 0; } catch { res.writeHead(404).end('nf'); return; }
  res.writeHead(200, { 'content-type': MIME[extname(f).toLowerCase()] ?? 'application/octet-stream', 'content-length': statSync(f).size });
  createReadStream(f).pipe(res);
}).listen(port, () => console.log('out on', port));