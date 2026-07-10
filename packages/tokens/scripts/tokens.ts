import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderCss, renderJson, resolveTokens } from '../src/generate.js';
import type { TokenDefinition } from '../src/types.js';

interface Artifact {
  path: string;
  content: string;
}

const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const primitivePath = fileURLToPath(
  new URL('../src/primitives.tokens.json', import.meta.url),
);
const semanticPath = fileURLToPath(
  new URL('../src/semantic.tokens.json', import.meta.url),
);
const distCssPath = fileURLToPath(
  new URL('../dist/tokens.css', import.meta.url),
);
const distJsonPath = fileURLToPath(
  new URL('../dist/tokens.json', import.meta.url),
);
const docsJsonPath = fileURLToPath(
  new URL(
    '../../../apps/docs/public/design-system/tokens.json',
    import.meta.url,
  ),
);

function displayPath(path: string): string {
  return relative(repoRoot, path).split(sep).join('/');
}

async function readDefinitions(path: string): Promise<TokenDefinition[]> {
  return JSON.parse(await readFile(path, 'utf8')) as TokenDefinition[];
}

async function buildArtifacts(): Promise<Artifact[]> {
  const [primitive, semantic] = await Promise.all([
    readDefinitions(primitivePath),
    readDefinitions(semanticPath),
  ]);
  const resolved = resolveTokens([...primitive, ...semantic]);
  const css = renderCss(resolved);
  const json = renderJson(resolved);

  return [
    { path: distCssPath, content: css },
    { path: distJsonPath, content: json },
    { path: docsJsonPath, content: json },
  ];
}

async function writeArtifacts(artifacts: Artifact[]): Promise<void> {
  for (const artifact of artifacts) {
    await mkdir(dirname(artifact.path), { recursive: true });
    await writeFile(artifact.path, artifact.content, 'utf8');
    console.log(`Wrote ${displayPath(artifact.path)}`);
  }
}

async function checkArtifacts(artifacts: Artifact[]): Promise<boolean> {
  const stale: string[] = [];

  for (const artifact of artifacts) {
    let actual: string | null = null;
    try {
      actual = await readFile(artifact.path, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    if (actual !== artifact.content) {
      stale.push(displayPath(artifact.path));
    }
  }

  for (const path of stale) {
    console.error(`Stale generated artifact: ${path}`);
  }

  return stale.length === 0;
}

async function main(): Promise<void> {
  const [mode, extra] = process.argv.slice(2);
  if (
    extra !== undefined ||
    (mode !== '--write' && mode !== '--check')
  ) {
    console.error('Usage: tsx scripts/tokens.ts --write|--check');
    process.exitCode = 1;
    return;
  }

  const artifacts = await buildArtifacts();
  if (mode === '--write') {
    await writeArtifacts(artifacts);
    return;
  }

  if (!(await checkArtifacts(artifacts))) {
    process.exitCode = 1;
    return;
  }

  console.log('Generated artifacts are current.');
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
