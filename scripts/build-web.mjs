import { build } from 'esbuild';
import { copyFile, stat } from 'node:fs/promises';

const modelBytes = (await stat('assets/summer-festival-phase13.glb')).size;
await build({ entryPoints: ['web/viewer.js'], bundle: true, minify: true, format: 'esm',
  define: { __MODEL_BYTE_LENGTH__: String(modelBytes) },
  outfile: 'assets/viewer-phase13.js', legalComments: 'eof' });
await copyFile('web/index.template.html', 'index.html');
