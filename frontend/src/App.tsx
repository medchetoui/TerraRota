import React, { useState, useCallback, useEffect } from 'react';
import './index.css';
import { translations, type Lang } from './i18n/translations';
import type {
  RecommendationRequest,
  RecommendationResponse,
  CropId,
  WaterAccess,
  SoilType,
} from './types/api';
import {
  getRecommendations,
  getMe,
  setToken,
  getToken,
  type UserProfile,
  type ParcelItem,
} from './api/client';

// ─── Screens & Modals ───────────────────────────────────────
import Landing from './components/Landing';
import LocationStep from './components/LocationStep';
import FarmDetailsStep from './components/FarmDetailsStep';
import ReviewStep from './components/ReviewStep';
import LoadingScreen from './components/LoadingScreen';
import ResultsScreen from './components/ResultsScreen';
import ErrorScreen from './components/ErrorScreen';
import AuthModal from './components/AuthModal';
import ParcelsModal from './components/ParcelsModal';

type Step = 'landing' | 'location' | 'details' | 'review' | 'loading' | 'results' | 'error';

export interface FormData {
  latitude: string;
  longitude: string;
  previous_crop: CropId | '';
  water_access: WaterAccess | '';
  soil_type: SoilType;
  field_size_ha: string;
  preferred_crops: CropId[];
  notes: string;
}

const initialForm: FormData = {
  latitude: '',
  longitude: '',
  previous_crop: '',
  water_access: '',
  soil_type: 'unknown',
  field_size_ha: '',
  preferred_crops: [],
  notes: '',
};

export interface AppContextValue {
  t: (key: string) => string;
  lang: Lang;
  setLang: (l: Lang) => void;
  user: UserProfile | null;
  logout: () => void;
}

export const AppContext = React.createContext<AppContextValue>({
  t: (k) => k,
  lang: 'fr',
  setLang: () => {},
  user: null,
  logout: () => {},
});

function App() {
  const [step, setStep] = useState<Step>('landing');
  const [form, setForm] = useState<FormData>(initialForm);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('fr');

  // Auth & Modals state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [parcelsModalOpen, setParcelsModalOpen] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = getToken();
    if (token) {
      getMe()
        .then((res) => {
          if (res?.user) setUser(res.user);
        })
        .catch(() => {
          setToken(null);
          setUser(null);
        });
    }
  }, []);

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const t = useCallback(
    (key: string): string => {
      const dict = translations[lang] as Record<string, string>;
      const fallback = translations.fr as Record<string, string>;
      return dict[key] ?? fallback[key] ?? key;
    },
    [lang],
  );

  const ctxValue: AppContextValue = { t, lang, setLang, user, logout };

  const handleSelectParcel = (parcel: ParcelItem) => {
    setForm({
      latitude: parcel.latitude.toString(),
      longitude: parcel.longitude.toString(),
      previous_crop: '',
      water_access: (parcel.water_access as WaterAccess) || '',
      soil_type: (parcel.soil_type as SoilType) || 'unknown',
      field_size_ha: parcel.field_size_ha ? parcel.field_size_ha.toString() : '',
      preferred_crops: [],
      notes: parcel.notes || '',
    });
    setStep('details');
  };

  const handleSubmit = async () => {
    setStep('loading');
    setApiError(null);

    const payload: RecommendationRequest = {
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      previous_crop: form.previous_crop || null,
      water_access: form.water_access || null,
      soil_type: form.soil_type,
      field_size_ha: form.field_size_ha ? parseFloat(form.field_size_ha) : null,
      preferred_crops: form.preferred_crops,
      notes: form.notes,
    };

    try {
      const res = await getRecommendations(payload);
      setResult(res);
      setStep('results');
    } catch (err: unknown) {
      const error = err as { data?: { message?: string; errors?: Record<string, string[]> } };
      const msg =
        error?.data?.message ||
        JSON.stringify(error?.data?.errors) ||
        'Une erreur inattendue est survenue.';
      setApiError(msg);
      setStep('error');
    }
  };

  return (
    <AppContext.Provider value={ctxValue}>
      <div
        className="w-full min-h-screen bg-[#070b08] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {step === 'landing' && (
          <Landing
            onStart={() => setStep('location')}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenParcels={() => setParcelsModalOpen(true)}
          />
        )}
        {step === 'location' && (
          <LocationStep
            form={form}
            setForm={setForm}
            onNext={() => setStep('details')}
            onBack={() => setStep('landing')}
            onOpenParcels={() => setParcelsModalOpen(true)}
          />
        )}
        {step === 'details' && (
          <FarmDetailsStep
            form={form}
            setForm={setForm}
            onNext={() => setStep('review')}
            onBack={() => setStep('location')}
          />
        )}
        {step === 'review' && (
          <ReviewStep
            form={form}
            onSubmit={handleSubmit}
            onBack={() => setStep('details')}
            onEdit={(s: Step) => setStep(s)}
          />
        )}
        {step === 'loading' && <LoadingScreen />}
        {step === 'results' && result && (
          <ResultsScreen
            result={result}
            form={form}
            onRevise={() => setStep('location')}
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}
        {step === 'error' && (
          <ErrorScreen
            message={apiError || ''}
            onRetry={() => setStep('review')}
            onReset={() => {
              setForm(initialForm);
              setStep('landing');
            }}
          />
        )}

        {/* Global Modals */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(u) => setUser(u)}
        />
        <ParcelsModal
          isOpen={parcelsModalOpen}
          onClose={() => setParcelsModalOpen(false)}
          onSelectParcel={handleSelectParcel}
        />
      </div>
    </AppContext.Provider>
  );
}

export default App;
