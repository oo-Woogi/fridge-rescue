import { createContext, useCallback, useContext, useState } from "react";
import "./ToastContext.css";

const ToastContext = createContext(null);
const DISPLAY_MS = 2200;

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), DISPLAY_MS);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div className="toast">
          <span>{toast}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast는 ToastProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
