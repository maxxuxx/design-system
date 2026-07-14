import { useState } from 'react';
import {
  AlertDialog,
  type AlertDialogCloseReason,
  Button,
  ConfirmDialog,
  type ConfirmDialogCloseReason,
  TextButton,
} from '@maxxuxx/react';
import './examples.css';

const LONG_DESCRIPTION = Array.from(
  { length: 40 },
  (_, index) => (
    `설명 ${index + 1} · DialogLongUnbrokenCopyForInternalScrollVerification`
  ),
).join(' ');

export default function DialogExample() {
  const [alertOpen, setAlertOpen] = useState(false);
  const [confirmDisabled, setConfirmDisabled] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dismissible, setDismissible] = useState(true);
  const [longDescription, setLongDescription] = useState(false);
  const [lastAlertReason, setLastAlertReason] = useState<
    AlertDialogCloseReason | null
  >(null);
  const [lastConfirmReason, setLastConfirmReason] = useState<
    ConfirmDialogCloseReason | null
  >(null);

  return (
    <div className="component-demo" data-component-demo="dialog">
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
            checked={longDescription}
            type="checkbox"
            onChange={(event) => setLongDescription(event.target.checked)}
          />
          긴 설명
        </label>
        <label className="component-demo__toggle">
          <input
            checked={confirmDisabled}
            type="checkbox"
            onChange={(event) => setConfirmDisabled(event.target.checked)}
          />
          확인 비활성화
        </label>
        <label className="component-demo__toggle">
          <input
            checked={confirmLoading}
            type="checkbox"
            onChange={(event) => setConfirmLoading(event.target.checked)}
          />
          확인 로딩
        </label>
      </div>

      <div className="component-demo__stage component-demo__stage--dialog">
        <div className="dialog-demo__interactive">
          <div className="dialog-demo__launcher">
            <span aria-live="polite" className="component-demo__label">
              알림 종료 사유: {lastAlertReason ?? '없음'}
            </span>
            <Button variant="outline" onClick={() => setAlertOpen(true)}>
              알림 열기
            </Button>
          </div>
          <div className="dialog-demo__launcher">
            <span aria-live="polite" className="component-demo__label">
              확인 종료 사유: {lastConfirmReason ?? '없음'}
            </span>
            <Button onClick={() => setConfirmOpen(true)}>
              확인 대화상자 열기
            </Button>
          </div>
        </div>

        <div
          aria-label="Dialog 결정적 시각 specimen"
          className="dialog-demo__specimens"
        >
          <article className="dialog-demo__specimen">
            <span className="component-demo__label">Alert · 설명 표시</span>
            <div
              className="ds-dialog__surface dialog-demo__surface"
              data-dialog-specimen="alert"
            >
              <div className="ds-dialog__body">
                <h3 className="ds-dialog__title">저장되었습니다.</h3>
                <p className="ds-dialog__description">
                  변경 사항을 안전하게 저장했습니다.
                </p>
              </div>
              <div className="ds-dialog__actions">
                <Button size="large" width="full">확인</Button>
              </div>
            </div>
          </article>
          <article className="dialog-demo__specimen">
            <span className="component-demo__label">Confirm · 설명 숨김</span>
            <div
              className="ds-dialog__surface dialog-demo__surface"
              data-dialog-specimen="confirm"
            >
              <div className="ds-dialog__body">
                <h3 className="ds-dialog__title">삭제할까요?</h3>
              </div>
              <div className="ds-dialog__actions">
                <TextButton size="large" tone="neutral">취소</TextButton>
                <Button size="large" width="full">삭제</Button>
              </div>
            </div>
          </article>
        </div>
      </div>

      <AlertDialog
        alertLabel="확인"
        description="변경 사항을 안전하게 저장했습니다."
        dismissible={dismissible}
        open={alertOpen}
        title="저장되었습니다."
        onOpenChange={(nextOpen, reason) => {
          setLastAlertReason(reason);
          setAlertOpen(nextOpen);
        }}
      />
      <ConfirmDialog
        cancelLabel="취소"
        confirmDisabled={confirmDisabled}
        confirmLabel="삭제"
        confirmLoading={confirmLoading}
        description={longDescription
          ? LONG_DESCRIPTION
          : '삭제하면 되돌릴 수 없습니다.'}
        dismissible={dismissible}
        open={confirmOpen}
        title="삭제할까요?"
        onOpenChange={(nextOpen, reason) => {
          setLastConfirmReason(reason);
          setConfirmOpen(nextOpen);
        }}
      />
    </div>
  );
}
