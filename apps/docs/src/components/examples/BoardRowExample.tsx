import { useState } from 'react';
import { BoardRow } from '@hds/react';
import './examples.css';

const LONG_COPY = 'BoardRowLongUnbrokenCopyForResponsiveVerification'.repeat(6);

export default function BoardRowExample() {
  const [controlledOpen, setControlledOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const [showPrefix, setShowPrefix] = useState(true);
  const [uncontrolledChanges, setUncontrolledChanges] = useState(0);
  const [controlledChanges, setControlledChanges] = useState(0);

  return (
    <div className="component-demo" data-component-demo="board-row">
      <div className="component-demo__controls">
        <label className="component-demo__toggle">
          <input
            checked={controlledOpen}
            type="checkbox"
            onChange={(event) => setControlledOpen(event.target.checked)}
          />
          제어된 행 열기
        </label>
        <label className="component-demo__toggle">
          <input
            checked={showDescription}
            type="checkbox"
            onChange={(event) => setShowDescription(event.target.checked)}
          />
          설명 표시
        </label>
        <label className="component-demo__toggle">
          <input
            checked={showPrefix}
            type="checkbox"
            onChange={(event) => setShowPrefix(event.target.checked)}
          />
          prefix 표시
        </label>
      </div>

      <div className="component-demo__stage component-demo__stage--board-row">
        <div className="board-row-demo">
          <div aria-live="polite" className="board-row-demo__status">
            <span className="component-demo__label">
              비제어 상태 변경: {uncontrolledChanges}
            </span>
            <span className="component-demo__label">
              제어 상태 변경: {controlledChanges}
            </span>
          </div>

          <div className="board-row-demo__specimens">
            <div className="board-row-demo__specimen">
              <span className="component-demo__label">uncontrolled</span>
              <BoardRow
                data-board-row-sample="uncontrolled"
                description={showDescription
                  ? '배송지와 도착 예정 시간을 확인합니다.'
                  : undefined}
                prefix={showPrefix ? <span>01</span> : undefined}
                title="배송 정보"
                onOpenChange={() =>
                  setUncontrolledChanges((count) => count + 1)}
              >
                <p className="board-row-demo__content">
                  서울시 중구 · 내일 오후 2시 도착 예정
                </p>
              </BoardRow>
            </div>

            <div className="board-row-demo__specimen">
              <span className="component-demo__label">controlled</span>
              <BoardRow
                data-board-row-sample="controlled"
                description={showDescription
                  ? 'native toggle 결과를 owner state에 반영합니다.'
                  : undefined}
                open={controlledOpen}
                prefix={showPrefix ? <span>02</span> : undefined}
                title="결제 정보"
                onOpenChange={(nextOpen) => {
                  setControlledOpen(nextOpen);
                  setControlledChanges((count) => count + 1);
                }}
              >
                <p className="board-row-demo__content">
                  신용카드 일시불 · 결제 금액 48,000원
                </p>
              </BoardRow>
            </div>

            <div className="board-row-demo__specimen board-row-demo__specimen--wide">
              <span className="component-demo__label">long copy · open</span>
              <BoardRow
                data-board-row-sample="long-copy"
                defaultOpen
                description={LONG_COPY}
                prefix={<span>03</span>}
                title={LONG_COPY}
              >
                <p className="board-row-demo__content">{LONG_COPY}</p>
              </BoardRow>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
