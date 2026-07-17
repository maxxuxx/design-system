import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  verifyBuildArtifacts,
  verifyFigmaEvidence,
  verifyFontArtifacts,
} from './artifacts.mjs';

const routes = [
  'index.html', 'principles/index.html', 'getting-started/index.html',
  'foundations/colors/index.html', 'foundations/typography/index.html',
  'foundations/spacing/index.html', 'foundations/radius/index.html',
  'foundations/elevation/index.html', 'foundations/motion/index.html',
  'components/index.html', 'components/icon/index.html',
  'components/badge/index.html', 'components/button/index.html',
  'components/text-field/index.html', 'components/scroll-area/index.html',
  'components/checkbox/index.html', 'components/radio-group/index.html',
  'components/switch/index.html', 'components/textarea/index.html',
  'components/select/index.html', 'components/text-button/index.html',
  'components/icon-button/index.html', 'components/board-row/index.html',
  'components/tab/index.html', 'components/bottom-sheet/index.html',
  'components/dialog/index.html', 'components/search-field/index.html',
  'components/list-row/index.html', 'components/toast/index.html',
  'components/bottom-cta/index.html',
];

const collectionNames = ['Primitives', 'Semantic Color', 'Spacing', 'Typography', 'Radius', 'Motion'];
const textStyleNames = ['Display', 'Heading', 'Title', 'Body/Large', 'Body', 'Body/Small', 'Caption', 'Label'];
const pageNames = [
  '00 Cover', '01 Principles', '02 Getting Started', '03 Foundations',
  '04 Components', '04.1 Icon', '04.2 Badge', '04.3 Button',
  '04.4 TextField', '04.5 ScrollArea', '04.6 Checkbox', '04.7 RadioGroup',
  '04.8 Switch', '04.9 Textarea', '04.10 Select',
  '04.11 TextButton', '04.12 IconButton', '04.13 BoardRow', '04.14 Tab',
  '04.15 BottomSheet', '04.16 Dialog', '04.17 SearchField', '04.18 ListRow',
  '04.19 Toast', '04.20 BottomCTA',
  '90 Native Differences', '99 Deprecated',
];

const componentSpecs = [
  {
    name: 'Icon', slug: 'icon',
    variants: ['check', 'chevron-right', 'close', 'info', 'search'],
    sizes: ['16', '20', '24'],
    states: ['decorative', 'labelled'],
  },
  {
    name: 'Badge', slug: 'badge',
    variantCount: 16,
    axes: [
      { name: 'Size', values: ['Small', 'Medium'] },
      { name: 'Variant', values: ['Soft', 'Solid'] },
      { name: 'Tone', values: ['Neutral', 'Primary', 'Success', 'Danger'] },
    ],
    variants: ['soft', 'solid', 'neutral', 'primary', 'success', 'danger'],
    sizes: ['small', 'medium'], states: ['default'],
  },
  {
    name: 'Button', slug: 'button', variants: ['fill', 'weak', 'outline'],
    variantCount: 27,
    axes: [
      { name: 'Size', values: ['Small', 'Medium', 'Large'] },
      { name: 'Variant', values: ['Fill', 'Weak', 'Outline'] },
      { name: 'State', values: ['Default', 'Pressed', 'Disabled'] },
    ],
    sizes: ['small', 'medium', 'large'],
    states: ['default', 'hover', 'pressed', 'focus-visible', 'disabled', 'loading'],
  },
  {
    name: 'TextField', slug: 'text-field', variants: [],
    variantCount: 8,
    axes: [
      { name: 'Size', values: ['Medium', 'Large'] },
      { name: 'State', values: ['Default', 'Focus', 'Error', 'Disabled'] },
    ],
    sizes: ['medium', 'large'], states: ['default', 'focus', 'error', 'disabled'],
  },
  {
    name: 'ScrollArea', slug: 'scroll-area', variants: [], sizes: [],
    variantCount: 4,
    axes: [{ name: 'State', values: ['No overflow', 'Start', 'Middle', 'End'] }],
    states: ['no-overflow', 'start', 'middle', 'end'],
  },
  {
    name: 'Checkbox', slug: 'checkbox', variantCount: 18,
    axes: [
      { name: 'Size', values: ['Small', 'Medium'] },
      { name: 'Value', values: ['Unchecked', 'Checked', 'Indeterminate'] },
      { name: 'State', values: ['Default', 'Error', 'Disabled'] },
    ],
    variants: ['unchecked', 'checked', 'indeterminate'],
    sizes: ['small', 'medium'], states: ['default', 'error', 'disabled'],
  },
  {
    name: 'RadioGroup', slug: 'radio-group', variantCount: 18,
    axes: [
      { name: 'Size', values: ['Small', 'Medium'] },
      { name: 'Selection', values: ['None', 'First', 'Second'] },
      { name: 'State', values: ['Default', 'Error', 'Disabled'] },
    ],
    variants: ['none', 'first', 'second'],
    sizes: ['small', 'medium'], states: ['default', 'error', 'disabled'],
  },
  {
    name: 'Switch', slug: 'switch', variantCount: 12,
    axes: [
      { name: 'Size', values: ['Small', 'Medium'] },
      { name: 'Value', values: ['Off', 'On'] },
      { name: 'State', values: ['Default', 'Error', 'Disabled'] },
    ],
    variants: ['off', 'on'],
    sizes: ['small', 'medium'], states: ['default', 'error', 'disabled'],
  },
  {
    name: 'Textarea', slug: 'textarea', variantCount: 8,
    axes: [
      { name: 'Size', values: ['Medium', 'Large'] },
      { name: 'State', values: ['Default', 'Focus', 'Error', 'Disabled'] },
    ],
    variants: ['vertical', 'none'],
    sizes: ['medium', 'large'], states: ['default', 'focus', 'error', 'disabled'],
  },
  {
    name: 'Select', slug: 'select', variantCount: 8, variants: [],
    axes: [
      { name: 'Size', values: ['Medium', 'Large'] },
      { name: 'State', values: ['Default', 'Focus', 'Error', 'Disabled'] },
    ],
    sizes: ['medium', 'large'], states: ['default', 'focus', 'error', 'disabled'],
  },
  {
    name: 'TextButton', slug: 'text-button', variantCount: 27,
    axes: [
      { name: 'Size', values: ['Small', 'Medium', 'Large'] },
      { name: 'Variant', values: ['Clear', 'Underline', 'Arrow'] },
      { name: 'State', values: ['Default', 'Pressed', 'Disabled'] },
    ],
    variants: ['clear', 'underline', 'arrow'],
    sizes: ['small', 'medium', 'large'],
    states: ['default', 'hover', 'pressed', 'focus-visible', 'visited', 'disabled'],
  },
  {
    name: 'IconButton', slug: 'icon-button', variantCount: 27,
    axes: [
      { name: 'Size', values: ['Small', 'Medium', 'Large'] },
      { name: 'Variant', values: ['Clear', 'Fill', 'Outline'] },
      { name: 'State', values: ['Default', 'Pressed', 'Disabled'] },
    ],
    variants: ['clear', 'fill', 'outline'],
    sizes: ['small', 'medium', 'large'],
    states: ['default', 'hover', 'pressed', 'focus-visible', 'disabled'],
  },
  {
    name: 'BoardRow', slug: 'board-row', variantCount: 4,
    axes: [
      { name: 'Value', values: ['Closed', 'Open'] },
      { name: 'State', values: ['Default', 'Pressed'] },
    ],
    variants: ['closed', 'open'], sizes: [],
    states: ['default', 'hover', 'pressed', 'focus-visible'],
  },
  {
    name: 'Tab', slug: 'tab', variantCount: 12,
    axes: [
      { name: 'Size', values: ['Small', 'Large'] },
      { name: 'Layout', values: ['Equal', 'Scroll'] },
      { name: 'Selection', values: ['First', 'Second', 'Third'] },
    ],
    variants: ['equal', 'scroll'], sizes: ['small', 'large'],
    states: ['default', 'hover', 'pressed', 'focus-visible', 'selected', 'disabled'],
  },
  {
    name: 'BottomSheet', slug: 'bottom-sheet', variantCount: 4,
    axes: [
      { name: 'Height', values: ['Content', 'Full'] },
      { name: 'Footer', values: ['Hidden', 'Visible'] },
    ],
    variants: ['content', 'full'], sizes: [], states: ['open', 'closing'],
  },
  {
    name: 'Dialog', slug: 'dialog', variantCount: 4,
    axes: [
      { name: 'Type', values: ['Alert', 'Confirm'] },
      { name: 'Description', values: ['Hidden', 'Visible'] },
    ],
    variants: ['alert', 'confirm'], sizes: [],
    states: ['open', 'closing', 'disabled', 'loading'],
  },
  {
    name: 'SearchField', slug: 'search-field', variantCount: 8,
    axes: [
      { name: 'Value', values: ['Empty', 'Filled'] },
      { name: 'State', values: ['Default', 'Focus', 'Disabled', 'ReadOnly'] },
    ],
    variants: ['empty', 'filled'], sizes: [],
    states: ['default', 'focus', 'disabled', 'readonly'],
  },
  {
    name: 'ListRow', slug: 'list-row', variantCount: 6,
    axes: [
      { name: 'Divider', values: ['None', 'Indented'] },
      { name: 'State', values: ['Default', 'Pressed', 'Disabled'] },
    ],
    variants: ['none', 'indented'], sizes: [], states: ['default', 'pressed', 'disabled'],
  },
  {
    name: 'Toast', slug: 'toast', variantCount: 6,
    axes: [
      { name: 'Tone', values: ['Neutral', 'Success', 'Danger'] },
      { name: 'Action', values: ['Hidden', 'Visible'] },
    ],
    variants: ['neutral', 'success', 'danger', 'action-hidden', 'action-visible'], sizes: [],
    states: ['visible', 'queued', 'paused', 'persistent'],
  },
  {
    name: 'BottomCTA', slug: 'bottom-cta', variantCount: 4,
    axes: [
      { name: 'Layout', values: ['Single', 'Double'] },
      { name: 'Background', values: ['Default', 'None'] },
    ],
    variants: ['single', 'double', 'background-default', 'background-none'], sizes: [],
    states: ['static', 'fixed', 'take-space'],
  },
];

