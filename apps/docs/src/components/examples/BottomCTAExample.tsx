import { useState } from 'react';
import { BottomCTA, Button } from '@maxxuxx/react';
import './examples.css';

const LONG_PRIMARY = '결제를 완료하고 다음 단계로 계속 진행합니다';
const LONG_SECONDARY = '이전 단계로 돌아갑니다';
const FIXED_CONTENT = Array.from(
  { length: 8 },
  (_, index) => `결제 확인 항목 ${index + 1}`,
);

export default function BottomCTAExample() {
  const [action, setAction] = useState('없음');

  return (
    <div className="component-demo" data-component-demo="bottom-cta">
      <div className="component-demo__stage component-demo__stage--bottom-cta">
        <div className="bottom-cta-demo">
          <p aria-live="polite" className="bottom-cta-demo__status">
            마지막 실행: {action}
          </p>

          <article
            className="bottom-cta-demo__specimen"
            data-bottom-cta-sample="single"
          >
            <span className="component-demo__label">Single · default</span>
            <BottomCTA
              primaryAction={(
                <Button onClick={() => setAction('Single primary')}>
                  계속
                </Button>
              )}
            />
          </article>

          <article
            className="bottom-cta-demo__specimen"
            data-bottom-cta-sample="double"
          >
            <span className="component-demo__label">Double · secondary → primary</span>
            <BottomCTA
              primaryAction={(
                <Button onClick={() => setAction('Double primary')}>
                  확인
                </Button>
              )}
              secondaryAction={(
                <Button
                  variant="weak"
                  onClick={() => setAction('Double secondary')}
                >
                  취소
                </Button>
              )}
            />
          </article>

          <article
            className="bottom-cta-demo__specimen bottom-cta-demo__specimen--long"
            data-bottom-cta-sample="long-copy"
          >
            <span className="component-demo__label">Double · background none · long copy</span>
            <BottomCTA
              background="none"
              primaryAction={<Button>{LONG_PRIMARY}</Button>}
              secondaryAction={<Button variant="outline">{LONG_SECONDARY}</Button>}
            />
          </article>

          <article
            className="bottom-cta-demo__fixed-viewport"
            data-bottom-cta-fixed-viewport
          >
            <div
              aria-label="고정 BottomCTA 콘텐츠"
              className="bottom-cta-demo__fixed-scroll"
              data-bottom-cta-fixed-scroll
              tabIndex={0}
            >
              {FIXED_CONTENT.map((item) => (
                <div className="bottom-cta-demo__fixed-item" key={item}>
                  {item}
                </div>
              ))}
              <div
                aria-hidden="true"
                className="bottom-cta-demo__fixed-clearance"
              />
            </div>
            <BottomCTA
              className="bottom-cta-demo__fixed-cta"
              fixed
              primaryAction={(
                <Button onClick={() => setAction('Fixed primary')}>
                  결제하기
                </Button>
              )}
              secondaryAction={(
                <Button
                  variant="weak"
                  onClick={() => setAction('Fixed secondary')}
                >
                  이전
                </Button>
              )}
            />
          </article>
        </div>
      </div>
    </div>
  );
}
