import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const expectedVersion = '0.1.0';
const allowedWorkspaces = new Map([
  ['apps/docs', '@hds/docs'],
  ['packages/tokens', '@hds/tokens'],
  ['packages/react', '@hds/react'],
]);
const allowedWorkspaceDeclarations = new Set(['apps/*', 'packages/*']);
const sourceExtensions = new Set(['.astro', '.css', '.mdx', '.ts', '.tsx']);
const primitivePattern = /--hds-color-(?:neutral|blue|red|green)-/;
const brandExtensions = new Set([
  '.astro', '.css', '.js', '.json', '.md', '.mdx', '.mjs', '.svg', '.ts', '.tsx', '.yaml', '.yml',
]);
const retiredAutomaticIds = [
  'checkbox', 'radio-group', 'scroll-area-viewport', 'search-field', 'select', 'switch', 'tab',
  'text-field', 'textarea',
];
const componentSliceContract = [
  ['Icon', 'icon'],
  ['Badge', 'badge'],
  ['Button', 'button'],
  ['TextField', 'text-field'],
  ['ScrollArea', 'scroll-area'],
  ['Checkbox', 'checkbox'],
  ['RadioGroup', 'radio-group'],
  ['Switch', 'switch'],
  ['Textarea', 'textarea'],
  ['Select', 'select'],
  ['TextButton', 'text-button'],
  ['IconButton', 'icon-button'],
  ['BoardRow', 'board-row'],
  ['Tab', 'tab'],
  ['BottomSheet', 'bottom-sheet'],
  ['Dialog', 'dialog'],
  ['SearchField', 'search-field'],
  ['ListRow', 'list-row'],
  ['Toast', 'toast'],
  ['BottomCTA', 'bottom-cta'],
];

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
  for (const expected of allowedWorkspaces.keys()) {
    if (!candidates.includes(expected)) violations.push(`Missing workspace: ${expected}`);
  }
  for (const relative of candidates) {
    if (!allowedWorkspaces.has(relative)) violations.push(`Unexpected workspace: ${relative}`);
    const manifestPath = path.join(root, relative, 'package.json');
    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      if (manifest.private !== true) violations.push(`Workspace must be private: ${relative}`);
      const expectedName = allowedWorkspaces.get(relative);
      if (expectedName && manifest.name !== expectedName) {
        violations.push(`Workspace package name must be ${expectedName}: ${relative}`);
      }
      if (expectedName && manifest.version !== expectedVersion) {
        violations.push(`Workspace version must be ${expectedVersion}: ${relative}`);
      }
    } catch (error) {
      violations.push(`Unreadable workspace manifest: ${relative}: ${error.message}`);
    }
  }
  const rootManifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  if (rootManifest.private !== true) violations.push('Root package must be private');
  if (rootManifest.name !== '@hds/workspace') {
    violations.push('Root package name must be @hds/workspace');
  }
  if (rootManifest.version !== expectedVersion) {
    violations.push(`Root version must be ${expectedVersion}`);
  }
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

async function walkExisting(target) {
  try {
    const entries = await readdir(target, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const full = path.join(target, entry.name);
      if (entry.isDirectory()) files.push(...await walkExisting(full));
      else files.push(full);
    }
    return files;
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return [];
    throw error;
  }
}

async function existingFile(target) {
  try {
    await readFile(target, 'utf8');
    return [target];
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') return [];
    throw error;
  }
}

export async function findBrandViolations(root) {
  const files = [];
  const directFiles = [
    'README.md', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml',
    'apps/docs/package.json', 'apps/docs/astro.config.mjs', 'packages/tokens/package.json',
    'packages/react/package.json', 'docs/PROGRESS.md',
  ];
  for (const relative of directFiles) {
    files.push(...await existingFile(path.join(root, relative)));
  }
  const directories = [
    '.github', 'apps/docs/src', 'apps/docs/public', 'apps/docs/scripts', 'apps/docs/tests',
    'packages/tokens/src', 'packages/tokens/dist', 'packages/tokens/scripts', 'packages/tokens/tests',
    'packages/react/src', 'figma',
  ];
  for (const relative of directories) {
    files.push(...await walkExisting(path.join(root, relative)));
  }

  const retiredBrand = ['AI', '-', 'Readable'].join('');
  const retiredScope = ['@', 'maxxuxx'].join('');
  const retiredVariable = ['--', 'ds', '-'].join('');
  const retiredClass = ['.', 'ds', '-'].join('');
  const automaticIdPattern = new RegExp(`\\bds-(?:${retiredAutomaticIds.join('|')})-`);
  const violations = [];

  for (const file of new Set(files)) {
    if (!brandExtensions.has(path.extname(file)) && path.basename(file) !== 'pnpm-lock.yaml') continue;
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    lines.forEach((line, index) => {
      const relative = path.relative(root, file).split(path.sep).join('/');
      const location = `${relative}:${index + 1}`;
      if (line.includes(retiredBrand)) violations.push(`${location}: retired brand ${retiredBrand}`);
      if (line.includes(retiredScope)) violations.push(`${location}: retired package scope ${retiredScope}`);
      if (line.includes(retiredVariable)) violations.push(`${location}: retired CSS variable prefix ${retiredVariable}`);
      if (line.includes(retiredClass)) violations.push(`${location}: retired class prefix ${retiredClass}`);
      if (automaticIdPattern.test(line)) violations.push(`${location}: retired automatic ID namespace`);
    });
  }

  return violations.sort();
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

export async function findComponentSliceContractViolations(root) {
  const file = path.join(
    root,
    'apps',
    'docs',
    'tests',
    'e2e',
    'component-slices.visual.spec.ts',
  );
  let source;
  try {
    source = await readFile(file, 'utf8');
  } catch (error) {
    return [`Unreadable component-slice visual contract: ${error.message}`];
  }
  const entries = [...source.matchAll(
    /\{\s*name:\s*'([^']+)'\s*,\s*slug:\s*'([^']+)'\s*\}/g,
  )].map((match) => [match[1], match[2]]);
  if (JSON.stringify(entries) !== JSON.stringify(componentSliceContract)) {
    return [
      'Component slice list must contain exactly 20 ordered components and 40 Windows mobile/desktop targets',
    ];
  }
  return [];
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const violations = [
    ...(await findWorkspaceViolations(root)),
    ...(await findBrandViolations(root)),
    ...(await findPrimitiveColorReferences(root)),
    ...(await findComponentSliceContractViolations(root)),
  ];
  if (violations.length) {
    process.stderr.write(`${violations.join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(
    'Guardrails passed: HDS v0.1.0 brand, 3 private workspaces, 0 primitive color leaks, 40 Windows component-slice targets\n',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