const manifestProps = {
  Icon: [
    { name: 'name', type: 'IconName', required: true, defaultValue: null },
    { name: 'size', type: 'IconSize', required: false, defaultValue: '24' },
    { name: 'label', type: 'string', required: false, defaultValue: null },
    {
      name: '...svgProps',
      type: "Omit<SVGProps<SVGSVGElement>, 'children' | 'role' | 'aria-label' | 'aria-labelledby' | 'aria-hidden' | 'tabIndex' | 'focusable' | 'dangerouslySetInnerHTML' | 'style' | 'width' | 'height' | 'viewBox' | 'fill' | 'stroke' | 'strokeLinecap' | 'strokeLinejoin'>",
      required: false,
      defaultValue: null,
    },
  ],
  Badge: [
    { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
    { name: 'size', type: 'BadgeSize', required: false, defaultValue: 'medium' },
    { name: 'variant', type: 'BadgeVariant', required: false, defaultValue: 'soft' },
    { name: 'tone', type: 'BadgeTone', required: false, defaultValue: 'neutral' },
    {
      name: '...spanProps',
      type: 'HTMLAttributes<HTMLSpanElement>',
      required: false,
      defaultValue: null,
    },
  ],
  Button: [
    { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
    { name: 'size', type: 'ButtonSize', required: false, defaultValue: 'medium' },
    { name: 'variant', type: 'ButtonVariant', required: false, defaultValue: 'fill' },
    { name: 'width', type: 'ButtonWidth', required: false, defaultValue: 'hug' },
    { name: 'loading', type: 'boolean', required: false, defaultValue: 'false' },
    {
      name: 'leadingIcon',
      type: 'ReactElement<IconProps, typeof Icon>',
      required: false,
      defaultValue: null,
    },
    {
      name: 'trailingIcon',
      type: 'ReactElement<IconProps, typeof Icon>',
      required: false,
      defaultValue: null,
    },
    {
      name: '...buttonProps',
      type: 'ButtonHTMLAttributes<HTMLButtonElement>',
      required: false,
      defaultValue: null,
    },
  ],
  TextField: [
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'size', type: 'TextFieldSize', required: false, defaultValue: 'medium' },
    { name: 'type', type: 'TextFieldType', required: false, defaultValue: 'text' },
    {
      name: '...inputProps',
      type: "Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>",
      required: false,
      defaultValue: null,
    },
  ],
  ScrollArea: [
    { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'scrollUpLabel', type: 'string', required: true, defaultValue: null },
    { name: 'scrollDownLabel', type: 'string', required: true, defaultValue: null },
    { name: 'viewportRef', type: 'Ref<HTMLDivElement>', required: false, defaultValue: null },
    {
      name: 'onViewportScroll',
      type: 'UIEventHandler<HTMLDivElement>',
      required: false,
      defaultValue: null,
    },
    {
      name: '...rootProps',
      type: "Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onScroll'>",
      required: false,
      defaultValue: null,
    },
  ],
  Checkbox: [
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'indeterminate', type: 'boolean', required: false, defaultValue: 'false' },
    { name: 'size', type: 'CheckboxSize', required: false, defaultValue: 'medium' },
    {
      name: '...inputProps',
      type: "Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>",
      required: false,
      defaultValue: null,
    },
  ],
  RadioGroup: [
    { name: 'legend', type: 'string', required: true, defaultValue: null },
    { name: 'name', type: 'string', required: true, defaultValue: null },
    { name: 'options', type: 'readonly RadioGroupOption[]', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'size', type: 'RadioGroupSize', required: false, defaultValue: 'medium' },
    { name: 'value', type: 'string', required: false, defaultValue: null },
    { name: 'defaultValue', type: 'string', required: false, defaultValue: null },
    { name: 'required', type: 'boolean', required: false, defaultValue: 'false' },
    {
      name: 'onChange',
      type: 'ChangeEventHandler<HTMLInputElement>',
      required: false,
      defaultValue: null,
    },
    {
      name: '...fieldsetProps',
      type: "Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'children' | 'onChange'>",
      required: false,
      defaultValue: null,
    },
  ],
  Switch: [
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'size', type: 'SwitchSize', required: false, defaultValue: 'medium' },
    {
      name: '...inputProps',
      type: "Omit<InputHTMLAttributes<HTMLInputElement>, 'role' | 'size' | 'type'>",
      required: false,
      defaultValue: null,
    },
  ],
  Textarea: [
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'size', type: 'TextareaSize', required: false, defaultValue: 'medium' },
    { name: 'resize', type: 'TextareaResize', required: false, defaultValue: 'vertical' },
    {
      name: '...textareaProps',
      type: "Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>",
      required: false,
      defaultValue: null,
    },
  ],
  Select: [
    { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'placeholder', type: 'string', required: false, defaultValue: null },
    { name: 'size', type: 'SelectSize', required: false, defaultValue: 'medium' },
    {
      name: '...selectProps',
      type: "Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'multiple' | 'size'>",
      required: false,
      defaultValue: null,
    },
  ],
  TextButton: [
    { name: 'children', type: 'string', required: true, defaultValue: null },
    { name: 'href', type: 'string', required: false, defaultValue: null },
    { name: 'size', type: 'TextButtonSize', required: false, defaultValue: 'medium' },
    { name: 'variant', type: 'TextButtonVariant', required: false, defaultValue: 'clear' },
    { name: 'tone', type: 'TextButtonTone', required: false, defaultValue: 'primary' },
    {
      name: '...nativeProps',
      type: "Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'> | Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>",
      required: false,
      defaultValue: null,
    },
  ],
  IconButton: [
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'name', type: 'IconName', required: true, defaultValue: null },
    { name: 'size', type: 'IconButtonSize', required: false, defaultValue: 'medium' },
    { name: 'variant', type: 'IconButtonVariant', required: false, defaultValue: 'clear' },
    {
      name: '...buttonProps',
      type: "Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'>",
      required: false,
      defaultValue: null,
    },
  ],
  BoardRow: [
    { name: 'title', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'prefix', type: 'ReactNode', required: false, defaultValue: null },
    { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
    { name: 'open', type: 'boolean', required: false, defaultValue: null },
    { name: 'defaultOpen', type: 'boolean', required: false, defaultValue: 'false' },
    { name: 'onOpenChange', type: '(open: boolean) => void', required: false, defaultValue: null },
    {
      name: '...detailsProps',
      type: "Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'children' | 'onToggle' | 'open' | 'prefix'>",
      required: false,
      defaultValue: null,
    },
  ],
  Tab: [
    { name: 'ariaLabel', type: 'string', required: true, defaultValue: null },
    { name: 'items', type: 'readonly TabItem[]', required: true, defaultValue: null },
    { name: 'value', type: 'string', required: false, defaultValue: null },
    { name: 'defaultValue', type: 'string', required: false, defaultValue: 'first enabled' },
    { name: 'onValueChange', type: '(value: string) => void', required: false, defaultValue: null },
    { name: 'size', type: 'TabSize', required: false, defaultValue: 'large' },
    { name: 'layout', type: 'TabLayout', required: false, defaultValue: 'equal' },
    {
      name: '...divProps',
      type: "Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'defaultValue' | 'onChange'>",
      required: false,
      defaultValue: null,
    },
  ],
  BottomSheet: [
    { name: 'open', type: 'boolean', required: true, defaultValue: null },
    {
      name: 'onOpenChange',
      type: '(open: boolean, reason: BottomSheetCloseReason) => void',
      required: true,
      defaultValue: null,
    },
    { name: 'title', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
    { name: 'footer', type: 'ReactNode', required: false, defaultValue: null },
    { name: 'closeLabel', type: 'string', required: true, defaultValue: null },
    { name: 'dismissible', type: 'boolean', required: false, defaultValue: 'true' },
    {
      name: 'portalContainer',
      type: 'HTMLElement | null',
      required: false,
      defaultValue: 'document.body after hydration',
    },
    {
      name: 'initialFocusRef',
      type: 'RefObject<HTMLElement | null>',
      required: false,
      defaultValue: 'owned close button',
    },
  ],
  Dialog: [
    { name: 'open', type: 'boolean', required: true, defaultValue: null },
    { name: 'title', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'alertLabel', type: 'string', required: true, defaultValue: null },
    { name: 'cancelLabel', type: 'string', required: true, defaultValue: null },
    { name: 'confirmLabel', type: 'string', required: true, defaultValue: null },
    { name: 'confirmDisabled', type: 'boolean', required: false, defaultValue: 'false' },
    { name: 'confirmLoading', type: 'boolean', required: false, defaultValue: 'false' },
    { name: 'dismissible', type: 'boolean', required: false, defaultValue: 'true' },
    {
      name: 'portalContainer',
      type: 'HTMLElement | null',
      required: false,
      defaultValue: 'document.body after hydration',
    },
    {
      name: 'onOpenChange',
      type: '((open: boolean, reason: AlertDialogCloseReason) => void) | ((open: boolean, reason: ConfirmDialogCloseReason) => void)',
      required: true,
      defaultValue: null,
    },
    {
      name: '...rootProps',
      type: "Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'>",
      required: false,
      defaultValue: null,
    },
  ],
  SearchField: [
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'clearLabel', type: 'string', required: true, defaultValue: null },
    { name: 'value', type: 'string', required: false, defaultValue: null },
    { name: 'defaultValue', type: 'string', required: false, defaultValue: null },
    { name: 'onValueChange', type: '(value: string) => void', required: false, defaultValue: null },
    { name: 'onClear', type: '() => void', required: false, defaultValue: null },
    { name: 'fixed', type: 'boolean', required: false, defaultValue: 'false' },
    { name: 'takeSpace', type: 'boolean', required: false, defaultValue: 'true' },
    {
      name: '...inputProps',
      type: "Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'defaultValue' | 'onChange' | 'size' | 'type' | 'value'>",
      required: false,
      defaultValue: null,
    },
  ],
  ListRow: [
    { name: 'title', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'left', type: 'ReactNode', required: false, defaultValue: null },
    { name: 'right', type: 'ReactNode', required: false, defaultValue: null },
    { name: 'divider', type: "'none' | 'indented'", required: false, defaultValue: 'none' },
    { name: 'withArrow', type: 'boolean', required: false, defaultValue: 'false' },
    { name: 'href', type: 'string', required: false, defaultValue: null },
    { name: 'onClick', type: 'MouseEventHandler<HTMLButtonElement>', required: false, defaultValue: null },
    {
      name: '...nativeProps',
      type: 'ListRowStaticProps | ListRowButtonProps | ListRowAnchorProps',
      required: false,
      defaultValue: null,
    },
  ],
  Toast: [
    { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
    {
      name: 'portalContainer',
      type: 'HTMLElement | null',
      required: false,
      defaultValue: 'document.body after hydration',
    },
    { name: 'message', type: 'string', required: true, defaultValue: null },
    { name: 'tone', type: 'ToastTone', required: false, defaultValue: 'neutral' },
    { name: 'icon', type: 'IconName', required: false, defaultValue: null },
    {
      name: 'duration',
      type: 'number',
      required: false,
      defaultValue: '3000 or 5000 with action',
    },
    { name: 'position', type: 'ToastPosition', required: false, defaultValue: 'bottom' },
    { name: 'action', type: 'ToastAction', required: false, defaultValue: null },
    { name: 'show', type: '(options: ToastOptions) => string', required: true, defaultValue: null },
    { name: 'dismiss', type: '(id: string) => void', required: true, defaultValue: null },
    { name: 'clear', type: '() => void', required: true, defaultValue: null },
  ],
  BottomCTA: [
    { name: 'primaryAction', type: 'BottomCTAAction', required: true, defaultValue: null },
    { name: 'secondaryAction', type: 'BottomCTAAction', required: false, defaultValue: null },
    { name: 'fixed', type: 'boolean', required: false, defaultValue: 'false' },
    { name: 'takeSpace', type: 'boolean', required: false, defaultValue: 'true' },
    { name: 'hasSafeAreaPadding', type: 'boolean', required: false, defaultValue: 'true' },
    { name: 'background', type: 'BottomCTABackground', required: false, defaultValue: 'default' },
    {
      name: '...divProps',
      type: "Omit<HTMLAttributes<HTMLDivElement>, 'children'>",
      required: false,
      defaultValue: null,
    },
  ],
};

const properties = {
  Icon: [],
  Badge: [{ name: 'Label', type: 'TEXT' }],
  Button: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Loading', type: 'BOOLEAN' },
    { name: 'Show leading icon', type: 'BOOLEAN' },
    { name: 'Show trailing icon', type: 'BOOLEAN' },
    { name: 'Leading icon', type: 'INSTANCE_SWAP' },
    { name: 'Trailing icon', type: 'INSTANCE_SWAP' },
  ],
  TextField: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Value', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
  ScrollArea: [],
  Checkbox: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
  RadioGroup: [
    { name: 'Legend', type: 'TEXT' },
    { name: 'Option 1', type: 'TEXT' },
    { name: 'Option 2', type: 'TEXT' },
    { name: 'Option 3', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
  Switch: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
  Textarea: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Value', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
  Select: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Value', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
  TextButton: [{ name: 'Label', type: 'TEXT' }],
  IconButton: [{ name: 'Icon', type: 'INSTANCE_SWAP' }],
  BoardRow: [
    { name: 'Title', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Prefix', type: 'TEXT' },
    { name: 'Show description', type: 'BOOLEAN' },
    { name: 'Show prefix', type: 'BOOLEAN' },
  ],
  Tab: [
    { name: 'First label', type: 'TEXT' },
    { name: 'Second label', type: 'TEXT' },
    { name: 'Third label', type: 'TEXT' },
  ],
  BottomSheet: [
    { name: 'Title', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Show description', type: 'BOOLEAN' },
  ],
  Dialog: [
    { name: 'Title', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Alert label', type: 'TEXT' },
    { name: 'Cancel label', type: 'TEXT' },
    { name: 'Confirm label', type: 'TEXT' },
    { name: 'Show description', type: 'BOOLEAN' },
  ],
  SearchField: [
    { name: 'Placeholder', type: 'TEXT' },
    { name: 'Value', type: 'TEXT' },
  ],
  ListRow: [
    { name: 'Title', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Right', type: 'TEXT' },
    { name: 'Show left', type: 'BOOLEAN' },
    { name: 'Show description', type: 'BOOLEAN' },
    { name: 'Show right', type: 'BOOLEAN' },
    { name: 'Show arrow', type: 'BOOLEAN' },
    { name: 'Left icon', type: 'INSTANCE_SWAP' },
  ],
  Toast: [
    { name: 'Message', type: 'TEXT' },
    { name: 'Action label', type: 'TEXT' },
    { name: 'Show icon', type: 'BOOLEAN' },
    { name: 'Icon', type: 'INSTANCE_SWAP' },
  ],
  BottomCTA: [
    { name: 'Primary label', type: 'TEXT' },
    { name: 'Secondary label', type: 'TEXT' },
  ],
};

const componentNodeIds = {
  Icon: '31-2',
  Badge: '47-2',
  Button: '65-56',
  TextField: '80-50',
  ScrollArea: '92-2',
  Checkbox: '139-176',
  RadioGroup: '147-272',
  Switch: '153-122',
  Textarea: '158-56',
  Select: '168-72',
  TextButton: '182-121',
  IconButton: '190-134',
  BoardRow: '197-38',
  Tab: '202-59',
  BottomSheet: '209-66',
  Dialog: '219-48',
  SearchField: '238-19',
  ListRow: '253-14',
  Toast: '319-274',
  BottomCTA: '331-55',
};

const iconNodeIds = ['30-4', '30-7', '30-11', '30-16', '30-20'];

const fixtureComponentTokens = {
  Icon: ['color/icon/primary'],
  Badge: ['space/1', 'color/semantic/1'],
  Button: ['size/control/small', 'color/semantic/2'],
  TextField: ['font/size/1', 'color/semantic/3'],
  ScrollArea: ['blur/subtle'],
  Checkbox: ['size/selection/small', 'color/semantic/4'],
  RadioGroup: ['size/selection/medium', 'color/semantic/5'],
  Switch: ['size/switch/small-width', 'color/semantic/6'],
  Textarea: ['size/control/medium', 'color/semantic/7'],
  Select: ['size/control/large', 'color/semantic/8'],
  TextButton: ['size/control/small', 'color/semantic/9'],
  IconButton: ['size/control/medium', 'color/semantic/10'],
  BoardRow: ['size/control/large', 'color/semantic/11'],
  Tab: ['size/control/small', 'color/semantic/12'],
  BottomSheet: ['motion/duration/fast', 'motion/easing/standard', 'color/semantic/13'],
  Dialog: ['space/2', 'color/semantic/14'],
  SearchField: ['size/control/medium', 'color/semantic/15'],
  ListRow: ['size/control/large', 'color/semantic/16'],
  Toast: ['size/control/medium', 'motion/duration/fast', 'color/semantic/17'],
  BottomCTA: ['size/control/large', 'space/1', 'space/4', 'color/semantic/18'],
};
const fixtureTransitiveTokens = {
  TextButton: ['size/icon/small'],
  IconButton: ['size/icon/medium', 'size/icon/large'],
  BoardRow: ['size/icon/medium'],
  BottomSheet: ['size/control/small', 'size/icon/medium'],
  Dialog: ['size/control/small', 'size/control/large', 'size/icon/medium'],
  ListRow: ['size/icon/medium'],
  Toast: ['size/icon/medium'],
};
const sizeTokenNames = [
  'size/icon/small', 'size/icon/medium', 'size/icon/large',
  'size/badge/small', 'size/badge/medium',
  'size/control/small', 'size/control/medium', 'size/control/large',
  'size/selection/small', 'size/selection/medium',
  'size/switch/small-width', 'size/switch/small-height',
  'size/switch/medium-width', 'size/switch/medium-height',
];

function figmaUrl(id) {
  return `https://www.figma.com/design/file?node-id=${encodeURIComponent(id)}`;
}

function withQuery(url, name, value) {
  const parsed = new URL(url);
  parsed.searchParams.set(name, value);
  return parsed.toString();
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function tokenValuesSha256(tokens) {
  const canonical = tokens
    .filter(({ type }) => type !== 'shadow')
    .map(({ name, value, resolvedValue }) => ({
      tokenName: name,
      sourceValue: value,
      resolvedValue,
    }));
  return sha256(JSON.stringify(canonical));
}

function parseShadow(value) {
  const match = value.match(
    /^(-?\d+(?:\.\d+)?)(?:px)? (-?\d+(?:\.\d+)?)px (\d+(?:\.\d+)?)px rgba\((\d+), (\d+), (\d+), (\d+(?:\.\d+)?)\)$/,
  );
  assert.ok(match, `Unsupported fixture shadow: ${value}`);
  return {
    type: 'DROP_SHADOW',
    color: {
      r: Number(match[4]),
      g: Number(match[5]),
      b: Number(match[6]),
      a: Number(match[7]),
    },
    offset: { x: Number(match[1]), y: Number(match[2]) },
    radius: Number(match[3]),
    spread: 0,
    visible: true,
    blendMode: 'NORMAL',
  };
}

function makeEffectReadback(tokens) {
  return tokens
    .filter(({ type }) => type === 'shadow')
    .map((token, index) => ({
      tokenName: token.name,
      styleId: `effect-style:${index + 1}`,
      name: `Shadow/${index + 1}`,
      description: token.description,
      effects: [parseShadow(token.resolvedValue)],
    }));
}

function effectValuesSha256(effectReadback) {
  return sha256(JSON.stringify(effectReadback));
}

function makeTokens() {
  return Array.from({ length: 118 }, (_, index) => {
    const kind = index < 91 ? 'primitive' : 'semantic';
    let name;
    let type;
    if (index < 32) {
      name = `color/primitive/${index + 1}`;
      type = 'color';
    } else if (index < 44) {
      name = `space/${index - 31}`;
      type = 'dimension';
    } else if (index < 58) {
      name = sizeTokenNames[index - 44];
      type = 'dimension';
    } else if (index < 64) {
      name = `radius/${index - 57}`;
      type = 'dimension';
    } else if (index < 72) {
      name = `font/size/${index - 63}`;
      type = 'dimension';
    } else if (index < 80) {
      name = `font/line-height/${index - 71}`;
      type = 'dimension';
    } else if (index < 84) {
      name = `font/weight/${index - 79}`;
      type = 'fontWeight';
    } else if (index === 84) {
      name = 'font/family/sans';
      type = 'fontFamily';
    } else if (index < 87) {
      name = `elevation/${index - 84}`;
      type = 'shadow';
    } else if (index === 87) {
      name = 'blur/subtle';
      type = 'dimension';
    } else if (index < 90) {
      name = `motion/duration/${index === 88 ? 'fast' : 'medium'}`;
      type = 'duration';
    } else if (index === 90) {
      name = 'motion/easing/standard';
      type = 'cubicBezier';
    } else {
      name = index === 91 ? 'color/icon/primary' : `color/semantic/${index - 91}`;
      type = 'color';
    }
    const primitiveValue = type === 'fontFamily'
      ? '"IBM Plex Sans KR", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      : type === 'fontWeight'
        ? 600
        : type === 'duration'
          ? index === 88 ? '120ms' : '200ms'
          : type === 'cubicBezier'
            ? 'cubic-bezier(0.2, 0, 0, 1)'
        : type === 'dimension'
      ? index + 1
      : type === 'shadow'
        ? '0 1px 2px rgba(0, 0, 0, 0.1)'
        : '#112233';
    return {
      name,
      type,
      kind,
      value: kind === 'semantic' ? `{color/primitive/${(index % 32) + 1}}` : primitiveValue,
      description: `token ${index + 1} description`,
      cssVariable: `--hds-${name.replaceAll('/', '-')}`,
      resolvedValue: primitiveValue,
    };
  });
}

function collectionFor(token) {
  if (token.kind === 'semantic') return 'Semantic Color';
  if (token.name.startsWith('motion/')) return 'Motion';
  if (token.name.startsWith('space/') || token.name.startsWith('size/')) return 'Spacing';
  if (token.name.startsWith('font/')) return 'Typography';
  if (token.name.startsWith('radius/')) return 'Radius';
  return 'Primitives';
}

function scopesFor(token, collection) {
  if (collection === 'Primitives' || collection === 'Motion') return [];
  if (collection === 'Radius') return ['CORNER_RADIUS'];
  if (collection === 'Spacing') {
    return token.name.startsWith('size/') ? ['WIDTH_HEIGHT'] : ['GAP'];
  }
  if (collection === 'Typography') {
    if (token.name.startsWith('font/family/')) return ['FONT_FAMILY'];
    if (token.name.startsWith('font/weight/')) return ['FONT_WEIGHT'];
    if (token.name.startsWith('font/line-height/')) return ['LINE_HEIGHT'];
    return ['FONT_SIZE'];
  }
  if (token.name.startsWith('color/text/') || token.name.includes('/on-')) return ['TEXT_FILL'];
  if (token.name.startsWith('color/icon/')) return ['SHAPE_FILL', 'STROKE_COLOR'];
  if (token.name.startsWith('color/border/') || token.name.startsWith('color/focus/')) return ['STROKE_COLOR'];
  return ['FRAME_FILL', 'SHAPE_FILL'];
}

function makeTokenMap(tokens) {
  const collectionIds = Object.fromEntries(
    collectionNames.map((name, index) => [name, `collection:${index + 1}`]),
  );
  const variables = tokens
    .filter(({ type }) => type !== 'shadow')
    .map((token, index) => {
      const collection = collectionFor(token);
      return {
        tokenName: token.name,
        tokenType: token.type === 'color'
          ? 'COLOR'
          : token.type === 'fontFamily' || token.type === 'cubicBezier'
            ? 'STRING'
            : 'FLOAT',
        collection,
        collectionId: collectionIds[collection],
        variableId: `variable:${index + 1}`,
        scopes: scopesFor(token, collection),
        webSyntax: `var(${token.cssVariable})`,
      };
    });
  return {
    schemaVersion: 1,
    collections: collectionNames.map((name, index) => ({
      name,
      id: collectionIds[name],
      mode: { id: `mode:${index + 1}`, name: 'Default' },
      variableCount: variables.filter((variable) => variable.collection === name).length,
    })),
    variables,
    styles: {
      text: textStyleNames.map((name, index) => ({ name, id: `text-style:${index + 1}` })),
      effect: tokens
        .filter(({ type }) => type === 'shadow')
        .map((token, index) => ({
          tokenName: token.name,
          name: `Shadow/${index + 1}`,
          description: token.description,
          styleId: `effect-style:${index + 1}`,
          webSyntax: `var(${token.cssVariable})`,
        })),
    },
  };
}

function makeManifest() {
  return componentSpecs.map(({ name, slug, variants, sizes, states }) => ({
    name,
    slug,
    description: `${name} purpose`,
    status: 'preview',
    figmaUrl: figmaUrl(componentNodeIds[name]),
    frameworks: { react: 'preview', svelte: 'planned', reactNative: 'planned' },
    variants,
    sizes,
    states,
    accessibility: `${name} accessibility contract`,
    props: manifestProps[name].map((prop) => ({
      ...prop,
      description: `${prop.name} property`,
    })),
    tokens: [...fixtureComponentTokens[name], ...(fixtureTransitiveTokens[name] ?? [])],
    docsUrl: `/components/${slug}/`,
  }));
}

function makeVerification(tokens) {
  const effectReadback = makeEffectReadback(tokens);
  const shared = {
    screenshotReviewed: true,
    bindingsAudited: true,
    propParity: true,
  };
  return {
    schemaVersion: 1,
    fileUrl: 'https://www.figma.com/design/file',
    verifiedAt: '2026-07-10T03:00:00.000Z',
    codeConnect: 'skipped-v0.1',
    collections: collectionNames,
    textStyleCount: 8,
    effectStyleCount: 2,
    pages: pageNames,
    tokenValuesSha256: tokenValuesSha256(tokens),
    effectValuesSha256: effectValuesSha256(effectReadback),
    effectReadback,
    pageScreenshotSha256: Object.fromEntries(
      pageNames.map((page) => [page, sha256(`screenshot:${page}`)]),
    ),
    components: Object.fromEntries(componentSpecs.map((spec) => {
      if (spec.name === 'Icon') return ['Icon', {
        catalogUrl: figmaUrl(componentNodeIds.Icon),
        componentCount: 5,
        componentUrls: ['Icon/Check', 'Icon/ChevronRight', 'Icon/Close', 'Icon/Info', 'Icon/Search']
          .map((name, index) => ({ name, url: figmaUrl(iconNodeIds[index]) })),
        properties: properties.Icon,
        ...shared,
      }];
      return [spec.name, {
        componentSetUrl: figmaUrl(componentNodeIds[spec.name]),
        variantCount: spec.variantCount,
        axes: spec.axes,
        properties: properties[spec.name],
        ...shared,
      }];
    })),
    foundations: {
      approved: true,
      approvedAt: '2026-07-10T11:00:00+09:00',
      tokenParity: true,
    },
    pageScreenshotNodeIds: Object.fromEntries(
      pageNames.map((page, index) => [page, `${index + 10}:${index + 2}`]),
    ),
    allPagesScreenshotReviewed: true,
    hardCodedProductValues: 0,
  };
}

async function createFixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'ds-artifacts-'));
  const dist = path.join(root, 'apps', 'docs', 'dist');
  for (const relative of routes) {
    const file = path.join(dist, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, '<!doctype html><h1>ok</h1>');
  }
  const tokens = makeTokens();
  const jsonDir = path.join(dist, 'design-system');
  await mkdir(jsonDir, { recursive: true });
  await writeFile(path.join(jsonDir, 'tokens.json'), JSON.stringify({
    schemaVersion: 1,
    tokens,
  }));
  await writeFile(path.join(jsonDir, 'components.json'), JSON.stringify({
    schemaVersion: 1,
    components: makeManifest(),
  }));
  for (const { name, slug } of componentSpecs) {
    const sourceDir = path.join(root, 'packages', 'react', 'src', slug);
    await mkdir(sourceDir, { recursive: true });
    const declarations = fixtureComponentTokens[name]
      .map((tokenName, index) => `--fixture-${index}: var(--hds-${tokenName.replaceAll('/', '-')});`)
      .join(' ');
    const localVariableContract = name === 'ScrollArea'
      ? '--hds-scroll-area-edge-size: var(--hds-blur-subtle); height: var(--hds-scroll-area-edge-size); '
      : name === 'Switch'
        ? '--hds-switch-track-width: var(--hds-size-switch-small-width); '
          + '--hds-switch-track-height: var(--hds-size-switch-small-width); '
          + 'width: var(--hds-switch-track-width); height: var(--hds-switch-track-height); '
        : name === 'BottomCTA'
          ? 'padding-bottom: var(--hds-safe-area-bottom, var(--hds-space-1)); '
          : '';
    await writeFile(
      path.join(sourceDir, `${name}.css`),
      `.fixture { ${localVariableContract}${declarations} } /* var(--hds-commented-out-token) */`,
    );
  }
  const figmaDir = path.join(root, 'figma');
  await mkdir(figmaDir, { recursive: true });
  await writeFile(path.join(figmaDir, 'token-map.json'), JSON.stringify(makeTokenMap(tokens)));
  await writeFile(path.join(figmaDir, 'verification.json'), JSON.stringify(makeVerification(tokens)));
  return root;
}

async function createFontFixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'ds-fonts-'));
  const tokensRoot = path.join(root, 'packages', 'tokens');
  const fontsRoot = path.join(tokensRoot, 'fonts', 'pretendard');
  const woff2Root = path.join(fontsRoot, 'woff2');
  await mkdir(woff2Root, { recursive: true });
  const faces = Array.from({ length: 92 }, (_, index) => [
    '@font-face {',
    "  font-family: 'Pretendard Variable';",
    '  font-display: swap;',
    '  font-weight: 45 920;',
    `  src: url(./fonts/pretendard/woff2/PretendardVariable.subset.${index}.woff2) format('woff2-variations');`,
    `  unicode-range: U+${index.toString(16)};`,
    '}',
  ].join('\n'));
  await writeFile(path.join(tokensRoot, 'fonts.css'), faces.join('\n'));
  await writeFile(path.join(fontsRoot, 'LICENSE.txt'), 'SIL Open Font License 1.1');
  await Promise.all(Array.from({ length: 92 }, (_, index) => writeFile(
    path.join(woff2Root, `PretendardVariable.subset.${index}.woff2`),
    `font-${index}`,
  )));
  return root;
}

test('accepts a complete local Pretendard font package', async (t) => {
  const root = await createFontFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.deepEqual(await verifyFontArtifacts(root), []);
});

test('rejects external, missing, and unlicensed Pretendard assets', async (t) => {
  const root = await createFontFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const cssPath = path.join(root, 'packages', 'tokens', 'fonts.css');
  const css = await readFile(cssPath, 'utf8');
  await writeFile(cssPath, css.replace(
    './fonts/pretendard/woff2/PretendardVariable.subset.0.woff2',
    'https://cdn.example.com/PretendardVariable.subset.0.woff2',
  ));
  await rm(path.join(
    root,
    'packages/tokens/fonts/pretendard/woff2/PretendardVariable.subset.1.woff2',
  ));
  await rm(path.join(root, 'packages/tokens/fonts/pretendard/LICENSE.txt'));

  const violations = await verifyFontArtifacts(root);
  assert.ok(violations.includes('Pretendard fonts.css must not use external font URLs'));
  assert.ok(violations.includes('Missing Pretendard font asset: ./fonts/pretendard/woff2/PretendardVariable.subset.1.woff2'));
  assert.ok(violations.includes('Missing Pretendard SIL OFL license'));
});

test('accepts a complete HDS v0.1.0 build, 118-token map, twenty-component manifest, and Figma evidence', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.deepEqual(await verifyBuildArtifacts(root), []);
  assert.deepEqual(await verifyFigmaEvidence(root), []);
});

