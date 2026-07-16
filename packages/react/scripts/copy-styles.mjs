import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(packageRoot, 'src');
const outputRoot = path.join(packageRoot, 'dist');

async function copyCssFiles(source, output) {
  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const outputPath = path.join(output, entry.name);

    if (entry.isDirectory()) {
      await copyCssFiles(sourcePath, outputPath);
      continue;
    }

    if (path.extname(entry.name) !== '.css') continue;
    await mkdir(output, { recursive: true });
    await copyFile(sourcePath, outputPath);
  }
}

await copyCssFiles(sourceRoot, outputRoot);
