import { useContext } from 'react';
import { AppContext } from '../App';
import {
  Satellite,
  Sprout,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Globe2,
  LogIn,
  LogOut,
  User as UserIcon,
  BookmarkCheck,
  Cpu,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface LandingProps {
  onStart: () => void;
  onOpenAuth: () => void;
  onOpenParcels: () => void;
}

export default function Landing({ onStart, onOpenAuth, onOpenParcels }: LandingProps) {
  const { t, lang, setLang, user, logout } = useContext(AppContext);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#070b08] text-slate-100">
      {/* Dynamic Ambient Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full blur-[120px] opacity-25"
          style={{ background: 'radial-gradient(circle, #10b981 0%, #047857 50%, transparent 80%)' }}
        />
        <div
          className="absolute top-[40%] -right-[15%] w-[600px] h-[600px] rounded-full blur-[140px] opacity-15"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
        />
      </div>

      {/* Top Navbar */}
      <header className="w-full border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-lg shadow-emerald-950">
              <div className="w-full h-full bg-[#0a130d] rounded-[14px] flex items-center justify-center text-emerald-400">
                <Sprout className="w-6 h-6" />
              </div>
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-xl text-white">
                Terra<span className="text-amber-400">Rota</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                NASA Space Apps 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User status / Login */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenParcels}
                  className="px-3.5 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/30 hover:border-emerald-400 text-xs text-emerald-300 font-semibold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <BookmarkCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('myParcels')}</span>
                </button>
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold">{user.username}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title={t('logout')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('login')}</span>
              </button>
            )}

            {/* Language Switcher */}
            <div className="flex bg-black/50 border border-white/10 rounded-xl p-1">
              {(['fr', 'ar'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    lang === l
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l === 'fr' ? 'FR' : 'عربي'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative z-10 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-12">
          {/* Official Field Shift Challenge Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 mb-8 backdrop-blur-md">
            <Satellite className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>NASA Space Apps Challenge 2026 • Field Shift</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            <span className="text-white">AgTech intelligente pour le </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-200">
              Maroc Agricole
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-medium max-w-2xl mx-auto mb-4 leading-relaxed">
            {t('tagline')}
          </p>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            {t('subtitle')}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="start-btn"
              type="button"
              onClick={onStart}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-base text-slate-950 bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 shadow-2xl shadow-emerald-950 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>{t('startBtn')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span>{user ? user.username : 'Créer un compte agriculteur'}</span>
            </button>
          </div>
        </div>

        {/* Feature Cards Grid (Wide desktop layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto w-full mb-12">
          {[
            {
              icon: Satellite,
              title: 'NASA POWER Satellite',
              desc: '5 ans d\'observations solaires, thermiques et pluviométriques par satellite.',
              highlight: 'Temps réel',
            },
            {
              icon: Globe2,
              title: 'Écosystème Marocain',
              desc: 'Calibré pour le Haouz, Souss, Saïss, Tadla et les zones arides du Royaume.',
              highlight: 'Adapté',
            },
            {
              icon: ShieldCheck,
              title: 'Algorithme Transparent',
              desc: 'Règles agronomiques vérifiables et explicables pour chaque décision de culture.',
              highlight: '100% Déterministe',
            },
            {
              icon: BarChart3,
              title: 'Indices Avancés',
              desc: 'Degrés-jours (GDD), indice d\'aridité (AI), risque de gel et bilan hydrique.',
              highlight: 'Agronomie',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between group backdrop-blur-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                      {item.highlight}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100 mb-1.5">{item.title}</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Metrics Row */}
        <div className="max-w-4xl mx-auto w-full p-6 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-black/40 to-amber-950/20 border border-white/10 flex flex-wrap items-center justify-around gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">1 826+</div>
            <div className="text-xs text-slate-400 mt-0.5">Jours d'observations NASA</div>
          </div>
          <div className="w-px h-8 bg-white/10 hidden sm:block" />
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">10 Cultures</div>
            <div className="text-xs text-slate-400 mt-0.5">Blé, Argan, Pomme de terre, Amandier...</div>
          </div>
          <div className="w-px h-8 bg-white/10 hidden sm:block" />
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">0.5° × 0.5°</div>
            <div className="text-xs text-slate-400 mt-0.5">Résolution spatiale satellite</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 bg-black/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{t('disclaimer')}</p>
          <div className="flex items-center gap-4">
            <span>NASA Space Apps 2026</span>
            <span>•</span>
            <span>Field Shift Challenge</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
