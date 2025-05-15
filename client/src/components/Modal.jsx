import React from 'react';

export default function Modal({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop/overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-surface-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-surface-700 z-10">
        {title && <h3 className="text-xl font-medium text-white mb-3">{title}</h3>}
        <div className="text-gray-300 mb-6">{message}</div>
        
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-white rounded-md transition-colors"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          )}
          <button
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Alert-style modal (only shows a message with an "OK" button)
export function AlertModal({ isOpen, title, message, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      message={message}
      confirmLabel="OK"
      onConfirm={onClose}
      onCancel={null}
    />
  );
} 