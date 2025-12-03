import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, options = {}) => {
    const {
      type = "success",
      position = "top-right",
      duration = 3000,
    } = options;

    const id = Date.now() + Math.random();
    const toast = { id, message, type, position };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onClose }) {
  const groupedToasts = toasts.reduce((acc, toast) => {
    if (!acc[toast.position]) {
      acc[toast.position] = [];
    }
    acc[toast.position].push(toast);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groupedToasts).map(([position, toastList]) => (
        <div key={position} style={getContainerStyle(position)}>
          {toastList.map((toast) => (
            <Toast key={toast.id} toast={toast} onClose={onClose} />
          ))}
        </div>
      ))}
    </>
  );
}

function Toast({ toast, onClose }) {
  const styles = getToastStyles(toast.type);

  return (
    <div style={styles.container}>
      <div style={styles.iconWrapper}>{getIcon(toast.type)}</div>
      <p style={styles.message}>{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        style={styles.closeButton}
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  );
}

function getContainerStyle(position) {
  const baseStyle = {
    position: "fixed",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "20px",
    pointerEvents: "none",
  };

  const positions = {
    "top-left": { top: 0, left: 0 },
    "top-center": { top: 0, left: "50%", transform: "translateX(-50%)" },
    "top-right": { top: 0, right: 0 },
    "bottom-left": { bottom: 0, left: 0 },
    "bottom-center": { bottom: 0, left: "50%", transform: "translateX(-50%)" },
    "bottom-right": { bottom: 0, right: 0 },
  };

  return { ...baseStyle, ...positions[position] };
}

function getToastStyles(type) {
  const colors = {
    success: { bg: "#10b981", icon: "#dcfce7", text: "#fff" },
    danger: { bg: "#ef4444", icon: "#fee2e2", text: "#fff" },
    warning: { bg: "#f59e0b", icon: "#fef3c7", text: "#fff" },
    info: { bg: "#3b82f6", icon: "#dbeafe", text: "#fff" },
    pending: { bg: "#6b7280", icon: "#f3f4f6", text: "#fff" },
  };

  const color = colors[type] || colors.info;

  return {
    container: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      background: color.bg,
      color: color.text,
      padding: "14px 16px",
      borderRadius: "8px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      minWidth: "320px",
      maxWidth: "420px",
      pointerEvents: "auto",
      animation: "slideIn 0.3s ease-out, fadeIn 0.3s ease-out",
    },
    iconWrapper: {
      width: "24px",
      height: "24px",
      borderRadius: "50%",
      background: color.icon,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      fontSize: "14px",
    },
    message: {
      flex: 1,
      margin: 0,
      fontSize: "14px",
      fontWeight: "500",
      lineHeight: "1.5",
    },
    closeButton: {
      background: "transparent",
      border: "none",
      color: color.text,
      fontSize: "24px",
      cursor: "pointer",
      padding: "0",
      width: "24px",
      height: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.7,
      transition: "opacity 0.2s",
      flexShrink: 0,
    },
  };
}

function getIcon(type) {
  const icons = {
    success: "✓",
    danger: "✕",
    warning: "⚠",
    info: "ℹ",
    pending: "⋯",
  };
  return icons[type] || icons.info;
}

export function ToastStyles() {
  return (
    <style>{`
      @keyframes slideIn {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      button:hover {
        opacity: 1 !important;
      }
    `}</style>
  );
}
