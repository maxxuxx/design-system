import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const node = process.execPath;
const useShell = process.platform === 'win32';
const workspaceRequire = createRequire(path.join(root, 'packages/react/package.json'));

function execCli(command, args, options) {
  return execFileSync(command, args, {
    ...options,
    shell: useShell,
    windowsHide: true,
  });
}

function packageFiles(relative) {
  const output = execCli(
    'npm',
    ['pack', '--dry-run', '--json', '--ignore-scripts'],
    {
      cwd: path.join(root, relative),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const [artifact] = JSON.parse(output);
  assert.ok(artifact, `npm pack returned no artifact for ${relative}`);
  return {
    ...artifact,
    paths: new Set(artifact.files.map((file) => file.path.replaceAll('\\', '/'))),
  };
}

function requireFiles(artifact, required) {
  for (const file of required) {
    assert.ok(artifact.paths.has(file), `${artifact.name} tarball is missing ${file}`);
  }
}

function rejectFiles(artifact, patterns) {
  const unexpected = [...artifact.paths].filter((file) => (
    patterns.some((pattern) => pattern.test(file))
  ));
  assert.deepEqual(unexpected, [], `${artifact.name} tarball contains development files`);
}

function createTarball(relative, output) {
  const result = execCli(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', output],
    {
      cwd: path.join(root, relative),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const [artifact] = JSON.parse(result);
  assert.ok(artifact, `npm pack returned no artifact for ${relative}`);
  return path.join(output, artifact.filename);
}

async function copyDependency(consumer, name, manifestPath) {
  const target = path.join(consumer, 'node_modules', ...name.split('/'));
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.dirname(manifestPath), target, {
    dereference: true,
    recursive: true,
  });
}

const react = packageFiles('packages/react');
requireFiles(react, [
  'LICENSE',
  'README.md',
  'dist/index.d.ts',
  'dist/index.js',
  'dist/index.js.map',
  'dist/styles.css',
  'package.json',
]);
rejectFiles(react, [
  /^scripts\//,
  /^src\//,
  /\.test\.[cm]?[jt]sx?$/,
  /(?:^|\/)tsconfig(?:\.[^.]+)?\.json$/,
  /vitest\.config\./,
]);

const styles = await readFile(path.join(root, 'packages/react/dist/styles.css'), 'utf8');
const styleImports = [...styles.matchAll(/@import\s+['"](.+?\.css)['"];/g)]
  .map((match) => match[1].replace(/^\.\//, ''));
assert.equal(styleImports.length, 20, 'React root stylesheet must contain 20 imports');
assert.equal(new Set(styleImports).size, 20, 'React root stylesheet must import 20 component styles');
for (const style of styleImports) {
  assert.ok(react.paths.has(`dist/${style}`), `@hds/react tarball is missing dist/${style}`);
}

const reactModule = await import(
  `${pathToFileURL(path.join(root, 'packages/react/dist/index.js')).href}?verify`
);
const runtimeExports = [
  'Badge',
  'BoardRow',
  'BottomCTA',
  'BottomSheet',
  'Button',
  'Checkbox',
  'AlertDialog',
  'ConfirmDialog',
  'ICON_NAMES',
  'Icon',
  'IconButton',
  'ListRow',
  'RadioGroup',
  'ScrollArea',
  'SearchField',
  'Select',
  'Switch',
  'Tab',
  'TextButton',
  'TextField',
  'Textarea',
  'ToastProvider',
  'useToast',
];
for (const name of runtimeExports) {
  assert.ok(name in reactModule, `@hds/react dist is missing the ${name} export`);
}

const tokens = packageFiles('packages/tokens');
requireFiles(tokens, [
  'LICENSE',
  'README.md',
  'dist/tokens.css',
  'dist/tokens.json',
  'fonts.css',
  'fonts/pretendard/LICENSE.txt',
  'package.json',
]);
rejectFiles(tokens, [
  /^scripts\//,
  /^src\//,
  /^tests\//,
  /(?:^|\/)tsconfig(?:\.[^.]+)?\.json$/,
  /vitest\.config\./,
]);

const fontCss = await readFile(path.join(root, 'packages/tokens/fonts.css'), 'utf8');
const fontFiles = [...fontCss.matchAll(/url\(['"]?(.+?\.woff2)['"]?\)/g)]
  .map((match) => match[1].replace(/^\.\//, ''));
assert.equal(fontFiles.length, 92, 'Token font stylesheet must contain 92 WOFF2 references');
assert.equal(new Set(fontFiles).size, 92, 'Token font stylesheet must reference 92 WOFF2 subsets');
for (const font of fontFiles) {
  assert.ok(tokens.paths.has(font), `@hds/tokens tarball is missing ${font}`);
}

const consumer = await mkdtemp(path.join(tmpdir(), 'hds-package-consumer-'));
try {
  const reactTarball = createTarball('packages/react', consumer);
  const tokensTarball = createTarball('packages/tokens', consumer);
  await writeFile(
    path.join(consumer, 'package.json'),
    JSON.stringify({
      name: 'hds-package-consumer',
      private: true,
      type: 'module',
      dependencies: {
        '@hds/react': pathToFileURL(reactTarball).href,
        '@hds/tokens': pathToFileURL(tokensTarball).href,
      },
    }, null, 2),
  );
  execCli(
    'npm',
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--legacy-peer-deps',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
    ],
    {
      cwd: consumer,
      stdio: 'pipe',
    },
  );
  const reactManifest = workspaceRequire.resolve('react/package.json');
  const reactDomManifest = workspaceRequire.resolve('react-dom/package.json');
  const reactTypesManifest = workspaceRequire.resolve('@types/react/package.json');
  const reactDomTypesManifest = workspaceRequire.resolve('@types/react-dom/package.json');
  const typescriptManifest = workspaceRequire.resolve('typescript/package.json');
  const reactDomRequire = createRequire(reactDomManifest);
  const reactTypesRequire = createRequire(reactTypesManifest);
  await Promise.all([
    copyDependency(consumer, 'react', reactManifest),
    copyDependency(consumer, 'react-dom', reactDomManifest),
    copyDependency(
      consumer,
      'scheduler',
      reactDomRequire.resolve('scheduler/package.json'),
    ),
    copyDependency(consumer, '@types/react', reactTypesManifest),
    copyDependency(consumer, '@types/react-dom', reactDomTypesManifest),
    copyDependency(
      consumer,
      'csstype',
      reactTypesRequire.resolve('csstype/package.json'),
    ),
    copyDependency(consumer, 'typescript', typescriptManifest),
  ]);
  execFileSync(
    node,
    [
      '--input-type=module',
      '--eval',
      `
        import assert from 'node:assert/strict';
        import { Button, ICON_NAMES } from '@hds/react';
        assert.ok(Button);
        assert.ok(Array.isArray(ICON_NAMES));
        for (const specifier of [
          '@hds/react/styles.css',
          '@hds/tokens/fonts.css',
          '@hds/tokens/tokens.css',
          '@hds/tokens/tokens.json',
        ]) {
          assert.match(import.meta.resolve(specifier), /^file:/);
        }
      `,
    ],
    {
      cwd: consumer,
      stdio: 'pipe',
    },
  );
  await writeFile(
    path.join(consumer, 'index.ts'),
    `
      import {
        Button,
        type ButtonProps,
        type IconName,
      } from '@hds/react';

      const buttonProps: ButtonProps = { children: '확인' };
      const iconName: IconName = 'check';
      void Button;
      void buttonProps;
      void iconName;
    `,
  );
  await writeFile(
    path.join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'ESNext',
        moduleResolution: 'Bundler',
        noEmit: true,
        skipLibCheck: true,
        strict: true,
        target: 'ES2023',
      },
      include: ['index.ts'],
    }, null, 2),
  );
  execFileSync(
    node,
    [path.join(consumer, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json'],
    {
      cwd: consumer,
      stdio: 'pipe',
    },
  );
} finally {
  await rm(consumer, { force: true, recursive: true });
}

console.log(
  `Package artifacts verified: @hds/react ${react.entryCount} files, `
  + `@hds/tokens ${tokens.entryCount} files, isolated consumer passed.`,
);
