import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  subMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  subMessage,
  confirmLabel = 'Yes, Proceed',
  cancelLabel = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="confirmation-dialog-content"
        className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-amber-200 space-y-5 transform transition-all"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isDangerous
                ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isDangerous ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-stone-900 tracking-tight leading-snug">
              {title}
            </h3>
            <p className="text-base font-semibold text-stone-700 mt-1.5 leading-relaxed">
              {message}
            </p>
            {subMessage && (
              <p className="text-sm font-medium text-stone-500 mt-1">
                {subMessage}
              </p>
            )}
          </div>
        </div>

        {/* Big accessible buttons for seniors */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            id="dialog-confirm-button"
            type="button"
            onClick={onConfirm}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 focus:ring-4 ${
              isDangerous
                ? 'bg-rose-700 hover:bg-rose-800 text-white focus:ring-rose-300'
                : 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-300'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{confirmLabel}</span>
          </button>

          <button
            id="dialog-cancel-button"
            type="button"
            onClick={onCancel}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-base text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-all active:scale-98 flex items-center justify-center gap-2 focus:ring-4 focus:ring-stone-300"
          >
            <XCircle className="w-5 h-5 text-stone-500" />
            <span>{cancelLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
