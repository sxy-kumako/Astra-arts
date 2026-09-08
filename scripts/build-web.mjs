import { build } from 'esbuild';
import { copyFile } from 'node:fs/promises';

await build({ entryPoints: ['web/viewer.js'], bundle: true, minify: true, format: 'esm',
  outfile: 'assets/viewer-phase13.js', legalComments: 'eof' });
await copyFile('web/index.template.html', 'index.html');
