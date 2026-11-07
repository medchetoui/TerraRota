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
  const { t, lang } = useContext(AppContext);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginUser({ username, password });
        const meRes = await getMe();
        setSuccessMsg(isAr ? 'تم تسجيل الدخول بنجاح !' : 'Connexion réussie !');
        setTimeout(() => {
          onSuccess(meRes.user);
          onClose();
        }, 500);
      } else {
        const regRes = await registerUser({ username, email, password });
        setSuccessMsg(isAr ? 'تم إنشاء الحساب بنجاح !' : 'Compte créé avec succès !');
        setTimeout(() => {
          onSuccess(regRes.user);
          onClose();
        }, 500);
      }
    } catch (err: unknown) {
      const e = err as { data?: { errors?: Record<string, string[]>; message?: string; detail?: string } };
      const errData = e?.data;
      let msg = isAr ? 'معلومات الدخول غير صحيحة أو هناك خطأ في السيرفر.' : 'Identifiants invalides ou erreur serveur.';
      const errorsObj = errData?.errors || (errData as unknown as { errors?: Record<string, string[]> })?.errors;
      if (errorsObj && typeof errorsObj === 'object') {
        const messages: string[] = [];
        for (const [field, fieldErrors] of Object.entries(errorsObj)) {
          const fieldLabel = field === 'username' ? (isAr ? 'اسم المستخدم' : "Nom d'utilisateur") : field === 'email' ? 'Email' : field === 'password' ? (isAr ? 'كلمة المرور' : 'Mot de passe') : field;
          const text = Array.isArray(fieldErrors) ? fieldErrors.join(', ') : String(fieldErrors);
          messages.push(`${fieldLabel}: ${text}`);
        }
        msg = messages.join(' | ');
      } else if (errData?.detail) {
        msg = errData.detail;
      } else if (errData?.message) {
        msg = errData.message;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-lg p-8 sm:p-10 rounded-3xl bg-[#FAF7F2] border-2 border-[#DECAB3] shadow-2xl text-[#2C2416]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 end-6 p-2 text-[#7A6B53] hover:text-[#1E331A] rounded-xl bg-[#EFE9DC] hover:bg-[#E5DDCF] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#2D4A27]/10 border border-[#2D4A27]/30 flex items-center justify-center text-[#2D4A27] mx-auto mb-3 shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#1E331A]">
            {mode === 'login' ? (isAr ? 'فضاء الفلاح' : 'Espace Agriculteur') : (isAr ? 'إنشاء حساب جديد' : 'Créer votre compte')}
          </h2>
          <p className="text-xs text-[#7A6B53] mt-1 font-medium">
            {mode === 'login'
              ? (isAr ? 'سجل دخولك لاسترجاع أراضيك وتحليلاتك المحفوظة' : 'Connectez-vous pour retrouver vos parcelles et vos analyses sauvegardées')
              : (isAr ? 'احفظ أراضيك وتابع التوصيات الفلاحية مع الوقت' : 'Enregistrez vos parcelles et suivez les recommandations dans le temps')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#EFE9DC] p-1 rounded-2xl border border-[#DECAB3] mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'login'
                ? 'bg-[#2D4A27] text-white shadow-sm'
                : 'text-[#61513C] hover:text-[#1E331A]'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>{isAr ? 'تسجيل الدخول' : t('login')}</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'register'
                ? 'bg-[#2D4A27] text-white shadow-sm'
                : 'text-[#61513C] hover:text-[#1E331A]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAr ? 'إنشاء حساب جديد' : t('register')}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#524430] mb-1.5">
              {isAr ? 'اسم المستخدم' : t('username')}
            </label>
            <div className="relative">
              <User className="absolute start-3.5 top-3.5 w-4 h-4 text-[#7A6B53]" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: mohammed_agri"
                className="w-full ps-11 pe-4 py-3 rounded-xl bg-[#EFE9DC] border border-[#DECAB3] text-[#1E331A] placeholder-[#8C7A60] focus:outline-none focus:border-[#2D4A27] focus:ring-2 focus:ring-[#2D4A27]/20 text-sm font-semibold transition-all"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-[#524430] mb-1.5">
                {isAr ? 'البريد الإلكتروني' : t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute start-3.5 top-3.5 w-4 h-4 text-[#7A6B53]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: contact@ferme.ma"
                  className="w-full ps-11 pe-4 py-3 rounded-xl bg-[#EFE9DC] border border-[#DECAB3] text-[#1E331A] placeholder-[#8C7A60] focus:outline-none focus:border-[#2D4A27] focus:ring-2 focus:ring-[#2D4A27]/20 text-sm font-semibold transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#524430] mb-1.5">
              {isAr ? 'كلمة المرور' : t('password')}
            </label>
            <div className="relative">
              <Lock className="absolute start-3.5 top-3.5 w-4 h-4 text-[#7A6B53]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full ps-11 pe-4 py-3 rounded-xl bg-[#EFE9DC] border border-[#DECAB3] text-[#1E331A] placeholder-[#8C7A60] focus:outline-none focus:border-[#2D4A27] focus:ring-2 focus:ring-[#2D4A27]/20 text-sm font-semibold transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 px-6 rounded-2xl font-bold text-sm bg-[#8C3A27] hover:bg-[#732F1F] text-white flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>{isAr ? 'دخول إلى حسابي' : 'Se connecter'}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{isAr ? 'تأكيد وإنشاء الحساب' : 'Créer mon compte'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
