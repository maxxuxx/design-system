import { z } from 'astro/zod';

export const GUIDE_SLUGS = ['principles', 'getting-started'] as const;
export const FOUNDATION_SLUGS = [
  'colors',
  'typography',
  'spacing',
  'radius',
  'elevation',
  'motion',
] as const;

export const guideSchema = z.object({
  slug: z.enum(GUIDE_SLUGS),
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().positive(),
});

export const foundationSchema = z.object({
  slug: z.enum(FOUNDATION_SLUGS),
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().positive(),
  tokenPrefixes: z.array(z.string().min(1)).min(1),
});
