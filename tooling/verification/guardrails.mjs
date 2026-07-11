import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const allowedWorkspaces = new Set(['apps/docs', 'packages/tokens', 'packages/react']);
const sourceExtensions = new Set(['.astro', '.css', '.mdx', '.ts', '.tsx']);
const primitivePattern = /--ds-color-(?:neutral|blue|red|green)-/;

async function directoryNames(root, group) {
  const base = path.join(root, group);
  try {
    const entries = await readdir(base, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => `${group}/${entry.name}`);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function findWorkspaceViolations(root) {
  const candidates = [
    ...(await directoryNames(root, 'apps')),
    ...(await directoryNames(root, 'packages')),
  ];
  const violations = [];
  for (const expected of allowedWorkspaces) {
    if (!candidates.includes(expected)) violations.push(`Missing workspace: ${expected}`);
  }
  for (const relative of candidates) {
    if (!allowedWorkspaces.has(relative)) violations.push(`Unexpected workspace: ${relative}`);
    const manifestPath = path.join(root, relative, 'package.json');
    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      if (manifest.private !== true) violations.push(`Workspace must be private: ${relative}`);
    } catch (error) {
      violations.push(`Unreadable workspace manifest: ${relative}: ${error.message}`);
    }
  }
  const rootManifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  if (rootManifest.private !== true) violations.push('Root package must be private');
  return violations.sort();
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

export async function findPrimitiveColorReferences(root) {
  const roots = [path.join(root, 'packages', 'react', 'src'), path.join(root, 'apps', 'docs', 'src')];
  const allowedFoundations = [
    path.normalize(path.join(root, 'apps', 'docs', 'src', 'components', 'foundations')),
    path.normalize(path.join(root, 'apps', 'docs', 'src', 'content', 'foundations')),
  ];
  const violations = [];
  for (const sourceRoot of roots) {
    const files = await walk(sourceRoot);
    for (const file of files) {
      if (!sourceExtensions.has(path.extname(file))) continue;
      const normalized = path.normalize(file);
      if (allowedFoundations.some((allowed) => normalized.startsWith(allowed + path.sep))) continue;
      const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
      lines.forEach((line, index) => {
        if (primitivePattern.test(line)) {
          violations.push(`${path.relative(root, file)}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
  return violations.sort();
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const violations = [
    ...(await findWorkspaceViolations(root)),
    ...(await findPrimitiveColorReferences(root)),
  ];
  if (violations.length) {
    process.stderr.write(`${violations.join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('Guardrails passed: 3 private workspaces, 0 primitive color leaks\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
