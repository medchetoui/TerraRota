import { useContext } from 'react';
import { AppContext } from '../App';
import {
  Satellite,
  Sprout,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Globe,
  LogIn,
  LogOut,
  User as UserIcon,
  BookmarkCheck,
} from 'lucide-react';

interface LandingProps {
  onStart: () => void;
  onOpenAuth: () => void;
  onOpenParcels: () => void;
}

export default function Landing({ onStart, onOpenAuth, onOpenParcels }: LandingProps) {
  const { t, lang, setLang, user, logout } = useContext(AppContext);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0a110a] text-slate-100">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-10%] right-[-5%] w-[650px] h-[650px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #059669 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-15%] left-[-5%] w-[550px] h-[550px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 70%)' }}
        />
      </div>

      {/* Top Navbar */}
      <header className="flex items-center justify-between px-6 py-4 relative z-10 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight text-lg text-emerald-400">
            Terra<span className="text-amber-400">Rota</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* User profile / Login */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenParcels}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-500 text-xs text-emerald-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>{t('myParcels')}</span>
              </button>
              <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold">{user.username}</span>
              </div>
              <button
                onClick={logout}
                title={t('logout')}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950/40 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm shadow-emerald-950 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('login')}</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5">
            {(['fr', 'ar'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  lang === l
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {l === 'fr' ? 'FR' : 'عربي'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 flex items-center justify-center px-4 py-16 relative z-10">
        <div className="max-w-3xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 mb-8 backdrop-blur-sm">
            <Satellite className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>NASA Space Apps 2026 | Field Shift</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-200">
              TerraRota
            </span>
          </h1>

          <p className="text-lg sm:text-xl font-medium text-slate-200 mb-3 max-w-2xl mx-auto leading-relaxed">
            {t('tagline')}
          </p>
          <p className="text-sm sm:text-base text-slate-400 mb-10 max-w-xl mx-auto">
            {t('subtitle')}
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="start-btn"
              onClick={onStart}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 shadow-xl shadow-emerald-950/50 hover:shadow-emerald-900/60 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>{t('startBtn')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Institutional Feature Highlights (No Emojis) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-14 text-left">
            {[
              {
                icon: Satellite,
                title: 'NASA POWER',
                desc: 'Daily satellite solar & climate feeds',
              },
              {
                icon: Globe,
                title: 'Morocco AgTech',
                desc: 'Tailored to arid & semi-arid zones',
              },
              {
                icon: ShieldCheck,
                title: 'Explainable AI',
                desc: 'Deterministic agronomic scoring',
              },
              {
                icon: BarChart3,
                title: 'Indicators',
                desc: 'GDD, Aridity Index, Frost days',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all group backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-200 mb-1">{title}</h2>
                <p className="text-[11px] text-slate-400 leading-snug">{desc}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="mt-8 text-xs text-slate-500">
            {t('disclaimer')}
          </p>
        </div>
      </main>

      {/* About institutional footer */}
      <footer className="px-6 py-6 relative z-10 border-t border-white/5 bg-black/40">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t('aboutText')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
