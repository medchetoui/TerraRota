import { useContext } from 'react';
import { AppContext } from '../App';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
  onReset: () => void;
}

export default function ErrorScreen({ message, onRetry, onReset }: ErrorScreenProps) {
  const { t } = useContext(AppContext);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a110a] text-slate-100">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-6 shadow-xl shadow-rose-950/40">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold mb-2 text-rose-400">
          {t('errorTitle')}
        </h2>

        {message && (
          <div className="p-4 mb-6 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 text-left font-mono break-all leading-relaxed">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            id="retry-btn"
            onClick={onRetry}
            className="py-3.5 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-rose-950/50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('errorRetry')}</span>
          </button>
          <button
            id="reset-btn"
            onClick={onReset}
            className="py-3 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Recommencer depuis le début</span>
          </button>
        </div>
      </div>
    </div>
  );
}