test('accepts equivalent Figma node URLs with additional query metadata', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  manifest.components[0].figmaUrl = withQuery(manifest.components[0].figmaUrl, 'source', 'manifest');
  await writeFile(file, JSON.stringify(manifest));
  assert.deepEqual(await verifyFigmaEvidence(root), []);
});

test('reports every missing HDS v0.1.0 static route', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const newRoutes = [
    'foundations/motion/index.html',
    'components/index.html',
    'components/text-button/index.html',
    'components/icon-button/index.html',
    'components/board-row/index.html',
    'components/tab/index.html',
    'components/bottom-sheet/index.html',
    'components/dialog/index.html',
    'components/search-field/index.html',
    'components/list-row/index.html',
    'components/toast/index.html',
    'components/bottom-cta/index.html',
  ];
  await Promise.all(newRoutes.map((route) => rm(
    path.join(root, 'apps', 'docs', 'dist', route),
  )));
  const violations = await verifyBuildArtifacts(root);
  for (const route of newRoutes) {
    assert.ok(violations.includes(`Missing build artifact: ${route}`));
  }
});

test('rejects an extra static HTML route beyond the exact 30-route contract', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const extra = path.join(root, 'apps', 'docs', 'dist', 'components', 'invented', 'index.html');
  await mkdir(path.dirname(extra), { recursive: true });
  await writeFile(extra, '<!doctype html><h1>invented</h1>');
  assert.ok((await verifyBuildArtifacts(root))
    .includes('Static HTML routes must be exactly the 30 canonical routes'));
});

