import { useContext } from 'react';
import { AppContext } from '../App';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  const { t, lang, setLang } = useContext(AppContext);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(193,68,14,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(107,158,107,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Language switcher */}
      <div className="flex justify-end p-4 relative z-10">
        <div className="flex gap-2">
          {(['fr', 'ar'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                lang === l
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={lang === l ? { background: 'var(--color-terracotta)' } : {}}
            >
              {l === 'fr' ? 'Français' : 'العربية'}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-2xl w-full text-center">
          {/* Logo / icon area */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl glow-border border-2"
                style={{ background: 'rgba(193,68,14,0.15)', borderColor: 'rgba(193,68,14,0.4)' }}>
                🌱
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ background: 'var(--color-gold)', color: '#1a0f00' }}>
                🛰
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-black mb-4 gradient-text">
            {t('appName')}
          </h1>

          <p className="text-xl font-medium mb-3" style={{ color: 'var(--color-text-muted)' }}>
            {t('tagline')}
          </p>
          <p className="text-base mb-10" style={{ color: 'var(--color-text-muted)' }}>
            {t('subtitle')}
          </p>

          {/* CTA button */}
          <button
            id="start-btn"
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-lg font-bold text-white transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--color-terracotta) 0%, var(--color-terracotta-light) 100%)',
              boxShadow: '0 8px 32px rgba(193,68,14,0.35)',
            }}
          >
            <span>{t('startBtn')}</span>
            <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
          </button>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {[
              { icon: '🛰️', label: 'NASA POWER' },
              { icon: '🌾', label: 'Maroc agricole' },
              { icon: '🔍', label: 'Transparent' },
              { icon: '📊', label: 'Indicateurs climatiques' },
            ].map(({ icon, label }) => (
              <div key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)' }}>
                <span>{icon}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="mt-8 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('disclaimer')}
          </p>
        </div>
      </div>

      {/* About section */}
      <div className="px-4 pb-12 relative z-10">
        <div className="max-w-xl mx-auto glass-card p-6">
          <h2 className="font-semibold mb-2" style={{ color: 'var(--color-gold)' }}>
            {t('aboutTitle')}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {t('aboutText')}
          </p>
        </div>
      </div>
    </div>
  );
}
