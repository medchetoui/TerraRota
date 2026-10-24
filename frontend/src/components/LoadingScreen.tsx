import { useContext } from 'react';
import { AppContext } from '../App';
import { Satellite, BarChart3, Sprout, Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  const { t } = useContext(AppContext);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a110a] text-slate-100">
      <div className="text-center max-w-sm w-full">
        {/* Animated Satellite Visual */}
        <div className="flex justify-center mb-8">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Orbit rings */}
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
            <div
              className="absolute inset-3 rounded-full border border-amber-400/20 border-b-amber-400 animate-spin"
              style={{ animationDuration: '4s', animationDirection: 'reverse' }}
            />
            {/* Center Satellite */}
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950">
              <Satellite className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2 text-slate-100">{t('loading')}</h2>
        <p className="text-xs mb-8 text-slate-400 leading-relaxed">
          {t('loadingDetail')}
        </p>

        {/* Progress steps */}
        <div className="text-left space-y-2.5">
          {[
            { icon: Satellite, text: 'Connexion à l\'API NASA POWER...' },
            { icon: BarChart3, text: 'Calcul des indicateurs agro-climatiques...' },
            { icon: Sprout, text: 'Application du moteur de règles de culture...' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-300 font-medium flex-1">{text}</span>
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
