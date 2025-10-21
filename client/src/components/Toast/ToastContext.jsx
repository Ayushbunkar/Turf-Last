import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import './styles.css';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, opts = {}) => {
    const id = ++idCounter;
    const toast = { id, message: msg, type: opts.type || 'info', duration: opts.duration || 4000 };
    setToasts((t) => [...t, toast]);
    if (toast.duration > 0) {
      setTimeout(() => {
        setToasts((t) => t.filter(x => x.id !== id));
      }, toast.duration);
    }
    return id;
  }, []);

  const remove = useCallback((id) => setToasts((t) => t.filter(x => x.id !== id)), []);

  const api = useMemo(() => ({ push, remove }), [push, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status">
            {t.message}
            <button className="toast-close" onClick={() => remove(t.id)} aria-label="Dismiss">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default ToastProvider;
