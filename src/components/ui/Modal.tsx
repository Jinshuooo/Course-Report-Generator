import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  titleId?: string;
  description?: React.ReactNode;
  dismissible?: boolean;
  maxWidth?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  titleId = 'modal-title',
  description,
  dismissible = true,
  maxWidth = '500px',
  children,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus restoration and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the dialog or first focusable element
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

  // Keyboard navigation: Escape and Focus Trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible && onClose) {
        e.stopPropagation();
        onClose();
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
  }, [isOpen, dismissible, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && dismissible && onClose) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="cs-modal-backdrop"
      onClick={handleBackdropClick}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className="cs-modal-dialog"
        style={{ maxWidth }}
      >
        {/* Mobile grabber bar */}
        <div className="cs-sheet-handle" aria-hidden="true" />

        <div style={{ padding: '24px' }}>
          {/* Header area */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: description ? '8px' : '20px' }}>
            {title && (
              <div id={titleId} style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {title}
              </div>
            )}
            {dismissible && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="cs-btn-icon"
                aria-label="关闭弹窗"
                title="关闭"
                style={{ marginLeft: 'auto', flexShrink: 0 }}
              >
                <X size={20} />
              </button>
            )}
          </div>

          {description && (
            <div style={{ fontSize: '13px', color: 'var(--color-ink-2)', marginBottom: '20px', lineHeight: 1.5 }}>
              {description}
            </div>
          )}

          {/* Dialog body */}
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
