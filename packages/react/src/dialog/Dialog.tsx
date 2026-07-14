import {
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
  useId,
  useRef,
} from 'react';
import { Button } from '../button';
import { ModalDialog } from '../internal/ModalDialog';
import { getSafeLayoutStyle } from '../internal/safe-layout-style';
import { TextButton } from '../text-button';

export type AlertDialogCloseReason =
  | 'alert-button'
  | 'backdrop'
  | 'escape';

export type ConfirmDialogCloseReason =
  | 'cancel-button'
  | 'confirm-button'
  | 'backdrop'
  | 'escape';

type DialogRootProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'title'
>;

interface DialogCommonProps extends DialogRootProps {
  open: boolean;
  title: string;
  description?: string;
  dismissible?: boolean;
  portalContainer?: HTMLElement | null;
}

export interface AlertDialogProps extends DialogCommonProps {
  alertLabel: string;
  onOpenChange: (
    open: boolean,
    reason: AlertDialogCloseReason,
  ) => void;
}

export interface ConfirmDialogProps extends DialogCommonProps {
  cancelLabel: string;
  confirmLabel: string;
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  onOpenChange: (
    open: boolean,
    reason: ConfirmDialogCloseReason,
  ) => void;
}

interface DialogFrameProps extends DialogCommonProps {
  actions: ReactNode;
  fallbackFocusRef: RefObject<HTMLElement | null>;
  onBackdrop: () => void;
  onEscape: () => void;
  role: 'alertdialog' | 'dialog';
}

function DialogFrame({
  actions,
  className,
  description,
  dangerouslySetInnerHTML: _dangerouslySetInnerHTML,
  dismissible = true,
  fallbackFocusRef,
  onBackdrop,
  onEscape,
  open,
  portalContainer,
  role,
  style,
  title,
  ...rootProps
}: DialogFrameProps) {
  const titleId = useId();
  const descriptionId = useId();
  const classes = ['ds-dialog__surface', className].filter(Boolean).join(' ');

  return (
    <ModalDialog
      ariaDescribedBy={description === undefined ? undefined : descriptionId}
      ariaLabelledBy={titleId}
      className="ds-dialog"
      dismissible={dismissible}
      fallbackFocusRef={fallbackFocusRef}
      initialFocusRef={fallbackFocusRef}
      onBackdrop={onBackdrop}
      onEscape={onEscape}
      open={open}
      portalContainer={portalContainer}
      role={role}
    >
      <div
        {...rootProps}
        className={classes}
        dangerouslySetInnerHTML={undefined}
        style={getSafeLayoutStyle(style)}
      >
        <div className="ds-dialog__body">
          <h2 className="ds-dialog__title" id={titleId}>{title}</h2>
          {description === undefined ? null : (
            <p className="ds-dialog__description" id={descriptionId}>
              {description}
            </p>
          )}
        </div>
        <div className="ds-dialog__actions">{actions}</div>
      </div>
    </ModalDialog>
  );
}

export function AlertDialog({
  alertLabel,
  onOpenChange,
  ...dialogProps
}: AlertDialogProps) {
  const alertButtonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <DialogFrame
      {...dialogProps}
      actions={(
        <Button
          ref={alertButtonRef}
          className="ds-dialog__action ds-dialog__action--primary"
          size="large"
          width="full"
          onClick={() => onOpenChange(false, 'alert-button')}
        >
          {alertLabel}
        </Button>
      )}
      fallbackFocusRef={alertButtonRef}
      onBackdrop={() => onOpenChange(false, 'backdrop')}
      onEscape={() => onOpenChange(false, 'escape')}
      role="alertdialog"
    />
  );
}

export function ConfirmDialog({
  cancelLabel,
  confirmDisabled = false,
  confirmLabel,
  confirmLoading = false,
  onOpenChange,
  ...dialogProps
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <DialogFrame
      {...dialogProps}
      actions={(
        <>
          <TextButton
            ref={cancelButtonRef}
            className="ds-dialog__action ds-dialog__action--cancel"
            size="large"
            tone="neutral"
            onClick={() => onOpenChange(false, 'cancel-button')}
          >
            {cancelLabel}
          </TextButton>
          <Button
            className="ds-dialog__action ds-dialog__action--primary"
            disabled={confirmDisabled}
            loading={confirmLoading}
            size="large"
            width="full"
            onClick={() => onOpenChange(false, 'confirm-button')}
          >
            {confirmLabel}
          </Button>
        </>
      )}
      fallbackFocusRef={cancelButtonRef}
      onBackdrop={() => onOpenChange(false, 'backdrop')}
      onEscape={() => onOpenChange(false, 'escape')}
      role="dialog"
    />
  );
}
