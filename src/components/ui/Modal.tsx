import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalHandle {
  close: () => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  titleId?: string;
  description?: React.ReactNode;
  dismissible?: boolean;
  maxWidth?: string;
  className?: string;
  bodyClassName?: string;
  /** Rendered outside the scrollable body, pinned to the dialog bottom. */
  footer?: React.ReactNode;
  /** Exposes an animated close so children can request dismissal. */
  apiRef?: { current: ModalHandle | null };
  children: React.ReactNode;
}

const EXIT_DURATION = 200;
const SHEET_MEDIA = '(max-width: 767px)';

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  titleId = 'modal-title',
  description,
  dismissible = true,
  maxWidth = '500px',
  className,
  bodyClassName,
  footer,
  apiRef,
  children,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);

  // Drag-to-dismiss (mobile bottom sheet)
  const dragStateRef = useRef<{ pointerId: number; startY: number; startTime: number } | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  /** Plays the exit transition, then hands control back to the parent. */
  const requestClose = useCallback(() => {
    if (!onClose || closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setDragging(false);
    setDragY(0);
    closeTimerRef.current = window.setTimeout(() => {
      onClose();
    }, EXIT_DURATION);
  }, [onClose]);

  // Expose animated close to consumers (e.g. sticky footer actions)
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = { close: requestClose };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, requestClose]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    []
  );

  // Focus restoration and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the first focusable element
    const timeoutId = setTimeout(() => {
      if (dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          dialogRef.current.focus();
        }
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.body.style.overflow = originalOverflow;
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Keep the sheet (and its pinned footer) above the mobile keyboard.
  // visualViewport is the only reliable signal on iOS, where dvh does not shrink.
  useEffect(() => {
    if (!isOpen) return;
    const viewport = window.visualViewport;
    const backdrop = backdropRef.current;
    if (!viewport || !backdrop) return;

    const sync = () => {
      const keyboardOpen = window.innerHeight - viewport.height > 120;
      if (keyboardOpen) {
        backdrop.style.top = `${Math.max(0, viewport.offsetTop)}px`;
        backdrop.style.bottom = 'auto';
        backdrop.style.height = `${Math.round(viewport.height)}px`;
        backdrop.style.setProperty('--modal-vvh', `${Math.round(viewport.height)}px`);
      } else {
        backdrop.style.top = '';
        backdrop.style.bottom = '';
        backdrop.style.height = '';
        backdrop.style.removeProperty('--modal-vvh');
      }
    };

    sync();
    viewport.addEventListener('resize', sync);
    viewport.addEventListener('scroll', sync);
    return () => {
      viewport.removeEventListener('resize', sync);
      viewport.removeEventListener('scroll', sync);
    };
  }, [isOpen]);

  // Keyboard navigation: Escape and Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        requestClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dismissible, requestClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && dismissible) {
      requestClose();
    }
  };

  const canDrag = () =>
    dismissible &&
    typeof window !== 'undefined' &&
    window.matchMedia(SHEET_MEDIA).matches;

  const handleGripPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canDrag()) return;
    dragStateRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startTime: performance.now(),
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleGripPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || e.pointerId !== state.pointerId) return;
    setDragY(Math.max(0, e.clientY - state.startY));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state || e.pointerId !== state.pointerId) return;
    dragStateRef.current = null;
    setDragging(false);

    const distance = Math.max(0, e.clientY - state.startY);
    const velocity = distance / Math.max(1, performance.now() - state.startTime);

    if (distance > 96 || velocity > 0.5) {
      requestClose();
    } else {
      setDragY(0);
    }
  };

  const cancelDrag = () => {
    dragStateRef.current = null;
    setDragging(false);
    setDragY(0);
  };

  return createPortal(
    <div
      ref={backdropRef}
      className={`cs-modal-backdrop${closing ? ' is-closing' : ''}`}
      onClick={handleBackdropClick}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`cs-modal-dialog${footer ? ' cs-modal-dialog--with-footer' : ''}${
          closing ? ' is-closing' : ''
        }${className ? ` ${className}` : ''}`}
        style={{
          maxWidth,
          translate: dragY ? `0 ${dragY}px` : undefined,
          transition: dragging ? 'none' : 'translate 220ms var(--ease-out)',
        }}
      >
        {/* Mobile grabber bar */}
        <div
          className="cs-sheet-grip"
          role="presentation"
          onPointerDown={handleGripPointerDown}
          onPointerMove={handleGripPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={cancelDrag}
        >
          <div className="cs-sheet-handle" aria-hidden="true" />
        </div>

        <div className={`cs-modal-body${bodyClassName ? ` ${bodyClassName}` : ''}`}>
          {/* Header area */}
          <div className="cs-modal-head">
            {title && (
              <div id={titleId} className="cs-modal-title">
                {title}
              </div>
            )}
            {dismissible && onClose && (
              <button
                type="button"
                onClick={requestClose}
                className="cs-btn-icon"
                aria-label="关闭弹窗"
                title="关闭"
                style={{ marginLeft: 'auto', flexShrink: 0 }}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {description && <div className="cs-modal-description">{description}</div>}

          {/* Dialog body */}
          <div>{children}</div>
        </div>

        {footer && <div className="cs-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
