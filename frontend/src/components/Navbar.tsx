import { useContext } from 'react';
import { AppContext } from '../App';
import {
  Sprout,
  Satellite,
  BookmarkCheck,
  User as UserIcon,
  LogOut,
  LogIn,
  Home,
} from 'lucide-react';

interface NavbarProps {
  currentStep: string;
  onGoHome: () => void;
  onOpenAuth: () => void;
  onOpenParcels: () => void;
}

export default function Navbar({
  currentStep,
  onGoHome,
  onOpenAuth,
  onOpenParcels,
}: NavbarProps) {
  const { t, lang, setLang, user, logout } = useContext(AppContext);

  const getStepLabel = () => {
    switch (currentStep) {
      case 'location':
        return 'Étape 1 : Localisation';
      case 'details':
        return 'Étape 2 : Parcelle & Sols';
      case 'review':
        return 'Étape 3 : Vérification';
      case 'results':
        return 'Rapport d\'analyse';
      default:
        return null;
    }
  };

  const stepLabel = getStepLabel();

  return (
    <header className="w-full border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-40">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo & Back to Home */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-3 cursor-pointer text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-md shadow-emerald-950 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0a130d] rounded-[10px] flex items-center justify-center text-emerald-400">
                <Sprout className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg sm:text-xl text-white">
                  Terra<span className="text-amber-400">Rota</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  NASA 2026
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Système d'Aide à la Décision Agricole • Maroc
              </p>
            </div>
          </button>

          {/* Breadcrumb chip for wizard steps */}
          {stepLabel && (
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-emerald-400">
                {stepLabel}
              </span>
            </div>
          )}
        </div>

        {/* Right Tools & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live NASA API Chip */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Satellite className="w-3.5 h-3.5 text-emerald-400" />
            <span>NASA POWER Live</span>
          </div>

          {/* User status / Login */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenParcels}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/30 hover:border-emerald-400 text-xs text-emerald-300 font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('myParcels')}</span>
              </button>
              <div className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold">{user.username}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                title={t('logout')}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm shadow-emerald-950 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t('login')}</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex bg-black/60 border border-white/10 rounded-lg p-0.5">
            {(['fr', 'ar'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
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
  );
}
