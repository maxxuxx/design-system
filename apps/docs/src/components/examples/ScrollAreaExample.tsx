import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@maxxuxx/react';
import './examples.css';

const ORDERS = [
  ['주문 #1842', '결제 확인 · 포장 준비 중'],
  ['주문 #1841', '라이더 배정 · 12분 후 도착'],
  ['주문 #1840', '배달 완료 · 문 앞 전달'],
  ['주문 #1839', '결제 확인 · 조리 시작'],
  ['주문 #1838', '라이더 픽업 · 이동 중'],
  ['주문 #1837', '배달 완료 · 고객 수령'],
  ['주문 #1836', '주문 접수 · 매장 확인 중'],
  ['주문 #1835', '배달 완료 · 문 앞 전달'],
] as const;

const PART_TEST_IDS = {
  viewport: 'scroll-area-viewport',
  content: 'scroll-area-content',
  edgeUp: 'scroll-area-edge-up',
  edgeDown: 'scroll-area-edge-down',
  buttonUp: 'scroll-area-button-up',
  buttonDown: 'scroll-area-button-down',
} as const;

export default function ScrollAreaExample() {
  const [shortContent, setShortContent] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const visibleOrders = shortContent ? ORDERS.slice(0, 2) : ORDERS;

  useEffect(() => {
    const viewport = viewportRef.current;
    const root = viewport?.parentElement;
    if (!viewport || !root) return;

    const parts: Array<[Element | null, string]> = [
      [viewport, PART_TEST_IDS.viewport],
      [viewport.querySelector('.ds-scroll-area__content'), PART_TEST_IDS.content],
      [root.querySelector('.ds-scroll-area__edge--top'), PART_TEST_IDS.edgeUp],
      [root.querySelector('.ds-scroll-area__edge--bottom'), PART_TEST_IDS.edgeDown],
      [root.querySelector('.ds-scroll-area__button--up'), PART_TEST_IDS.buttonUp],
      [root.querySelector('.ds-scroll-area__button--down'), PART_TEST_IDS.buttonDown],
    ];

    for (const [element, testId] of parts) {
      element?.setAttribute('data-testid', testId);
    }

    return () => {
      for (const [element, testId] of parts) {
        if (element?.getAttribute('data-testid') === testId) {
          element.removeAttribute('data-testid');
        }
      }
    };
  }, []);

  return (
    <div
      className="component-demo"
      data-component-demo="scroll-area"
      data-content-mode={shortContent ? 'short' : 'long'}
    >
      <div className="component-demo__controls">
        <label className="component-demo__toggle">
          <input
            checked={shortContent}
            data-testid="scroll-area-content-toggle"
            type="checkbox"
            onChange={(event) => setShortContent(event.target.checked)}
          />
          짧은 콘텐츠
        </label>
      </div>

      <div className="component-demo__stage component-demo__stage--scroll-area">
        <ScrollArea
          className="scroll-area-demo"
          data-testid="scroll-area-root"
          label="최근 주문 목록"
          scrollDownLabel="다음 주문 보기"
          scrollUpLabel="이전 주문 보기"
          viewportRef={viewportRef}
        >
          <div className="scroll-area-demo__list">
            {visibleOrders.map(([title, detail]) => (
              <article className="scroll-area-demo__card" key={title}>
                <strong>{title}</strong>
                <span>{detail}</span>
              </article>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
