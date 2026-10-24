import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { loginUser, registerUser, getMe, type UserProfile } from '../api/client';
import { LogIn, UserPlus, Lock, Mail, User, X, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { t } = useContext(AppContext);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginUser({ username, password });
        const meRes = await getMe();
        setSuccessMsg('Connexion réussie !');
        setTimeout(() => {
          onSuccess(meRes.user);
          onClose();
        }, 500);
      } else {
        const regRes = await registerUser({ username, email, password });
        setSuccessMsg('Compte créé avec succès !');
        setTimeout(() => {
          onSuccess(regRes.user);
          onClose();
        }, 500);
      }
    } catch (err: unknown) {
      const e = err as { data?: { errors?: Record<string, string[]>; message?: string; detail?: string } };
      const msg =
        e?.data?.detail ||
        e?.data?.message ||
        (e?.data?.errors ? JSON.stringify(e.data.errors) : 'Identifiants invalides ou erreur serveur.');
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-[#0b120c] border border-emerald-500/30 shadow-2xl shadow-emerald-950/60 text-white">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-lg shadow-emerald-950">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            {mode === 'login' ? 'Espace Agriculteur' : 'Créer votre compte'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Connectez-vous pour retrouver vos parcelles et vos analyses sauvegardées'
              : 'Enregistrez vos parcelles et suivez les recommandations dans le temps'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-black/50 p-1 rounded-xl border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{t('login')}</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'register'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('register')}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              {t('username')}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: mohammed_agri"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm font-semibold transition-all"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: contact@ferme.ma"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm font-semibold transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              {t('password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/60 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm font-semibold transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Se connecter</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Créer mon compte</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