test('rejects token count, kind, cssVariable, and resolvedValue drift', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'tokens.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  artifact.tokens.pop();
  artifact.tokens[0].kind = 'other';
  artifact.tokens[1].cssVariable = '--wrong';
  delete artifact.tokens[2].resolvedValue;
  artifact.tokens.find(({ name }) => name === 'motion/duration/fast').type = 'dimension';
  artifact.tokens.find(({ name }) => name === 'motion/easing/standard').type = 'dimension';
  await writeFile(file, JSON.stringify(artifact));
  const violations = await verifyBuildArtifacts(root);
  assert.ok(violations.some((value) => value.includes('exactly 118 tokens')));
  assert.ok(violations.some((value) => value.includes('exactly 91 primitive tokens')));
  assert.ok(violations.some((value) => value.includes('exactly 27 semantic tokens')));
  assert.ok(violations.some((value) => value.includes('exactly 2 duration tokens')));
  assert.ok(violations.some((value) => value.includes('exactly 1 cubicBezier token')));
  assert.ok(violations.some((value) => value.includes('invalid kind')));
  assert.ok(violations.some((value) => value.includes('cssVariable mismatch')));
  assert.ok(violations.some((value) => value.includes('missing resolvedValue')));
});

test('rejects component order, status, full-field, prop, and distinct-URL drift', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  artifact.components.pop();
  artifact.components.reverse();
  artifact.components[0].status = 'stable';
  artifact.components[0].description = '';
  delete artifact.components[1].accessibility;
  artifact.components[1].variants = 'default';
  artifact.components[2].props[0].required = 'false';
  artifact.components[2].tokens = [];
  artifact.components[3].figmaUrl = artifact.components[2].figmaUrl;
  await writeFile(file, JSON.stringify(artifact));
  const violations = await verifyBuildArtifacts(root);
  assert.ok(violations.some((value) => value.includes('exactly 20 components')));
  assert.ok(violations.some((value) => value.includes('Component index 0 must be Icon')));
  assert.ok(violations.some((value) => value.includes('status must be preview')));
  assert.ok(violations.some((value) => value.includes('description must be non-empty')));
  assert.ok(violations.some((value) => value.includes('missing accessibility')));
  assert.ok(violations.some((value) => value.includes('variants must be a string array')));
  assert.ok(violations.some((value) => value.includes('prop 0 required must be boolean')));
  assert.ok(violations.some((value) => value.includes('tokens must be a non-empty string array')));
  assert.ok(violations.some((value) => value.includes('twenty distinct Figma URLs')));
});

