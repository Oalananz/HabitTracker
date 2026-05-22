'use client';

import { useToast } from '@/store/useToast';

const iconMap = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

const colorMap = {
  success: 'text-primary border-primary/30 bg-primary/5',
  error: 'text-error border-error/30 bg-error/5',
  info: 'text-secondary border-secondary/30 bg-secondary/5',
  warning: 'text-tertiary border-tertiary/30 bg-tertiary/5',
};

const progressColorMap = {
  success: 'bg-primary',
  error: 'bg-error',
  info: 'bg-secondary',
  warning: 'bg-tertiary',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto glass rounded-md border p-3 flex items-start gap-3 shadow-2xl shadow-black/30 relative ${colorMap[toast.type]} ${
            toast.exiting ? 'animate-toast-out' : 'animate-toast-in'
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {iconMap[toast.type]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body text-on-surface leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-on-surface-variant/50 hover:text-on-surface transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-md">
            <div
              className={`h-full ${progressColorMap[toast.type]} rounded-b-md`}
              style={{
                animation: `shrinkWidth ${toast.duration}ms linear forwards`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
