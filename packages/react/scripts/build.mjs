import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(packageRoot, 'dist');

await rm(outputRoot, { force: true, recursive: true });
await build({
  absWorkingDir: packageRoot,
  bundle: true,
  entryPoints: ['src/index.ts'],
  external: ['react', 'react-dom'],
  format: 'esm',
  logLevel: 'info',
  outfile: 'dist/index.js',
  platform: 'neutral',
  sourcemap: true,
  target: ['es2023'],
  treeShaking: true,
});
