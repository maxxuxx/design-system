export interface NavigationItem {
  label: string;
  href: string;
}

export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

export const NAVIGATION: NavigationSection[] = [
  {
    label: '시작하기',
    items: [
      { label: '소개', href: '/' },
      { label: '원칙', href: '/principles/' },
      { label: 'Getting Started', href: '/getting-started/' },
    ],
  },
  {
    label: 'Foundations',
    items: [
      { label: '색상', href: '/foundations/colors/' },
      { label: '타이포그래피', href: '/foundations/typography/' },
      { label: '간격', href: '/foundations/spacing/' },
      { label: '모서리 반경', href: '/foundations/radius/' },
      { label: '고도', href: '/foundations/elevation/' },
    ],
  },
  {
    label: 'Components',
    items: [
      { label: 'Icon', href: '/components/icon/' },
      { label: 'Badge', href: '/components/badge/' },
      { label: 'Button', href: '/components/button/' },
      { label: 'TextField', href: '/components/text-field/' },
      { label: 'ScrollArea', href: '/components/scroll-area/' },
      { label: 'Checkbox', href: '/components/checkbox/' },
      { label: 'RadioGroup', href: '/components/radio-group/' },
      { label: 'Switch', href: '/components/switch/' },
    ],
  },
];