test('rejects exact public component prop-contract drift', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  artifact.components.find(({ name }) => name === 'Icon').props.at(-1).type =
    'SVGProps<SVGSVGElement>';
  artifact.components.find(({ name }) => name === 'Button').props
    .find(({ name }) => name === 'leadingIcon').type = 'ReactElement<IconProps>';
  artifact.components.find(({ name }) => name === 'TextField').props
    .find(({ name }) => name === 'type').type = 'string';
  artifact.components.find(({ name }) => name === 'ScrollArea').props
    .find(({ name }) => name === 'viewportRef').type = 'MutableRefObject<HTMLDivElement>';
  artifact.components.find(({ name }) => name === 'Checkbox').props
    .find(({ name }) => name === 'indeterminate').defaultValue = 'true';
  artifact.components.find(({ name }) => name === 'RadioGroup').props
    .find(({ name }) => name === 'options').type = 'RadioGroupOption[]';
  artifact.components.find(({ name }) => name === 'Switch').props
    .find(({ name }) => name === '...inputProps').type = 'InputHTMLAttributes<HTMLInputElement>';
  artifact.components.find(({ name }) => name === 'Textarea').props
    .find(({ name }) => name === 'resize').type = 'string';
  artifact.components.find(({ name }) => name === 'Select').props
    .find(({ name }) => name === '...selectProps').type = 'SelectHTMLAttributes<HTMLSelectElement>';
  artifact.components.find(({ name }) => name === 'TextButton').props
    .find(({ name }) => name === '...nativeProps').type = 'HTMLAttributes<HTMLElement>';
  artifact.components.find(({ name }) => name === 'IconButton').props
    .find(({ name }) => name === '...buttonProps').type = 'ButtonHTMLAttributes<HTMLButtonElement>';
  artifact.components.find(({ name }) => name === 'BoardRow').props
    .find(({ name }) => name === '...detailsProps').type = 'DetailsHTMLAttributes<HTMLDetailsElement>';
  artifact.components.find(({ name }) => name === 'Tab').props
    .find(({ name }) => name === 'items').type = 'TabItem[]';
  artifact.components.find(({ name }) => name === 'BottomSheet').props
    .find(({ name }) => name === 'initialFocusRef').type = 'RefObject<HTMLElement>';
  artifact.components.find(({ name }) => name === 'Dialog').props
    .find(({ name }) => name === 'onOpenChange').type = '(open: boolean) => void';
  artifact.components.find(({ name }) => name === 'SearchField').props
    .find(({ name }) => name === '...inputProps').type = 'InputHTMLAttributes<HTMLInputElement>';
  artifact.components.find(({ name }) => name === 'ListRow').props
    .find(({ name }) => name === '...nativeProps').type = 'HTMLAttributes<HTMLElement>';
  artifact.components.find(({ name }) => name === 'Toast').props
    .find(({ name }) => name === 'duration').defaultValue = '3000';
  artifact.components.find(({ name }) => name === 'BottomCTA').props
    .find(({ name }) => name === 'primaryAction').type = 'ReactElement';
  await writeFile(file, JSON.stringify(artifact));

  const violations = await verifyBuildArtifacts(root);
  assert.ok(violations.includes('Icon prop contract mismatch'));
  assert.ok(violations.includes('Button prop contract mismatch'));
  assert.ok(violations.includes('TextField prop contract mismatch'));
  assert.ok(violations.includes('ScrollArea prop contract mismatch'));
  assert.ok(violations.includes('Checkbox prop contract mismatch'));
  assert.ok(violations.includes('RadioGroup prop contract mismatch'));
  assert.ok(violations.includes('Switch prop contract mismatch'));
  assert.ok(violations.includes('Textarea prop contract mismatch'));
  assert.ok(violations.includes('Select prop contract mismatch'));
  assert.ok(violations.includes('TextButton prop contract mismatch'));
  assert.ok(violations.includes('IconButton prop contract mismatch'));
  assert.ok(violations.includes('BoardRow prop contract mismatch'));
  assert.ok(violations.includes('Tab prop contract mismatch'));
  assert.ok(violations.includes('BottomSheet prop contract mismatch'));
  assert.ok(violations.includes('Dialog prop contract mismatch'));
  assert.ok(violations.includes('SearchField prop contract mismatch'));
  assert.ok(violations.includes('ListRow prop contract mismatch'));
  assert.ok(violations.includes('Toast prop contract mismatch'));
  assert.ok(violations.includes('BottomCTA prop contract mismatch'));
});

