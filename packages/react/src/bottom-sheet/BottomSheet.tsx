import {
  type ReactNode,
  type RefObject,
  useId,
  useRef,
} from 'react';
import { IconButton } from '../icon-button';
import { ModalDialog } from '../internal/ModalDialog';

export type BottomSheetCloseReason =
  | 'backdrop'
  | 'close-button'
  | 'escape';

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (
    open: boolean,
    reason: BottomSheetCloseReason,
  ) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel: string;
  dismissible?: boolean;
  portalContainer?: HTMLElement | null;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function BottomSheet({
  children,
  closeLabel,
  description,
  dismissible = true,
  footer,
  initialFocusRef,
  onOpenChange,
  open,
  portalContainer,
  title,
}: BottomSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  return (
    <ModalDialog
      ariaDescribedBy={description === undefined ? undefined : descriptionId}
      ariaLabelledBy={titleId}
      className="ds-bottom-sheet"
      dismissible={dismissible}
      fallbackFocusRef={closeButtonRef}
      initialFocusRef={initialFocusRef}
      onBackdrop={() => onOpenChange(false, 'backdrop')}
      onEscape={() => onOpenChange(false, 'escape')}
      open={open}
      portalContainer={portalContainer}
      role="dialog"
    >
      <section className="ds-bottom-sheet__surface">
        <header className="ds-bottom-sheet__header">
          <div className="ds-bottom-sheet__heading-copy">
            <h2 className="ds-bottom-sheet__title" id={titleId}>{title}</h2>
            {description === undefined ? null : (
              <p className="ds-bottom-sheet__description" id={descriptionId}>
                {description}
              </p>
            )}
          </div>
          <IconButton
            ref={closeButtonRef}
            className="ds-bottom-sheet__close"
            label={closeLabel}
            name="close"
            size="small"
            variant="clear"
            onClick={() => onOpenChange(false, 'close-button')}
          />
        </header>
        <div className="ds-bottom-sheet__body">{children}</div>
        {footer === undefined ? null : (
          <footer className="ds-bottom-sheet__footer">{footer}</footer>
        )}
      </section>
    </ModalDialog>
  );
}
