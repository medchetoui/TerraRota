import { useContext } from 'react';
import { AppContext } from '../App';

export default function LoadingScreen() {
  const { t } = useContext(AppContext);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Animated satellite icon */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 h-24">
            {/* Orbit ring */}
            <div className="absolute inset-0 rounded-full border-2 opacity-30"
              style={{ borderColor: 'var(--color-terracotta)', animation: 'spin 3s linear infinite' }} />
            <div className="absolute inset-2 rounded-full border opacity-20"
              style={{ borderColor: 'var(--color-gold)', animation: 'spin 5s linear infinite reverse' }} />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center text-4xl">
              🛰️
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-3">{t('loading')}</h2>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          {t('loadingDetail')}
        </p>

        {/* Progress steps */}
        <div className="text-left space-y-3">
          {[
            { icon: '🛰️', text: 'Connexion à NASA POWER...' },
            { icon: '📊', text: 'Calcul des indicateurs climatiques...' },
            { icon: '🌾', text: 'Analyse des règles agronomiques...' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)' }}>
              <span className="text-lg">{icon}</span>
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{text}</span>
              <div className="ml-auto">
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--color-terracotta)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