test('rejects every missing HDS v0.1.0 component manifest record', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  const names = ['Dialog', 'SearchField', 'ListRow', 'Toast', 'BottomCTA'];
  artifact.components = artifact.components.filter(({ name }) => !names.includes(name));
  await writeFile(file, JSON.stringify(artifact));

  const violations = await verifyBuildArtifacts(root);
  assert.ok(violations.includes('components.json must contain exactly 20 components'));
  names.forEach((name, offset) => {
    assert.ok(violations.includes(`Component index ${offset + 15} must be ${name}`));
  });
});

test('rejects token-contract drift for every HDS v0.1.0 component', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifestFile = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  const names = ['Dialog', 'SearchField', 'ListRow', 'Toast', 'BottomCTA'];
  const removed = Object.fromEntries(names.map((name) => {
    const component = manifest.components.find((entry) => entry.name === name);
    return [name, component.tokens.shift()];
  }));
  await writeFile(manifestFile, JSON.stringify(manifest));

  const violations = await verifyBuildArtifacts(root);
  for (const name of names) {
    assert.ok(violations.includes(`${name} manifest tokens omit CSS token: ${removed[name]}`));
  }
});

test('rejects unknown, omitted, invented, and duplicate component token declarations', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const badgeCss = path.join(root, 'packages', 'react', 'src', 'badge', 'Badge.css');
  await writeFile(badgeCss, [
    await readFile(badgeCss, 'utf8'),
    '.drift {',
    '  --missing: var(--hds-space-2);',
    '  --hds-not-a-token: 1px;',
    '  --unknown: var(--hds-not-a-token);',
    '}',
  ].join('\n'));

  const manifestFile = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  const badge = manifest.components.find(({ name }) => name === 'Badge');
  badge.tokens.push('radius/1', 'invented/token', badge.tokens[0]);
  await writeFile(manifestFile, JSON.stringify(manifest));

  const violations = await verifyBuildArtifacts(root);
  assert.ok(violations.includes('Badge CSS references unknown token variable: --hds-not-a-token'));
  assert.ok(violations.includes('Badge manifest tokens omit CSS token: space/2'));
  assert.ok(violations.includes('Badge manifest tokens include unused CSS token: radius/1'));
  assert.ok(violations.includes('Badge manifest tokens include unknown token: invented/token'));
  assert.ok(violations.includes('Badge manifest tokens contain duplicate token: space/1'));
});

test('rejects a missing component CSS source', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await rm(path.join(root, 'packages', 'react', 'src', 'button', 'Button.css'));
  assert.ok((await verifyBuildArtifacts(root))
    .includes('Button CSS source is unreadable: packages/react/src/button/Button.css'));
});

test('rejects incomplete token-map equality and WEB syntax', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'token-map.json');
  const tokenMap = JSON.parse(await readFile(file, 'utf8'));
  tokenMap.variables[0].webSyntax = 'var(--wrong)';
  delete tokenMap.variables[1].collectionId;
  const easing = tokenMap.variables.find(({ tokenName }) => tokenName === 'motion/easing/standard');
  easing.scopes = ['ALL_SCOPES'];
  easing.tokenType = 'FLOAT';
  tokenMap.variables = tokenMap.variables.filter(({ tokenName }) => tokenName !== 'color/semantic/26');
  tokenMap.collections.find(({ name }) => name === 'Primitives').variableCount = 32;
  tokenMap.collections.find(({ name }) => name === 'Spacing').variableCount = 25;
  tokenMap.collections.find(({ name }) => name === 'Motion').variableCount = 2;
  tokenMap.styles.effect[0].description = 'drifted description';
  await writeFile(file, JSON.stringify(tokenMap));
  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.some((value) => value.includes('token-name mapping must equal tokens.json')));
  assert.ok(violations.some((value) => value.includes('exactly 116 variables')));
  assert.ok(violations.some((value) => value.includes('exactly 27 Semantic Color variables')));
  assert.ok(violations.some((value) => value.includes('exactly 59 COLOR variables')));
  assert.ok(violations.some((value) => value.includes('Primitives collection must contain exactly 33 variables')));
  assert.ok(violations.some((value) => value.includes('Spacing collection must contain exactly 26 variables')));
  assert.ok(violations.some((value) => value.includes('Motion collection must contain exactly 3 variables')));
  assert.ok(violations.some((value) => value.includes('Primitives variableCount must be 33')));
  assert.ok(violations.some((value) => value.includes('Motion variableCount must be 3')));
  assert.ok(violations.some((value) => value.includes('WEB syntax mismatch')));
  assert.ok(violations.some((value) => value.includes('variable fields mismatch')));
  assert.ok(violations.some((value) => value.includes('scopes mismatch')));
  assert.ok(violations.some((value) => value.includes('motion/easing/standard tokenType mismatch')));
  assert.ok(violations.some((value) => value.includes('effect style description mismatch')));
});

