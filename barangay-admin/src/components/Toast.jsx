import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);
let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (type, message, timeout = 4500) => {
      if (!message) return null;
      const id = (counter += 1);
      setToasts((list) => [...list, { id, type, message: String(message) }]);
      if (timeout > 0) window.setTimeout(() => remove(id), timeout);
      return id;
    },
    [remove],
  );

  const api = useMemo(
    () => ({
      push,
      remove,
      success: (message) => push('success', message, 4000),
      error: (message) => push('error', message, 8000),
      info: (message) => push('info', message, 5000),
    }),
    [push, remove],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="status">
            <span className="toast-message">{toast.message}</span>
            <button type="button" className="toast-close" onClick={() => remove(toast.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside a ToastProvider.');
  return ctx;
}

export default ToastProvider;
