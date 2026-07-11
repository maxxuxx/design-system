import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const allowedWorkspaces = new Set(['apps/docs', 'packages/tokens', 'packages/react']);
const allowedWorkspaceDeclarations = new Set(['apps/*', 'packages/*']);
const sourceExtensions = new Set(['.astro', '.css', '.mdx', '.ts', '.tsx']);
const primitivePattern = /--ds-color-(?:neutral|blue|red|green)-/;

function workspaceDeclarations(source) {
  const declarations = [];
  let readingPackages = false;
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!readingPackages) {
      if (trimmed === 'packages:') readingPackages = true;
      continue;
    }
    if (!trimmed || trimmed.startsWith('#')) continue;
    const item = line.match(/^\s+-\s+(.+?)\s*$/);
    if (!item) {
      if (/^\S/.test(line)) break;
      continue;
    }
    let declaration = item[1].replace(/\s+#.*$/, '').trim();
    if ((declaration.startsWith("'") && declaration.endsWith("'"))
      || (declaration.startsWith('"') && declaration.endsWith('"'))) {
      declaration = declaration.slice(1, -1);
    }
    declarations.push(declaration);
  }
  return declarations;
}

async function workspacePackages(root, declaration) {
  const wildcard = declaration.match(/^([^*]+)\/\*$/);
  const directories = [];
  if (wildcard) {
    const group = wildcard[1];
    if (path.isAbsolute(group) || group.split('/').includes('..')) return directories;
    const base = path.join(root, group);
    let entries;
    try {
      entries = await readdir(base, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') return directories;
      throw error;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      directories.push(`${group}/${entry.name}`);
    }
  } else if (!declaration.includes('*')
    && !path.isAbsolute(declaration)
    && !declaration.split('/').includes('..')) {
    directories.push(declaration);
  }

  const packages = [];
  for (const relative of directories) {
    try {
      await readFile(path.join(root, relative, 'package.json'), 'utf8');
      packages.push(relative);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return packages;
}

async function declaredWorkspaceGraph(root) {
  const source = await readFile(path.join(root, 'pnpm-workspace.yaml'), 'utf8');
  const declarations = workspaceDeclarations(source);
  const packages = new Set();
  for (const declaration of declarations) {
    for (const relative of await workspacePackages(root, declaration)) packages.add(relative);
  }
  return { declarations, packages: [...packages].sort() };
}

async function workspaceGraph(root, violations) {
  try {
    return await declaredWorkspaceGraph(root);
  } catch (error) {
    violations.push(`Unreadable pnpm-workspace.yaml: ${error.message}`);
    return { declarations: [], packages: [] };
  }
}

export async function findWorkspaceViolations(root) {
  const violations = [];
  const { declarations, packages: candidates } = await workspaceGraph(root, violations);
  for (const expected of allowedWorkspaceDeclarations) {
    const count = declarations.filter((value) => value === expected).length;
    if (count === 0) violations.push(`Missing workspace declaration: ${expected}`);
    if (count > 1) violations.push(`Duplicate workspace declaration: ${expected}`);
  }
  for (const declaration of declarations) {
    if (!allowedWorkspaceDeclarations.has(declaration)) {
      violations.push(`Unexpected workspace declaration: ${declaration}`);
    }
  }
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
