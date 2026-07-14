import { useRef, useState } from 'react';
import {
  BottomSheet,
  Button,
  type BottomSheetCloseReason,
} from '@maxxuxx/react';
import './examples.css';

const LONG_PARAGRAPHS = Array.from({ length: 48 }, (_, index) => (
  `배송지 ${index + 1} · BottomSheetLongUnbrokenCopyForInternalScrollVerification`
));

export default function BottomSheetExample() {
  const [dismissible, setDismissible] = useState(true);
  const [longContent, setLongContent] = useState(false);
  const [open, setOpen] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [lastReason, setLastReason] = useState<BottomSheetCloseReason | null>(
    null,
  );
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="component-demo" data-component-demo="bottom-sheet">
      <div className="component-demo__controls">
        <label className="component-demo__toggle">
          <input
            checked={dismissible}
            type="checkbox"
            onChange={(event) => setDismissible(event.target.checked)}
          />
          Escape·배경으로 닫기
        </label>
        <label className="component-demo__toggle">
          <input
            checked={showFooter}
            type="checkbox"
            onChange={(event) => setShowFooter(event.target.checked)}
          />
          footer 표시
        </label>
        <label className="component-demo__toggle">
          <input
            checked={longContent}
            type="checkbox"
            onChange={(event) => setLongContent(event.target.checked)}
          />
          긴 본문
        </label>
      </div>

      <div className="component-demo__stage component-demo__stage--bottom-sheet">
        <div className="bottom-sheet-demo__launcher">
          <span aria-live="polite" className="component-demo__label">
            마지막 종료 사유: {lastReason ?? '없음'}
          </span>
          <Button onClick={() => setOpen(true)}>바텀시트 열기</Button>
          <p className="bottom-sheet-demo__guidance">
            닫은 뒤 focus가 이 열기 버튼으로 복원되는지 확인하세요.
          </p>
        </div>
      </div>

      <BottomSheet
        closeLabel="바텀시트 닫기"
        description="저장된 주소 중 하나를 고른 뒤 완료하세요."
        dismissible={dismissible}
        footer={showFooter ? (
          <Button width="full" onClick={() => setOpen(false)}>
            선택 완료
          </Button>
        ) : undefined}
        initialFocusRef={initialFocusRef}
        open={open}
        title="배송지 선택"
        onOpenChange={(nextOpen, reason) => {
          setLastReason(reason);
          setOpen(nextOpen);
        }}
      >
        <div className="bottom-sheet-demo__body">
          <Button ref={initialFocusRef} variant="outline">
            배송지 선택하기
          </Button>
          {longContent ? LONG_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          )) : (
            <p>서울시 중구 세종대로 · 내일 오후 2시 도착 예정</p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
