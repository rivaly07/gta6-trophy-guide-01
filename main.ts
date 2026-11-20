// A working gta6-trophy-guide-01 entry (Node 22, standard library only): the guide is this directory's app/ folder,
// plain static files a browser opens at app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json. The program hands it in: it copies app/
// and screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the judge reads (your
// screenshots, the first load's files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Only the plumbing, not a winner: a plain checklist of the 55 trophies with a one-line hint each. Write a real guide
// for every trophy in your own words, a roadmap to the platinum, filters and a spoiler setting in app/, put 3 or 4 PNG
// or JPEG screenshots of it in screenshots/ (the first by name is the cover; shots.json says which views this
// starter's were taken of), and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const trophies = JSON.parse(readFileSync(join(here, 'app/data/trophies.json'), 'utf8')).trophies.map((t: { id: number }) => ({ ...t, id: String(t.id) }));
const guides = JSON.parse(readFileSync(join(here, 'app/data/guides.json'), 'utf8')).guides;
const problems = [];
for (const trophy of trophies) {
  const guide = guides[trophy.id];
  if (!guide) {
    problems.push(`${trophy.id}: missing guide`);
    continue;
  }
  if (!Array.isArray(guide.sources) || guide.sources.length === 0 || guide.sources.some((source: unknown) => typeof source !== 'string' || source.trim() === '')) problems.push(`${trophy.id}: no non-empty sources`);
  else if (!Array.isArray(guide.steps) || guide.steps.length < 2 || guide.steps.length > 4) problems.push(`${trophy.id}: expected 2–4 steps`);
}
for (const id of Object.keys(guides)) if (!trophies.some((t: { id: string }) => t.id === id)) problems.push(`${id}: guide has no matching trophy`);
if (problems.length) throw new Error(`Guide preflight failed:\n${problems.join('\n')}`);
console.log(`Guide coverage: ${trophies.length}/${trophies.length} trophies have ordered steps and named sources.`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The grader opens /output/index.html (RULES, "Load"). app/ is the static site a browser opens at
// app/index.html, so the root page is a small redirect to it: one file, no network, no build step.
writeFileSync(join(out, 'index.html'), `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=app/index.html">
  <title>Leonida Field Guide</title>
</head><body><a href="app/index.html">Open the guide</a></body></html>
`);

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
