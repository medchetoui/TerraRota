import { useContext } from 'react';
import { AppContext } from '../App';
import {
  Satellite,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Globe2,
  User as UserIcon,
} from 'lucide-react';

interface LandingProps {
  onStart: () => void;
  onOpenAuth: () => void;
  onOpenParcels: () => void;
}

export default function Landing({ onStart, onOpenAuth }: LandingProps) {
  const { t, user } = useContext(AppContext);

  return (
    <div className="w-full flex-1 flex flex-col relative overflow-hidden bg-[#070b08] text-slate-100">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[1400px] h-[500px] rounded-full blur-[140px] opacity-20"
          style={{ background: 'radial-gradient(circle, #10b981 0%, #047857 50%, transparent 80%)' }}
        />
        <div
          className="absolute top-[35%] -right-[10%] w-[800px] h-[800px] rounded-full blur-[160px] opacity-15"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[10%] -left-[10%] w-[800px] h-[800px] rounded-full blur-[140px] opacity-15"
          style={{ background: 'radial-gradient(circle, #0284c7 0%, transparent 70%)' }}
        />
      </div>

      {/* Main Full-Width Hero Section */}
      <main className="w-full flex-1 px-4 sm:px-8 lg:px-12 py-8 sm:py-12 relative z-10 flex flex-col justify-between">
        <div className="text-center w-full max-w-5xl mx-auto pt-2 sm:pt-6">
          {/* Official Field Shift Challenge Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 mb-6 backdrop-blur-md">
            <Satellite className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>NASA Space Apps Challenge 2026 • Défi Field Shift</span>
          </div>

          {/* Impact Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] mb-4">
            <span className="text-white">AgTech Intelligente pour le </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-200">
              Maroc Agricole
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 font-medium max-w-3xl mx-auto mb-3 leading-relaxed">
            {t('tagline')}
          </p>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            {t('subtitle')}
          </p>

          {/* Action CTAs (Sleek and compact) */}
          <div className="flex flex-row items-center justify-center gap-3 mb-10">
            <button
              id="start-btn"
              type="button"
              onClick={onStart}
              className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 shadow-lg shadow-emerald-950 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{t('startBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span>{user ? user.username : 'Espace Agriculteur'}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon Across Full Width */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/[0.025] border border-white/10 backdrop-blur-md mb-8">
          <div className="text-center p-3 border-r border-white/5 last:border-r-0">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">1 826+</div>
            <div className="text-xs text-slate-400 mt-1">Jours d'observations NASA</div>
          </div>
          <div className="text-center p-3 border-r border-white/5 last:border-r-0">
            <div className="text-2xl sm:text-3xl font-black text-amber-400">10 Cultures</div>
            <div className="text-xs text-slate-400 mt-1">Blé, Olivier, Arganier, etc.</div>
          </div>
          <div className="text-center p-3 border-r border-white/5 last:border-r-0">
            <div className="text-2xl sm:text-3xl font-black text-sky-400">0.5° × 0.5°</div>
            <div className="text-xs text-slate-400 mt-1">Grille satellite (~50 km)</div>
          </div>
          <div className="text-center p-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-200">100%</div>
            <div className="text-xs text-slate-400 mt-1">Règles agronomiques vérifiables</div>
          </div>
        </div>

        {/* 4 Feature Cards Grid Across Full Width */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-8">
          {[
            {
              icon: Satellite,
              title: 'Données Satellites Réelles',
              desc: 'Relevés quotidiens de température, précipitations et ensoleillement NASA POWER.',
              tag: 'Précision',
            },
            {
              icon: Globe2,
              title: 'Écosystèmes Marocains',
              desc: 'Calibré pour le Haouz, Souss, Saïss, Tadla, Gharb et zones semi-arides.',
              tag: 'Régional',
            },
            {
              icon: ShieldCheck,
              title: 'Rotation & Sol Intelligents',
              desc: 'Évite les successions néfastes, valorise les légumineuses et préserve la fertilité.',
              tag: 'Agronomie',
            },
            {
              icon: BarChart3,
              title: 'Indices Agro-Climatiques',
              desc: 'Calcul rigoureux de GDD (Degrés-Jours), Indice d\'Aridité, Gel et Stress Hydrique.',
              tag: 'Décision',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {item.tag}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-200 mb-1">{item.title}</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info bar Across Full Width */}
        <div className="w-full border-t border-white/5 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span>Développé pour la communauté agricole marocaine</span>
            <span>•</span>
            <span>NASA Space Apps Challenge 2026</span>
          </div>
          <div>
            Projet Open Source — Données publiques NASA POWER
          </div>
        </div>
      </main>
    </div>
  );
}
