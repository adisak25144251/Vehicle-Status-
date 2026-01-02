
import React, { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-24 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bgClass = 
    toast.type === 'success' ? 'bg-green-500/90 border-green-400' :
    toast.type === 'error' ? 'bg-red-500/90 border-red-400' :
    'bg-blue-500/90 border-blue-400';

  const iconClass =
    toast.type === 'success' ? 'fa-check-circle' :
    toast.type === 'error' ? 'fa-exclamation-circle' :
    'fa-info-circle';

  return (
    <div className={`
      pointer-events-auto
      flex items-center gap-3 px-4 py-3 min-w-[300px] max-w-sm rounded-xl shadow-2xl backdrop-blur-md text-white border border-opacity-30
      animate-slide-up hover:scale-105 transition-all cursor-pointer ${bgClass}
    `} onClick={() => onRemove(toast.id)}>
      <i className={`fas ${iconClass} text-xl`}></i>
      <div className="flex-1">
        <p className="text-sm font-bold">{toast.type.toUpperCase()}</p>
        <p className="text-xs opacity-90">{toast.message}</p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }} className="opacity-60 hover:opacity-100">
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};
