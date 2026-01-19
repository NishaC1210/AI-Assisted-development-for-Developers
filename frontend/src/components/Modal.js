import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
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

// AI Summary Modal Component
export const AISummaryModal = ({ 
  isOpen, 
  onClose, 
  noteTitle,
  summary,
  isLoading = false,
  error = null
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="ai-summary-title">
          <svg className="ai-sparkle-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
          AI Summary
        </span>
      }
      size="medium"
      actions={
        <button 
          className="modal-btn modal-btn-primary" 
          onClick={onClose}
          aria-label="Close summary"
        >
          Close
        </button>
      }
    >
      <div className="ai-summary-content">
        {isLoading && (
          <div className="ai-summary-loading" role="status" aria-label="Generating summary">
            <div className="ai-loading-spinner">
              <svg className="ai-sparkle-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2L13.09 8.26L18 6L15.74 10.91L22 12L15.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L8.26 13.09L2 12L8.26 10.91L6 6L10.91 8.26L12 2Z" fill="currentColor"/>
              </svg>
            </div>
            <p className="ai-loading-text">Generating summary...</p>
          </div>
        )}
        {error && (
          <div className="ai-summary-error" role="alert">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6V10.5M10 13.5V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p>{error}</p>
          </div>
        )}
        {!isLoading && !error && summary && (
          <>
            <div className="ai-summary-note-title">
              <span className="label">Note:</span>
              <span className="title">{noteTitle}</span>
            </div>
            <div className="ai-summary-text markdown-content">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default Modal;

