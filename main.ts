// Bloom Bastion: an original 2D arena survival shooter (defend the Great Bloom from geometric 
// blight creatures, 10 waves, upgrades, WebAudio sound), packaged by copying game/ and 
// screenshots/ to the output directory and writing dossier.json with the vendored library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

if (!existsSync(join(here, 'game', 'index.html'))) {
  console.error('Error: game/index.html must exist beside main.ts');
  process.exit(1);
}
const screenshotsDir = join(here, 'screenshots');
const screenshots = existsSync(screenshotsDir) ? readdirSync(screenshotsDir).filter(f => statSync(join(screenshotsDir, f)).isFile()) : [];
if (screenshots.length < 3) {
  console.error('Error: screenshots/ must hold at least 3 image files');
  process.exit(1);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

const dossierRaw = readFileSync(join(out, 'dossier.json'), 'utf8');
const dossier = JSON.parse(dossierRaw);
const finalFiles = readdirSync(join(out, 'game'), { recursive: true }).filter(f => statSync(join(out, 'game', f)).isFile());
console.log(`${finalFiles.length} files, ${dossier.images?.length ?? 0} screenshots, ${Buffer.byteLength(dossierRaw)} bytes`);
