import { useState } from 'react';
import {
  Tab,
  type TabItem,
  type TabLayout,
  type TabSize,
} from '@maxxuxx/react';
import './examples.css';

const LONG_COPY = 'TabLongUnbrokenLocalizedCopyForResponsiveVerification'.repeat(6);

const INTERACTIVE_ITEMS = [
  {
    value: 'overview',
    label: '요약',
    content: <p className="tab-demo__panel-content">주문 요약 패널</p>,
  },
  {
    value: 'history',
    label: '내역',
    content: <p className="tab-demo__panel-content">결제 내역 패널</p>,
  },
  {
    value: 'receipts',
    label: '영수증',
    content: <p className="tab-demo__panel-content">영수증 패널</p>,
    disabled: true,
  },
  {
    value: 'settings',
    label: '설정',
    content: <p className="tab-demo__panel-content">주문 설정 패널</p>,
  },
] as const satisfies readonly TabItem[];

const SCROLL_ITEMS = [
  { value: 'all', label: '전체 내역', content: '전체 내역 패널' },
  { value: 'payments', label: '결제 완료', content: '결제 완료 패널' },
  { value: 'shipping', label: '배송 진행', content: '배송 진행 패널' },
  { value: 'returns', label: '반품 접수', content: '반품 접수 패널' },
  { value: 'refunds', label: '환불 완료', content: '환불 완료 패널' },
  { value: 'archived', label: '보관된 주문', content: '보관된 주문 패널' },
] as const satisfies readonly TabItem[];

const LONG_COPY_ITEMS = [
  { value: 'long', label: LONG_COPY, content: LONG_COPY },
  { value: 'short', label: '짧은 탭', content: '짧은 패널' },
] as const satisfies readonly TabItem[];

const SIZES: TabSize[] = ['small', 'large'];
const LAYOUTS: TabLayout[] = ['equal', 'scroll'];

export default function TabExample() {
  const [value, setValue] = useState('overview');
  const [size, setSize] = useState<TabSize>('large');
  const [layout, setLayout] = useState<TabLayout>('equal');

  return (
    <div className="component-demo" data-component-demo="tab">
      <div className="component-demo__controls">
        <label className="component-demo__control">
          크기
          <select
            value={size}
            onChange={(event) => setSize(event.target.value as TabSize)}
          >
            {SIZES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="component-demo__control">
          레이아웃
          <select
            value={layout}
            onChange={(event) => setLayout(event.target.value as TabLayout)}
          >
            {LAYOUTS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="component-demo__stage component-demo__stage--tab">
        <div className="tab-demo">
          <div className="tab-demo__status" aria-live="polite">
            <span className="component-demo__label">선택 값: {value}</span>
          </div>

          <div className="tab-demo__specimens">
            <div className="tab-demo__specimen">
              <span className="component-demo__label">controlled · interactive</span>
              <Tab
                ariaLabel="주문 정보"
                data-tab-sample="interactive"
                items={INTERACTIVE_ITEMS}
                layout={layout}
                size={size}
                value={value}
                onValueChange={setValue}
              />
            </div>

            <div className="tab-demo__specimen">
              <span className="component-demo__label">small · native scroll</span>
              <Tab
                ariaLabel="주문 상태"
                data-tab-sample="scroll"
                items={SCROLL_ITEMS}
                layout="scroll"
                size="small"
              />
            </div>

            <div className="tab-demo__specimen tab-demo__specimen--wide">
              <span className="component-demo__label">long copy · equal</span>
              <Tab
                ariaLabel="긴 라벨 검증"
                data-tab-sample="long-copy"
                items={LONG_COPY_ITEMS}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
