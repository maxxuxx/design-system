import { z } from 'astro/zod';

export const COMPONENT_NAMES = [
  'Icon',
  'Badge',
  'Button',
  'TextField',
  'ScrollArea',
  'Checkbox',
  'RadioGroup',
  'Switch',
  'Textarea',
  'Select',
  'TextButton',
  'IconButton',
  'BoardRow',
  'Tab',
  'BottomSheet',
  'Dialog',
  'SearchField',
  'ListRow',
  'Toast',
] as const;
export const COMPONENT_SLUGS = [
  'icon',
  'badge',
  'button',
  'text-field',
  'scroll-area',
  'checkbox',
  'radio-group',
  'switch',
  'textarea',
  'select',
  'text-button',
  'icon-button',
  'board-row',
  'tab',
  'bottom-sheet',
  'dialog',
  'search-field',
  'list-row',
  'toast',
] as const;

export const COMPONENTS = [
  { name: 'Icon', slug: 'icon' },
  { name: 'Badge', slug: 'badge' },
  { name: 'Button', slug: 'button' },
  { name: 'TextField', slug: 'text-field' },
  { name: 'ScrollArea', slug: 'scroll-area' },
  { name: 'Checkbox', slug: 'checkbox' },
  { name: 'RadioGroup', slug: 'radio-group' },
  { name: 'Switch', slug: 'switch' },
  { name: 'Textarea', slug: 'textarea' },
  { name: 'Select', slug: 'select' },
  { name: 'TextButton', slug: 'text-button' },
  { name: 'IconButton', slug: 'icon-button' },
  { name: 'BoardRow', slug: 'board-row' },
  { name: 'Tab', slug: 'tab' },
  { name: 'BottomSheet', slug: 'bottom-sheet' },
  { name: 'Dialog', slug: 'dialog' },
  { name: 'SearchField', slug: 'search-field' },
  { name: 'ListRow', slug: 'list-row' },
  { name: 'Toast', slug: 'toast' },
] as const;
export const COMPONENT_ORDER = new Map(
  COMPONENTS.map(({ name }, index) => [name, index]),
);

const slugByName = new Map(COMPONENTS.map(({ name, slug }) => [name, slug]));

export const componentSchema = z.object({
  name: z.enum(COMPONENT_NAMES),
  slug: z.enum(COMPONENT_SLUGS),
  description: z.string().min(1),
  status: z.literal('preview'),
  figmaUrl: z.union([z.literal(''), z.string().url()]),
  frameworks: z.object({
    react: z.literal('preview'),
    svelte: z.literal('planned'),
    reactNative: z.literal('planned'),
  }),
  variants: z.array(z.string()),
  sizes: z.array(z.string()),
  states: z.array(z.string()),
  accessibility: z.string().min(1),
  props: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    defaultValue: z.string().nullable(),
    description: z.string(),
  })),
  tokens: z.array(z.string()).min(1),
}).superRefine((value, context) => {
  const expectedSlug = slugByName.get(value.name);
  if (value.slug !== expectedSlug) {
    context.addIssue({
      code: 'custom',
      path: ['slug'],
      message: `${value.name} must use slug ${expectedSlug}`,
    });
  }
});

export type ComponentMetadata = z.infer<typeof componentSchema>;

export function validateComponentMetadata(
  value: unknown,
  source: string,
): ComponentMetadata {
  const result = componentSchema.safeParse(value);
  if (result.success) return result.data;
  const details = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`)
    .join('; ');
  throw new Error(`${source}: ${details}`);
}