test('rejects exact Figma counts, Icon URLs, and property definitions', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.components.Icon.componentCount = 4;
  evidence.components.Icon.componentUrls.pop();
  evidence.components.Badge.properties = [];
  evidence.components.Badge.variantCount = 15;
  evidence.components.Button.variantCount = 26;
  evidence.components.Button.properties[1].type = 'TEXT';
  evidence.components.TextField.variantCount = 7;
  evidence.components.TextField.properties.pop();
  evidence.components.ScrollArea.variantCount = 3;
  evidence.components.ScrollArea.properties = [{ name: 'Content', type: 'TEXT' }];
  evidence.components.Checkbox.variantCount = 17;
  evidence.components.Checkbox.properties.pop();
  evidence.components.Checkbox.axes[1].values.pop();
  evidence.components.RadioGroup.variantCount = 17;
  evidence.components.RadioGroup.properties[1].name = 'First option';
  evidence.components.RadioGroup.axes[1].name = 'Value';
  evidence.components.Switch.variantCount = 11;
  evidence.components.Switch.properties[0].type = 'BOOLEAN';
  evidence.components.Switch.axes[1].values.reverse();
  evidence.components.Textarea.variantCount = 7;
  evidence.components.Textarea.properties.pop();
  evidence.components.Textarea.axes[0].values.pop();
  evidence.components.Select.variantCount = 7;
  evidence.components.Select.properties[1].name = 'Selection';
  evidence.components.Select.axes[1].values[1] = 'Focused';
  evidence.components.TextButton.variantCount = 26;
  evidence.components.TextButton.properties[0].type = 'BOOLEAN';
  evidence.components.TextButton.axes[1].values[1] = 'Link';
  evidence.components.IconButton.variantCount = 26;
  evidence.components.IconButton.properties = [];
  evidence.components.IconButton.axes[1].values.reverse();
  evidence.components.BoardRow.variantCount = 3;
  evidence.components.BoardRow.properties.pop();
  evidence.components.BoardRow.axes[0].values.reverse();
  evidence.components.Tab.variantCount = 11;
  evidence.components.Tab.properties[0].name = 'First';
  evidence.components.Tab.axes[1].values.reverse();
  evidence.components.BottomSheet.variantCount = 3;
  evidence.components.BottomSheet.properties.pop();
  evidence.components.BottomSheet.axes[1].values.reverse();
  evidence.components.Dialog.variantCount = 3;
  evidence.components.Dialog.properties.pop();
  evidence.components.Dialog.axes[0].values.reverse();
  evidence.components.SearchField.variantCount = 7;
  evidence.components.SearchField.properties.pop();
  evidence.components.SearchField.axes[1].values.reverse();
  evidence.components.ListRow.variantCount = 5;
  evidence.components.ListRow.properties.pop();
  evidence.components.ListRow.axes[0].values.reverse();
  evidence.components.Toast.variantCount = 5;
  evidence.components.Toast.properties.pop();
  evidence.components.Toast.axes[0].values.reverse();
  evidence.components.BottomCTA.variantCount = 3;
  evidence.components.BottomCTA.properties.pop();
  evidence.components.BottomCTA.axes[1].values.reverse();
  await writeFile(file, JSON.stringify(evidence));
  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.some((value) => value.includes('Icon componentCount must be 5')));
  assert.ok(violations.some((value) => value.includes('Icon componentUrls must contain five exact icons')));
  assert.ok(violations.some((value) => value.includes('Badge property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Badge variantCount must be 16')));
  assert.ok(violations.some((value) => value.includes('Button variantCount must be 27')));
  assert.ok(violations.some((value) => value.includes('Button property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('TextField variantCount must be 8')));
  assert.ok(violations.some((value) => value.includes('TextField property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('ScrollArea variantCount must be 4')));
  assert.ok(violations.some((value) => value.includes('ScrollArea property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Checkbox variantCount must be 18')));
  assert.ok(violations.some((value) => value.includes('Checkbox property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Checkbox axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('RadioGroup variantCount must be 18')));
  assert.ok(violations.some((value) => value.includes('RadioGroup property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('RadioGroup axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Switch variantCount must be 12')));
  assert.ok(violations.some((value) => value.includes('Switch property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Switch axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Textarea variantCount must be 8')));
  assert.ok(violations.some((value) => value.includes('Textarea property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Textarea axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Select variantCount must be 8')));
  assert.ok(violations.some((value) => value.includes('Select property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Select axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('TextButton variantCount must be 27')));
  assert.ok(violations.some((value) => value.includes('TextButton property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('TextButton axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('IconButton variantCount must be 27')));
  assert.ok(violations.some((value) => value.includes('IconButton property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('IconButton axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('BoardRow variantCount must be 4')));
  assert.ok(violations.some((value) => value.includes('BoardRow property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('BoardRow axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Tab variantCount must be 12')));
  assert.ok(violations.some((value) => value.includes('Tab property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Tab axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('BottomSheet variantCount must be 4')));
  assert.ok(violations.some((value) => value.includes('BottomSheet property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('BottomSheet axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Dialog variantCount must be 4')));
  assert.ok(violations.some((value) => value.includes('Dialog property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Dialog axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('SearchField variantCount must be 8')));
  assert.ok(violations.some((value) => value.includes('SearchField property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('SearchField axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('ListRow variantCount must be 6')));
  assert.ok(violations.some((value) => value.includes('ListRow property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('ListRow axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Toast variantCount must be 6')));
  assert.ok(violations.some((value) => value.includes('Toast property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Toast axis definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('BottomCTA variantCount must be 4')));
  assert.ok(violations.some((value) => value.includes('BottomCTA property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('BottomCTA axis definitions mismatch')));
});

test('rejects every missing HDS v0.1.0 Figma component and page record', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  const records = [
    ['TextButton', '04.11 TextButton'],
    ['IconButton', '04.12 IconButton'],
    ['BoardRow', '04.13 BoardRow'],
    ['Tab', '04.14 Tab'],
    ['BottomSheet', '04.15 BottomSheet'],
    ['Dialog', '04.16 Dialog'],
    ['SearchField', '04.17 SearchField'],
    ['ListRow', '04.18 ListRow'],
    ['Toast', '04.19 Toast'],
    ['BottomCTA', '04.20 BottomCTA'],
  ];
  for (const [name, page] of records) {
    delete evidence.components[name];
    delete evidence.pageScreenshotSha256[page];
    delete evidence.pageScreenshotNodeIds[page];
  }
  await writeFile(file, JSON.stringify(evidence));

  const violations = await verifyFigmaEvidence(root);
  for (const [name, page] of records) {
    assert.ok(violations.includes(`Missing Figma evidence: ${name}`));
    assert.ok(violations.includes(`${page} screenshot SHA-256 is required`));
    assert.ok(violations.includes(`${page} screenshot node ID is required`));
  }
});

test('rejects exact Figma page, style, and component-set totals', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.pages = evidence.pages.filter((page) => page !== '04.20 BottomCTA');
  evidence.textStyleCount = 7;
  evidence.effectStyleCount = 1;
  delete evidence.components.BottomCTA.componentSetUrl;
  await writeFile(file, JSON.stringify(evidence));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.includes('Figma page list mismatch'));
  assert.ok(violations.includes('Figma textStyleCount must be 8'));
  assert.ok(violations.includes('Figma effectStyleCount must be 2'));
  assert.ok(violations.includes('Figma evidence must expose exactly nineteen component sets'));
  assert.ok(violations.includes('BottomCTA evidence fields mismatch'));
});

test('rejects approval, Code Connect, screenshot, hard-code, and URL mapping drift', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const evidenceFile = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(evidenceFile, 'utf8'));
  evidence.codeConnect = 'published';
  evidence.foundations.approved = false;
  delete evidence.pageScreenshotNodeIds['04.2 Badge'];
  evidence.hardCodedProductValues = 1;
  await writeFile(evidenceFile, JSON.stringify(evidence));

  const manifestFile = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  manifest.components[0].figmaUrl = figmaUrl('999-9');
  await writeFile(manifestFile, JSON.stringify(manifest));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.some((value) => value.includes('Code Connect must be skipped-v0.1')));
  assert.ok(violations.some((value) => value.includes('Foundations approval')));
  assert.ok(violations.some((value) => value.includes('04.2 Badge screenshot node')));
  assert.ok(violations.some((value) => value.includes('hard-coded product values')));
  assert.ok(violations.some((value) => value.includes('Icon manifest Figma URL')));
});

test('rejects token value drift from the canonical Figma digest', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'tokens.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  artifact.tokens[0].value = '#445566';
  artifact.tokens[0].resolvedValue = '#445566';
  await writeFile(file, JSON.stringify(artifact));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma tokenValuesSha256 must match code token values'));
});

test('rejects effect value drift from the canonical Figma digest', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'tokens.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  const shadow = artifact.tokens.find(({ name }) => name === 'elevation/1');
  shadow.value = '0 2px 4px rgba(0, 0, 0, 0.1)';
  shadow.resolvedValue = '0 2px 4px rgba(0, 0, 0, 0.1)';
  await writeFile(file, JSON.stringify(artifact));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma effect readback must match code effect values'));
});

test('rejects live Figma effect readback drift even with a refreshed digest', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.effectReadback[0].effects[0].radius = 99;
  evidence.effectValuesSha256 = effectValuesSha256(evidence.effectReadback);
  await writeFile(file, JSON.stringify(evidence));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma effect readback must match code effect values'));
});

test('rejects malformed token and page screenshot SHA-256 evidence', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.tokenValuesSha256 = 'not-a-digest';
  evidence.effectValuesSha256 = 'short';
  evidence.pageScreenshotSha256['01 Principles'] = 'short';
  delete evidence.pageScreenshotSha256['04.2 Badge'];
  evidence.pageScreenshotSha256.Extra = '0'.repeat(64);
  await writeFile(file, JSON.stringify(evidence));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.includes('Figma tokenValuesSha256 must be a 64-character hexadecimal digest'));
  assert.ok(violations.includes('Figma tokenValuesSha256 must match code token values'));
  assert.ok(violations.includes('Figma effectValuesSha256 must be a 64-character hexadecimal digest'));
  assert.ok(violations.includes('Figma effectValuesSha256 must match live effect readback'));
  assert.ok(violations.includes('Figma pageScreenshotSha256 must contain exactly all pages'));
  assert.ok(violations.includes('01 Principles screenshot SHA-256 must be a 64-character hexadecimal digest'));
  assert.ok(violations.includes('04.2 Badge screenshot SHA-256 is required'));
});

test('rejects duplicate Figma page screenshot digests', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.pageScreenshotSha256['01 Principles'] = evidence.pageScreenshotSha256['00 Cover'];
  await writeFile(file, JSON.stringify(evidence));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma page screenshot SHA-256 digests must be unique'));
});

test('rejects cross-file and duplicate normalized Figma node targets', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const evidenceFile = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(evidenceFile, 'utf8'));
  evidence.components.Icon.componentUrls[0].url = figmaUrl('91-2');
  evidence.components.Icon.componentUrls[1].url = withQuery(figmaUrl('91:2'), 'source', 'duplicate');
  evidence.components.Badge.componentSetUrl = evidence.components.Badge.componentSetUrl
    .replace('/design/file?', '/design/other-file?');
  evidence.components.Button.componentSetUrl = evidence.components.Badge.componentSetUrl;
  await writeFile(evidenceFile, JSON.stringify(evidence));

  const manifestFile = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  manifest.components[1].figmaUrl = evidence.components.Badge.componentSetUrl;
  manifest.components[2].figmaUrl = evidence.components.Button.componentSetUrl;
  await writeFile(manifestFile, JSON.stringify(manifest));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.some((value) => value.includes('same Figma file')));
  assert.ok(violations.some((value) => value.includes('twenty distinct manifest Figma node targets')));
  assert.ok(violations.some((value) => value.includes('twenty-five distinct Figma node targets')));
});

test('rejects duplicate token-map collection, variable, and style IDs', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'token-map.json');
  const tokenMap = JSON.parse(await readFile(file, 'utf8'));
  tokenMap.collections[1].id = tokenMap.collections[0].id;
  for (const variable of tokenMap.variables) {
    if (variable.collection === tokenMap.collections[1].name) {
      variable.collectionId = tokenMap.collections[1].id;
    }
  }
  tokenMap.variables[1].variableId = tokenMap.variables[0].variableId;
  tokenMap.styles.text[1].id = tokenMap.styles.text[0].id;
  tokenMap.styles.effect[1].styleId = tokenMap.styles.effect[0].styleId;
  await writeFile(file, JSON.stringify(tokenMap));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.includes('token-map collection IDs must be unique'));
  assert.ok(violations.includes('token-map variable IDs must be unique'));
  assert.ok(violations.includes('token-map text style IDs must be unique'));
  assert.ok(violations.includes('token-map effect style IDs must be unique'));
});

test('rejects duplicate Figma page screenshot target IDs', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.pageScreenshotNodeIds['01 Principles'] = evidence.pageScreenshotNodeIds['00 Cover'];
  await writeFile(file, JSON.stringify(evidence));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma page screenshot target IDs must be unique'));
});

test('rejects unexpected Figma component evidence keys', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.components.Tooltip = {};
  await writeFile(file, JSON.stringify(evidence));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma component keys must be exactly Icon, Badge, Button, TextField, ScrollArea, Checkbox, RadioGroup, Switch, Textarea, Select, TextButton, IconButton, BoardRow, Tab, BottomSheet, Dialog, SearchField, ListRow, Toast, BottomCTA'));
});

test('rejects non-strict or impossible ISO timestamps', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.verifiedAt = '2026-02-30T03:00:00.000Z';
  evidence.foundations.approvedAt = '2026-07-10 02:00:00';
  await writeFile(file, JSON.stringify(evidence));
  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.includes('Figma verifiedAt must be a strict ISO timestamp'));
  assert.ok(violations.includes('Foundations approvedAt must be a strict ISO timestamp'));
});

test('rejects nonnumeric Figma component-set and master node IDs', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const evidenceFile = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(evidenceFile, 'utf8'));
  evidence.components.Badge.componentSetUrl = figmaUrl('badge-set');
  evidence.components.Icon.componentUrls[0].url = figmaUrl('icon-master');
  await writeFile(evidenceFile, JSON.stringify(evidence));

  const manifestFile = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  manifest.components[1].figmaUrl = evidence.components.Badge.componentSetUrl;
  await writeFile(manifestFile, JSON.stringify(manifest));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.includes('Badge Figma target URL is invalid'));
  assert.ok(violations.includes('Icon componentUrls must contain five exact icons'));
});

test('rejects nonnumeric Figma page screenshot node IDs', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.pageScreenshotNodeIds['00 Cover'] = 'page:1';
  await writeFile(file, JSON.stringify(evidence));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('00 Cover screenshot node ID must match <number>:<number>'));
});

test('keeps permanent Linux and Windows verification CI', async () => {
  const rootPackage = JSON.parse(await readFile(
    new URL('../../package.json', import.meta.url),
    'utf8',
  ));
  const workflow = await readFile(
    new URL('../../.github/workflows/verify.yml', import.meta.url),
    'utf8',
  );
  assert.equal(rootPackage.engines.node, '>=22.14.0');
  assert.match(workflow, /push:/);
  assert.match(workflow, /push:\s*\n\s+branches:\s*\[main\]/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /types:\s*\[opened, synchronize, reopened, ready_for_review\]/);
  assert.match(
    workflow,
    /group:\s*verify-\$\{\{ github\.event\.pull_request\.number \|\| github\.ref \}\}/,
  );
  assert.match(
    workflow,
    /cancel-in-progress:\s*\$\{\{ github\.event_name == 'pull_request' \}\}/,
  );
  assert.match(
    workflow,
    /if:\s*\$\{\{ github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.draft == false \}\}/,
  );
  assert.match(workflow, /ubuntu-latest/);
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /runs-on:\s*\$\{\{ matrix\.os \}\}/);
  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /pnpm\/action-setup@v6/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /if:\s*runner\.os != 'Windows'/);
  assert.match(workflow, /node-version-file:\s*\.node-version/);
  assert.match(workflow, /if:\s*runner\.os == 'Windows'/);
  assert.match(workflow, /node-version:\s*22\.23\.1/);
  assert.match(workflow, /nodejs\/node#56645/);
  assert.match(workflow, /cache:\s*pnpm/);
  assert.match(workflow, /corepack pnpm install --frozen-lockfile/);
  assert.match(workflow, /playwright install(?: --with-deps)? chromium/);
  assert.match(workflow, /corepack pnpm verify/);
});

test('keeps a manual Windows workflow for reviewing all forty component-slice baselines', async () => {
  const workflow = await readFile(
    new URL('../../.github/workflows/update-windows-visual-baselines.yml', import.meta.url),
    'utf8',
  );
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /runs-on:\s*windows-latest/);
  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /pnpm\/action-setup@v6/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /node-version:\s*22\.23\.1/);
  assert.match(workflow, /nodejs\/node#56645/);
  assert.match(workflow, /corepack pnpm install --frozen-lockfile/);
  assert.match(workflow, /playwright install chromium/);
  assert.match(workflow, /component-slices\.visual\.spec\.ts/);
  assert.match(workflow, /--project=mobile-chromium/);
  assert.match(workflow, /--project=desktop-chromium/);
  assert.match(workflow, /--update-snapshots/);
  assert.match(workflow, /tests\/e2e\/visual\.spec\.ts/);
  assert.match(workflow, /windows-component-slice-baselines/);
  assert.match(workflow, /component-slices\.visual\.spec/);
  assert.match(workflow, /windows-full-page-baselines/);
  assert.match(workflow, /Expected 15 Windows full-page baselines/);
  assert.match(workflow, /Count/);
  assert.match(workflow, /40/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
});
