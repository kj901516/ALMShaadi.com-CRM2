import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useApp } from '../lib/store';

export default function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-card animate-slideUp bg-white border-l-4 ${
            t.type === 'success' ? 'border-green-500' : t.type === 'error' ? 'border-red-500' : 'border-gold-500'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />}
          {t.type === 'error' && <XCircle className="text-red-500 flex-shrink-0" size={20} />}
          {t.type === 'info' && <Info className="text-gold-600 flex-shrink-0" size={20} />}
          <p className="flex-1 text-sm text-gray-800 font-medium">{t.message}</p>
          <button onClick={() => dismissToast(t.id)} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
