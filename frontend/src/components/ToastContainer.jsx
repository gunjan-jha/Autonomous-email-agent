import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toasts-wrap" aria-live="polite">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        return (
          <div key={t.id} className={`flat-toast ${t.type || 'info'}`}>
            {isSuccess && <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />}
            {isError && <AlertCircle size={13} style={{ color: 'var(--danger)' }} />}
            {!isSuccess && !isError && <Info size={13} style={{ color: 'var(--accent)' }} />}

            <span style={{ flex: 1 }}>{t.msg}</span>

            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0 2px'
              }}
              title="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
