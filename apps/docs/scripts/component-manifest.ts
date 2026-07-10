import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import {
  COMPONENT_NAMES,
  COMPONENT_ORDER,
  type ComponentMetadata,
  validateComponentMetadata,
} from '../src/content/component-schema';
import { validateComponentTemplate } from './validate-component-template';

export interface ComponentDocument {
  filePath: string;
  data: unknown;
  body: string;
}

export type ComponentManifestEntry = ComponentMetadata & {
  docsUrl: `/components/${string}/`;
};

export interface ComponentManifest {
  schemaVersion: 1;
  components: ComponentManifestEntry[];
}

export const COMPONENT_CONTENT_DIRECTORY = fileURLToPath(
  new URL('../src/content/components/', import.meta.url),
);
export const COMPONENT_MANIFEST_PATH = fileURLToPath(
  new URL('../public/design-system/components.json', import.meta.url),
);

export async function readComponentDocuments(
  directory = COMPONENT_CONTENT_DIRECTORY,
): Promise<ComponentDocument[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
    .map((entry) => resolve(directory, entry.name))
    .sort((left, right) => left.localeCompare(right, 'en'));
  return Promise.all(paths.map(async (filePath) => {
    const source = await readFile(filePath, 'utf8');
    const parsed = matter(source);
    return { filePath, data: parsed.data, body: parsed.content };
  }));
}

export function buildComponentManifest(
  documents: ComponentDocument[],
  options: { requireFigma?: boolean } = {},
): ComponentManifest {
  const names = new Set<string>();
  const slugs = new Set<string>();
  const components = documents.map((document) => {
    const data = validateComponentMetadata(document.data, document.filePath);
    validateComponentTemplate(document.body, document.filePath);
    const fileId = basename(document.filePath, '.mdx');
    if (fileId !== data.slug) {
      throw new Error(`${document.filePath}: file id ${fileId} must match slug ${data.slug}`);
    }
    if (names.has(data.name)) throw new Error(`Duplicate component name: ${data.name}`);
    if (slugs.has(data.slug)) throw new Error(`Duplicate component slug: ${data.slug}`);
    names.add(data.name);
    slugs.add(data.slug);
    return { ...data, docsUrl: `/components/${data.slug}/` as const };
  }).sort((left, right) =>
    COMPONENT_ORDER.get(left.name)! - COMPONENT_ORDER.get(right.name)!);

  if (options.requireFigma) {
    const missing = COMPONENT_NAMES.filter((name) => !names.has(name));
    if (missing.length > 0) {
      throw new Error(`Release manifest is missing components: ${missing.join(', ')}`);
    }
    const missingFigma = components
      .filter(({ figmaUrl }) => figmaUrl === '')
      .map(({ name }) => name);
    if (missingFigma.length > 0) {
      throw new Error(`Figma URLs are required for release: ${missingFigma.join(', ')}`);
    }
  }
  return { schemaVersion: 1, components };
}

export function renderComponentManifest(manifest: ComponentManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function applyManifestMode(
  mode: 'write' | 'check',
  outputPath: string,
  rendered: string,
): Promise<void> {
  if (mode === 'write') {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, rendered, 'utf8');
    return;
  }
  let current: string | undefined;
  try {
    current = await readFile(outputPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (current !== rendered) {
    throw new Error(
      `Stale component manifest: ${outputPath}. Run "pnpm manifest:write".`,
    );
  }
}

function parseArguments(args: string[]): {
  mode: 'write' | 'check';
  requireFigma: boolean;
} {
  const known = new Set(['--write', '--check', '--require-figma']);
  const unknown = args.filter((argument) => !known.has(argument));
  if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown.join(', ')}`);
  const write = args.includes('--write');
  const check = args.includes('--check');
  if (write === check) throw new Error('Choose exactly one of --write or --check.');
  return { mode: write ? 'write' : 'check', requireFigma: args.includes('--require-figma') };
}

export async function runComponentManifestCli(args: string[]): Promise<void> {
  const { mode, requireFigma } = parseArguments(args);
  const documents = await readComponentDocuments();
  const rendered = renderComponentManifest(
    buildComponentManifest(documents, { requireFigma }),
  );
  await applyManifestMode(mode, COMPONENT_MANIFEST_PATH, rendered);
  if (mode === 'write') console.log(`Wrote ${COMPONENT_MANIFEST_PATH}`);
}

const directEntry = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : '';
if (directEntry === import.meta.url) {
  runComponentManifestCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
