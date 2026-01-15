import React, { useEffect, useRef } from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  actions,
  size = 'medium',
  showCloseButton = true 
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="modal-backdrop animate-fade-in" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className={`modal-content modal-${size} animate-slide-up`}
        ref={modalRef}
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && <h2 id="modal-title" className="modal-title">{title}</h2>}
            {showCloseButton && (
              <button 
                className="modal-close-btn" 
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {actions && (
          <div className="modal-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// Confirm Modal Component
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm', 
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default' // 'default' | 'danger'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      actions={
        <>
          <button 
            className="modal-btn modal-btn-secondary" 
            onClick={onClose}
            aria-label={cancelText}
          >
            {cancelText}
          </button>
          <button 
            className={`modal-btn modal-btn-${variant === 'danger' ? 'danger' : 'primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            aria-label={confirmText}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <p className="confirm-message">{message}</p>
    </Modal>
  );
};

// Alert Modal Component
export const AlertModal = ({ 
  isOpen, 
  onClose, 
  title = 'Alert', 
  message,
  buttonText = 'OK',
  variant = 'default' // 'default' | 'success' | 'warning' | 'error'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      actions={
        <button 
          className="modal-btn modal-btn-primary" 
          onClick={onClose}
          aria-label={buttonText}
        >
          {buttonText}
        </button>
      }
    >
      <div className={`alert-content alert-${variant}`}>
        <p className="alert-message">{message}</p>
      </div>
    </Modal>
  );
};

export default Modal;

