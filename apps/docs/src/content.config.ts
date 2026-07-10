import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { componentSchema } from './content/component-schema';
import { foundationSchema, guideSchema } from './content/page-schema';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }),
  schema: guideSchema,
});

const foundations = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/foundations' }),
  schema: foundationSchema,
});

const components = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/components' }),
  schema: componentSchema,
});

export const collections = { guides, foundations, components };
