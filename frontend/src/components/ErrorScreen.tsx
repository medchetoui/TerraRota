import { useContext } from 'react';
import { AppContext } from '../App';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
  onReset: () => void;
}

export default function ErrorScreen({ message, onRetry, onReset }: ErrorScreenProps) {
  const { t } = useContext(AppContext);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-6">⚠️</div>
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-terracotta-light)' }}>
          {t('errorTitle')}
        </h2>
        {message && (
          <div className="glass-card p-4 mb-6 text-sm text-left"
            style={{ color: 'var(--color-text-muted)', wordBreak: 'break-word' }}>
            {message}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <button
            id="retry-btn"
            onClick={onRetry}
            className="py-3 rounded-xl font-bold text-sm"
            style={{
              background: 'linear-gradient(135deg, var(--color-terracotta) 0%, var(--color-terracotta-light) 100%)',
              color: 'white',
            }}
          >
            {t('errorRetry')}
          </button>
          <button
            id="reset-btn"
            onClick={onReset}
            className="py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            Recommencer depuis le début
          </button>
        </div>
      </div>
    </div>
  );
}
