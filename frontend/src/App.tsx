import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import './index.css';
import { translations, type Lang } from './i18n/translations';
import type { 
  RecommendationResponse, 
  CropId, 
  WaterAccess, 
  SoilType, 
  CropRecommendation 
} from './types/api';
import { 
  Sprout, 
  MapPin, 
  Volume2, 
  Mic, 
  CheckCircle2, 
  Sun, 
  Layers, 
  Compass, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  TrendingUp,
  ThermometerSun,
  ShieldCheck,
  User,
  RefreshCw,
  AlertTriangle,
  BookmarkPlus,
  Zap,
  Database,
  CloudRain,
  Snowflake,
  ExternalLink,
  Microscope,
  Sliders,
  FileText,
  Menu,
  X
} from 'lucide-react';
import { 
  getRecommendations, 
  getMe, 
  setToken, 
  getToken, 
  createParcel, 
  type UserProfile
} from './api/client';
import AuthModal from './components/AuthModal';
import ParcelsModal from './components/ParcelsModal';
import { FarmMap } from './components/FarmMap';
import { NASADataPage } from './pages/NASADataPage';
import { RotationPlannerPage } from './pages/RotationPlannerPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { CropLibraryPage } from './pages/CropLibraryPage';
import { SoilPage } from './pages/SoilPage';
import { ReportsPage } from './pages/ReportsPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { FarmsPage } from './pages/FarmsPage';
import FellahQuestion from './components/FellahQuestion';
import Intro from './components/Intro';

// ─── 1. GESTION DE LA LANGUE (PERSISTANTE) ───
const LANG_KEY = 'terrarota_lang';

const getInitialLang = (): Lang => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'ar' || saved === 'fr' || saved === 'en') return saved;
  } catch { /* ignore */ }
  return 'ar'; // Langue par défaut
};

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

export interface AppContextValue {
  t: (key: string) => string;
  lang: Lang;
  setLang: (l: Lang) => void;
  user: UserProfile | null;
  logout: () => void;
}

export const AppContext = createContext<AppContextValue>({
  t: (k: string) => k,
  lang: 'ar',
  setLang: () => {},
  user: null,
  logout: () => {},
});

const CROP_IMAGES: Record<string, string> = {
  barley: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=800',
  wheat_hard: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
  wheat_soft: 'https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?auto=format&fit=crop&q=80&w=800',
  chickpea: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&q=80&w=800',
  olive: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&q=80&w=800',
  argan: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=800',
  cactus_pear: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=800',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800',
  almond: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&q=80&w=800',
};

const REGIONS = [
  { name_ar: 'جهة فاس - مكناس (حوض سايس)', name_fr: 'Fès - Meknès (Saïss)', name_en: 'Fes - Meknes (Saïss)', lat: 33.89, lon: -5.00, soil: 'clay_loam', desc_ar: 'تيرس غني، عمق خصب > 90 سم', desc_fr: 'Tirs fertile > 90cm', desc_en: 'Rich Tirs soil, depth > 90cm' },
  { name_ar: 'جهة سوس - ماسة (تارودانت / هوارة)', name_fr: 'Souss - Massa (Taroudant)', name_en: 'Souss - Massa (Taroudant)', lat: 30.42, lon: -8.87, soil: 'sandy_loam', desc_ar: 'حمري خفيف رملي نصف جاف', desc_fr: 'Hamri sableux semi-aride', desc_en: 'Sandy Hamri, semi-arid' },
  { name_ar: 'جهة مراكش - الحوز (تانسيفت)', name_fr: 'Marrakech - Tensift', name_en: 'Marrakech - Tensift', lat: 31.62, lon: -8.00, soil: 'clay', desc_ar: 'تربة طينية متماسكة خصبة', desc_fr: 'Argileux profond', desc_en: 'Deep fertile clay soil' },
  { name_ar: 'جهة الشاوية - ورديغة (سطات)', name_fr: 'Chaouia - Settat', name_en: 'Chaouia - Settat', lat: 33.00, lon: -7.60, soil: 'clay_loam', desc_ar: 'أراضي التيرس الكبرى للحبوب', desc_fr: 'Grande zone céréalière', desc_en: 'Major cereal Tirs plain' },
  { name_ar: 'جهة الغرب - شراردة بني حسن', name_fr: 'Gharb - Kénitra', name_en: 'Gharb - Kenitra', lat: 34.26, lon: -6.58, soil: 'clay', desc_ar: 'أراضي الرمل والغرين الغنية بالمياه', desc_fr: 'Sols alluviaux riches', desc_en: 'Water-rich alluvial soil' },
];

type Mode = 'farmer' | 'expert';
const EXPERT_PATHS = ['/nasa', '/weather', '/soil', '/simulator', '/sources'];

function MainLayout() {
  // ─── 1. LANGUE PERSISTANTE ───
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ }
  };

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isParcelsOpen, setIsParcelsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  
  const [mode, setModeState] = useState<Mode>(() => {
    try { return sessionStorage.getItem('terrarota_mode') === 'expert' ? 'expert' : 'farmer'; } catch { return 'farmer'; }
  });

  const setMode = (m: Mode) => {
    setModeState(m);
    try { sessionStorage.setItem('terrarota_mode', m); } catch { /* ignore */ }
  };

  const [showIntro, setShowIntro] = useState(() => {
    try { return !sessionStorage.getItem('terrarota_intro_seen'); } catch { return false; }
  });

  useEffect(() => {
    if (mode === 'farmer' && EXPERT_PATHS.includes(location.pathname)) {
      navigate('/', { replace: true });
    }
  }, [mode, location.pathname]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRegionIndex, setSelectedRegionIndex] = useState(0);
  const [previousCrop, setPreviousCrop] = useState<CropId>('wheat_hard');
  const [waterAccess, setWaterAccess] = useState<WaterAccess>('rainfed');
  const [soilType, setSoilType] = useState<SoilType>('clay_loam');
  const [fieldSize, setFieldSize] = useState('4.8');
  const [customLat, setCustomLat] = useState<number | undefined>(undefined);
  const [customLon, setCustomLon] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<RecommendationResponse | null>(null);
  const [selectedCropIndex, setSelectedCropIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAr = lang === 'ar';
  const isEn = lang === 'en';
  const currentRegion = REGIONS[selectedRegionIndex];

  const activeLat = customLat ?? currentRegion.lat;
  const activeLon = customLon ?? currentRegion.lon;
  const activeRegionName = customLat !== undefined && customLon !== undefined
    ? (lang === 'ar' ? `موقع مخصص (${customLat.toFixed(2)}°, ${customLon.toFixed(2)}°)` : lang === 'en' ? `Custom Location (${customLat.toFixed(2)}°, ${customLon.toFixed(2)}°)` : `Position personnalisée (${customLat.toFixed(2)}°, ${customLon.toFixed(2)}°)`)
    : (lang === 'ar' ? currentRegion.name_ar : lang === 'en' ? currentRegion.name_en : currentRegion.name_fr);

  const getRegionName = (r: typeof REGIONS[0]) => {
    if (lang === 'ar') return r.name_ar;
    if (lang === 'en') return r.name_en;
    return r.name_fr;
  };

  const getRegionDesc = (r: typeof REGIONS[0]) => {
    if (lang === 'ar') return r.desc_ar;
    if (lang === 'en') return r.desc_en;
    return r.desc_fr;
  };

  const t = (key: string): string => {
    const dict = (translations as Record<string, Record<string, string>>)[lang] || (translations as Record<string, Record<string, string>>)['fr'];
    return dict?.[key] || key;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (getToken()) {
      getMe().then(r => setUser(r.user)).catch(() => setToken(null));
    }
  }, []);

  const triggerAnalysis = async (customLatOverride?: number, customLonOverride?: number) => {
    setLoading(true);
    setIsSaved(false);
    try {
      const lat = customLatOverride ?? customLat ?? currentRegion.lat;
      const lon = customLonOverride ?? customLon ?? currentRegion.lon;
      
      const [res] = await Promise.all([
        getRecommendations({
          latitude: lat,
          longitude: lon,
          previous_crop: previousCrop,
          water_access: waterAccess,
          soil_type: soilType,
          field_size_ha: parseFloat(fieldSize) || 4.8,
        }),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      
      setApiResponse(res);
      setSelectedCropIndex(0);
    } catch (err) {
      console.error('NASA API query error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    triggerAnalysis();
  }, [selectedRegionIndex, customLat, customLon, previousCrop, waterAccess, soilType]);

  const handleAutomaticGPS = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          triggerAnalysis(pos.coords.latitude, pos.coords.longitude);
          setStep(2);
        },
        () => {
          triggerAnalysis();
          setStep(2);
        }
      );
    } else {
      triggerAnalysis();
      setStep(2);
    }
  };

  const handleSaveParcel = async () => {
    const crop = activeRecommendation?.crop_name_fr || 'Culture';
    // ─── 3. NOM STABLE (Toujours en français) ───
    const regionFr = customLat !== undefined ? activeRegionName : currentRegion.name_fr;

    try {
      await createParcel({
        name: `Parcelle ${regionFr} (${crop})`,
        latitude: activeLat,
        longitude: activeLon,
        water_access: waterAccess,
        soil_type: soilType,
        field_size_ha: parseFloat(fieldSize) || 4.8,
      });
      setIsSaved(true);
      setSaveSuccessMsg(isAr ? 'تم حفظ القطعة بنجاح في حسابك !' : isEn ? 'Field parcel saved successfully!' : 'Parcelle sauvegardée avec succès !');
      navigate('/farms');
    } catch (err) {
      console.error('Error saving parcel', err);
      setIsAuthOpen(true);
    }
  };

  const recommendations = apiResponse?.recommendations || [];
  const activeRecommendation: CropRecommendation | undefined = recommendations[selectedCropIndex] || recommendations[0];
  const indicators = apiResponse?.indicators;

  const annualRain = indicators?.annual_rain_mm ? Math.round(indicators.annual_rain_mm) : 340;
  const avgTemp = indicators?.mean_annual_temp_c ? Math.round(indicators.mean_annual_temp_c) : 21;
  const isRainAdequate = annualRain > 280;

  const translateCategory = (cat: string) => {
    if (!cat) return '';
    const c = cat.toLowerCase();
    if (c === 'cereal') return isAr ? 'حبوب' : isEn ? 'Cereals' : 'Céréales';
    if (c === 'legume') return isAr ? 'قطاني' : isEn ? 'Pulses' : 'Légumineuses';
    if (c === 'tree_crop') return isAr ? 'أشجار' : isEn ? 'Tree Crops' : 'Arboriculture';
    if (c === 'vegetable') return isAr ? 'خضروات' : isEn ? 'Vegetables' : 'Maraîchage';
    if (c === 'cactus') return isAr ? 'صبار' : isEn ? 'Cactus' : 'Cactus';
    return cat;
  };

  const prevCropLabel = t((previousCrop as string) === 'fallow' ? 'none' : previousCrop);

  const speakCurrentAdvice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!isAudioPlaying) {
      const rec = activeRecommendation;
      const cropName = isAr ? rec?.crop_name_ar : isEn ? (rec?.crop_name_en || rec?.crop_name_fr) : rec?.crop_name_fr;
      const reasonsList = isEn ? (rec?.reasons_en ?? rec?.reasons) : lang === 'fr' ? (rec?.reasons_fr ?? rec?.reasons) : rec?.reasons;
      const reasonsText = reasonsList?.slice(0, 2).join('. ') || '';
      const text = isAr
        ? `السلام عليكم يا فلاحنا. بناءً على صور الأقمار الاصطناعية ديال ناسا فـ ${currentRegion.name_ar}، أحسن محصول موصى به لأرضك هو ${cropName}. ${reasonsText}.`
        : isEn
        ? `Hello dear farmer. Based on NASA satellite observations for ${currentRegion.name_en}, the recommended crop for your field is ${cropName}. ${reasonsText}.`
        : `Bonjour cher agriculteur. Selon les observations satellites NASA pour la région de ${currentRegion.name_fr}, la culture recommandée pour votre parcelle est ${cropName}. ${reasonsText}.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isAr ? 'ar-MA' : isEn ? 'en-US' : 'fr-FR';
      utterance.onend = () => setIsAudioPlaying(false);
      setIsAudioPlaying(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsAudioPlaying(false);
    }
  };

  const path = location.pathname;
  const L = (ar: string, fr: string, en: string) => (isAr ? ar : isEn ? en : fr);
  
  const NAV_ITEMS = [
    { to: '/', icon: Layers, mode: 'farmer', label: L('الرئيسية والمحاصيل', 'Accueil & Parcelle', 'Home & Field') },
    { to: '/recommendation', icon: TrendingUp, mode: 'farmer', label: L('توصية المحصول', 'Recommandation', 'Crop Recommendation') },
    { to: '/planner', icon: Sparkles, mode: 'farmer', label: L('مخطط التناوب', 'Plan de rotation', 'Rotation Plan') },
    { to: '/crops', icon: Sprout, mode: 'farmer', label: L('موسوعة المحاصيل', 'Guide des Cultures', 'Crop Guide') },
    { to: '/farms', icon: BookmarkPlus, mode: 'farmer', label: L('ضيعاتي ومخططاتي', 'Mes Parcelles & Plans', 'My Farms & Plans') },
    { to: '/reports', icon: FileText, mode: 'farmer', label: L('تقرير اتخاذ القرار (PDF)', 'Rapport Décisionnel', 'Decision Report (PDF)') },
    { to: '/advisor', icon: Mic, mode: 'farmer', label: L('المرشد الصوتي (عمي أحمد)', 'Conseiller Vocal', 'Voice Advisor') },
    { to: '/nasa', icon: Sun, mode: 'expert', label: L('مرصد ناسا المناخي', 'Données NASA (Climat)', 'NASA Earth Data') },
    { to: '/weather', icon: ThermometerSun, mode: 'expert', label: L('المؤشرات الزراعية المناخية', 'Indicateurs agro-climatiques', 'Agro-climatic Indicators') },
    { to: '/soil', icon: Compass, mode: 'expert', label: L('مرصد التربة', 'Pédologie & Sols', 'Soil Intelligence') },
    { to: '/simulator', icon: Sliders, mode: 'expert', label: L('محاكي «ماذا لو؟»', 'Simulateur « Et si ? »', 'What-If Simulator') },
    { to: '/sources', icon: Database, mode: 'expert', label: L('سجل بيانات ناسا', 'Registre NASA', 'NASA Data Sources') },
  ];

  return (
    <AppContext.Provider value={{ t, lang, setLang, user, logout }}>
      <div className={`min-h-screen bg-[#F4EFE6] text-[#2C2416] antialiased ${isAr ? 'font-arabic' : 'font-sans'}`} dir={isAr ? 'rtl' : 'ltr'}>
        {/* ─── 2. INTRO AVEC LA BONNE LANGUE ─── */}
        {showIntro && (
          <Intro
            lang={lang}
            onDone={() => {
              try { sessionStorage.setItem('terrarota_intro_seen', '1'); } catch { /* ignore */ }
              setShowIntro(false);
            }}
          />
        )}
        <div className="flex flex-col lg:flex-row min-h-screen">
          
          {/* ─── SIDEBAR OVERLAY ─── */}
          {isSidebarOpen && (
            <div 
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity"
            />
          )}

          {/* ─── SIDEBAR ─── */}
          <aside className={`
            fixed inset-y-0 ${isAr ? 'right-0' : 'left-0'} z-50
            w-72 bg-[#EFE9DC] border-x border-[#DECAB3] 
            flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out shadow-2xl
            ${isSidebarOpen ? 'translate-x-0' : (isAr ? 'translate-x-full' : '-translate-x-full')}
          `}>
            <div>
              <div className="p-6 border-b border-[#DECAB3]/70 flex items-center justify-between">
                <Link to="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#2D4A27] flex items-center justify-center text-[#F4EFE6] shadow-md">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#1E331A]">Terrarota</h1>
                    <p className="text-xs text-[#7A6B53] font-semibold">
                      {isAr ? 'بوابة الفلاح الذكي' : isEn ? 'Smart Farming Platform' : 'Portail Agricole Intelligent'}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl text-[#7A6B53] hover:text-[#1E331A] hover:bg-[#E4DCCB] transition-colors cursor-pointer"
                  title={L('إغلاق القائمة', 'Fermer le menu', 'Close menu')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mx-4 mt-5 p-3 rounded-2xl bg-[#E4DCCB] border border-[#D5C4AC] flex items-center gap-2.5 text-xs text-[#524430]">
                <ShieldCheck className="w-4 h-4 text-[#2D4A27] shrink-0" />
                <div>
                  <div className="font-bold">{isAr ? 'التعاونية الفلاحية' : isEn ? 'Agricultural Cooperative' : 'Coopérative Agricole'}</div>
                  <div className="text-[11px] text-[#7A6B53]">{isAr ? 'شبكة الفلاحين بالمغرب' : isEn ? 'Morocco Farmers Network' : 'Réseau Agricole Marocain'}</div>
                </div>
              </div>

              <nav className="p-3 space-y-1">
                {NAV_ITEMS.filter((i) => i.mode === mode).map(({ to, icon: Icon, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      path === to ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>

              {user && (
                <div className="px-4">
                  <button
                    onClick={() => setIsParcelsOpen(true)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#E4DCCB] hover:bg-[#DDD3C0] text-xs font-bold text-[#2D4A27] transition-all cursor-pointer border border-[#D5C4AC]"
                  >
                    <span className="flex items-center gap-2">
                      <BookmarkPlus className="w-4 h-4 text-[#8C3A27]" />
                      <span>{isAr ? 'أراضيي المحفوظة' : isEn ? 'My Saved Fields' : 'Mes Parcelles'}</span>
                    </span>
                    <span className="text-[10px] bg-[#2D4A27] text-white px-2 py-0.5 rounded-full">✓</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#DECAB3]/70 space-y-3">
              <div 
                onClick={speakCurrentAdvice}
                className="p-3 bg-[#E7DFCF] hover:bg-[#E0D7C5] rounded-xl flex items-center justify-between text-xs text-[#524430] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#8C3A27]" />
                  <span className="font-bold">{L('إرشاد فلاحي بالصوت', 'Guide audio', 'Audio Guide')}</span>
                </div>
                <span className="text-[10px] bg-[#2D4A27] text-white px-2 py-0.5 rounded-full font-bold">
                  {L('عمي أحمد', 'Ami Ahmed', 'Ami Ahmed')}
                </span>
              </div>

              <div className="text-[11px] text-center text-[#8C7A60] font-semibold">
                {isAr ? 'المملكة المغربية • تحدي ناسا 2026' : isEn ? 'Kingdom of Morocco • NASA Space Apps' : 'Royaume du Maroc • NASA Space Apps'}
              </div>
            </div>
          </aside>

          {/* ─── MAIN CONTENT ─── */}
          <main className="flex-1 overflow-y-auto">
            <header className="px-4 sm:px-6 py-4 bg-[#FAF7F2] border-b border-[#DECAB3] flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-xl bg-[#EFE9DC] hover:bg-[#E4DCCB] text-[#1E331A] border border-[#DECAB3] transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold shadow-xs"
                  title={L('فتح / إغلاق القائمة', 'Ouvrir / Fermer le menu', 'Open / Close menu')}
                >
                  {isSidebarOpen ? <X className="w-4 h-4 text-[#8C3A27]" /> : <Menu className="w-4 h-4 text-[#2D4A27]" />}
                  <span className="hidden sm:inline">{isSidebarOpen ? L('إغلاق', 'Fermer', 'Close') : L('القائمة', 'Menu', 'Menu')}</span>
                </button>

                <div className="flex items-center gap-2 bg-[#EFE9DC] px-3.5 py-1.5 rounded-full border border-[#D5C4AC] text-xs font-bold text-[#3B3020]">
                  <MapPin className="w-3.5 h-3.5 text-[#8C3A27]" />
                  {customLat !== undefined && customLon !== undefined ? (
                    <span className="text-xs font-bold text-[#1E331A]">
                      {isAr ? `موقع مخصص (${customLat.toFixed(2)}°, ${customLon.toFixed(2)}°)` : isEn ? `Custom (${customLat.toFixed(2)}°, ${customLon.toFixed(2)}°)` : `Position (${customLat.toFixed(2)}°, ${customLon.toFixed(2)}°)`}
                    </span>
                  ) : (
                    <select 
                      value={selectedRegionIndex}
                      onChange={(e) => {
                        setSelectedRegionIndex(Number(e.target.value));
                        setCustomLat(undefined);
                        setCustomLon(undefined);
                      }}
                      className="bg-transparent border-none outline-none cursor-pointer text-xs font-bold text-[#3B3020]"
                    >
                      {REGIONS.map((r, i) => (
                        <option key={r.name_fr} value={i}>{getRegionName(r)}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-[#EFE9DC] px-3 py-1.5 rounded-full border border-[#D5C4AC] text-[11px] text-[#61513C] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{apiResponse?.data_status === 'live' ? (isAr ? 'متصل بأقمار ناسا مباشرة' : isEn ? 'NASA Live Connection' : 'NASA Direct Live') : (isAr ? 'بيانات ناسا المناخية' : isEn ? 'NASA Climate Data' : 'NASA POWER Connecté')}</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedRegionIndex(3);
                    setPreviousCrop('wheat_hard');
                    setWaterAccess('rainfed');
                    setSoilType('clay_loam');
                    setFieldSize('5.5');
                    triggerAnalysis(33.0, -7.6);
                  }}
                  className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer"
                  title={L('تحميل الضيعة التجريبية', 'Charger la ferme pilote pour la démonstration', 'Load the demo pilot farm')}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>{L('عرض توضيحي للمحكمين ⭐', 'Mode Démo (Chaouia) ⭐', 'Demo Mode (Chaouia) ⭐')}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (mode === 'farmer') { setMode('expert'); navigate('/nasa'); }
                    else { setMode('farmer'); navigate('/'); }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    mode === 'expert'
                      ? 'bg-[#1E331A] text-white border-[#1E331A]'
                      : 'bg-[#EFE9DC] text-[#2D4A27] border-[#D5C4AC] hover:bg-[#E5DDCF]'
                  }`}
                >
                  {mode === 'expert' ? <Sprout className="w-3.5 h-3.5" /> : <Microscope className="w-3.5 h-3.5" />}
                  <span>{mode === 'expert' ? L('وضع الفلاح', 'Mode agriculteur', 'Farmer mode') : L('وضع الخبير', 'Mode expert', 'Expert mode')}</span>
                </button>

                <div className="flex items-center bg-[#EFE9DC] border border-[#D5C4AC] rounded-full p-0.5 text-xs font-bold text-[#4D3F2C]">
                  <button
                    onClick={() => setLang('ar')}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${lang === 'ar' ? 'bg-[#2D4A27] text-white shadow-xs' : 'hover:bg-[#E5DDCF]'}`}
                  >
                    عربي
                  </button>
                  <button
                    onClick={() => setLang('fr')}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${lang === 'fr' ? 'bg-[#2D4A27] text-white shadow-xs' : 'hover:bg-[#E5DDCF]'}`}
                  >
                    FR
                  </button>
                  <button
                    onClick={() => setLang('en')}
                    className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${lang === 'en' ? 'bg-[#2D4A27] text-white shadow-xs' : 'hover:bg-[#E5DDCF]'}`}
                  >
                    EN
                  </button>
                </div>

                {user ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsParcelsOpen(true)}
                      className="px-3 py-1.5 rounded-full bg-[#2D4A27] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{user.username}</span>
                    </button>
                    <button onClick={logout} className="text-xs text-[#8C3A27] font-bold hover:underline cursor-pointer">
                      {isAr ? 'خروج' : isEn ? 'Logout' : 'Déconnexion'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2D4A27] text-white text-xs font-bold shadow-xs hover:bg-[#1E331A] transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{isAr ? 'دخول / تسجيل' : isEn ? 'Login / Register' : 'Connexion'}</span>
                  </button>
                )}
              </div>
            </header>

            {saveSuccessMsg && (
              <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-700 text-white flex items-center justify-between text-xs font-bold shadow-md animate-in slide-in-from-top">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saveSuccessMsg}</span>
                </span>
                <button onClick={() => setSaveSuccessMsg(null)} className="cursor-pointer">✕</button>
              </div>
            )}

            <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
              <Routes>
                {/* ─── ROUTE 1: "/" ─── */}
                <Route path="/" element={
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-3xl border border-[#DECAB3] shadow-xs flex items-center justify-between gap-2 max-w-3xl mx-auto">
                      <button
                        onClick={() => setStep(1)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          step === 1 ? 'bg-[#2D4A27] text-white shadow-sm' : 'bg-[#EFE9DC] text-[#61513C]'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
                        <span>{isAr ? 'تحديد الأرض' : isEn ? '1. Field' : '1. Parcelle'}</span>
                      </button>

                      <span className="text-[#DECAB3] font-bold">←</span>

                      <button
                        onClick={() => setStep(2)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          step === 2 ? 'bg-[#2D4A27] text-white shadow-sm' : 'bg-[#EFE9DC] text-[#61513C]'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>
                        <span>{isAr ? 'الزرعة الفايتة' : isEn ? '2. Previous Crop' : '2. Précédent'}</span>
                      </button>

                      <span className="text-[#DECAB3] font-bold">←</span>

                      <button
                        onClick={() => { setStep(3); navigate('/recommendation'); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          step === 3 ? 'bg-[#8C3A27] text-white shadow-sm' : 'bg-[#EFE9DC] text-[#61513C]'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">3</span>
                        <span>{isAr ? 'النتيجة المباشرة' : isEn ? '3. Recommendation' : '3. Résultat'}</span>
                      </button>
                    </div>

                    {step === 1 && (
                      <div className="space-y-6">
                        <div className="p-8 rounded-3xl bg-[#2D4A27] text-white shadow-md text-center space-y-4">
                          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-emerald-300 mx-auto">
                            <Compass className="w-8 h-8 animate-pulse" />
                          </div>
                          <div>
                            <h2 className="text-2xl sm:text-3xl font-black">
                              {isAr ? 'أين توجد أرضك الفلاحية؟' : isEn ? 'Where is your agricultural field located?' : 'Où se situe votre terrain agricole ?'}
                            </h2>
                            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-lg mx-auto">
                              {isAr 
                                ? 'اضغط أسفله لتحديد موقعك تلقائياً بالقمر الاصطناعي بنقرة واحدة، أو اختر إقليمك من القائمة.'
                                : isEn
                                ? 'Click below to detect your field location automatically via satellite GPS, or select your region.'
                                : 'Cliquez ci-dessous pour localiser automatiquement votre parcelle par GPS ou choisissez votre région.'}
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <button
                              onClick={handleAutomaticGPS}
                              className="w-full sm:w-auto px-8 py-4 bg-[#8C3A27] hover:bg-[#732F1F] text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all cursor-pointer"
                            >
                              <Zap className="w-5 h-5 text-amber-300" />
                              <span>{isAr ? 'تحديد موقع حقلي الحالي تلقائياً (GPS)' : isEn ? 'Locate My Field in 1-Click (GPS)' : 'Localiser mon champ en 1 clic'}</span>
                            </button>

                            <button
                              onClick={() => setStep(2)}
                              className="w-full sm:w-auto px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                              <span>
                                {customLat !== undefined && customLon !== undefined 
                                  ? (isAr ? `متابعة بموقع مخصص (${customLat.toFixed(2)}°, ${customLon.toFixed(2)}°)` : isEn ? `Custom Location (${customLat.toFixed(2)}°, ${customLon.toFixed(2)}°)` : `Position personnalisée (${customLat.toFixed(2)}°, ${customLon.toFixed(2)}°)`)
                                  : (isAr ? 'أنا في ' + currentRegion.name_ar : isEn ? 'Continue with ' + currentRegion.name_en : 'Continuer avec ' + currentRegion.name_fr)}
                              </span>
                              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-[#7A6B53] mb-3">
                            {isAr ? 'أو اختر منطقتك الفلاحية مباشرة:' : isEn ? 'Or select your agricultural region directly:' : 'Ou sélectionnez votre région :'}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {REGIONS.map((r, i) => (
                              <button
                                key={r.name_fr}
                                onClick={() => {
                                  setSelectedRegionIndex(i);
                                  setCustomLat(undefined);
                                  setCustomLon(undefined);
                                  setStep(2);
                                }}
                                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                                  selectedRegionIndex === i 
                                    ? 'bg-[#FAF7F2] border-[#2D4A27] shadow-sm ring-2 ring-[#2D4A27]/20' 
                                    : 'bg-[#EFE9DC] border-[#DECAB3] hover:bg-[#E5DDCF]'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-extrabold text-sm text-[#1E331A]">{getRegionName(r)}</span>
                                  <MapPin className="w-4 h-4 text-[#8C3A27]" />
                                </div>
                                <p className="text-[11px] text-[#7A6B53]">{getRegionDesc(r)}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <h3 className="text-sm font-bold text-[#7A6B53]">
                            {isAr ? 'أو حدد إحداثيات حقلك على خريطة المغرب التفاعلية :' : isEn ? 'Or select field location on the interactive Morocco map :' : 'Ou cliquez sur la carte interactive du Maroc :'}
                          </h3>
                          <FarmMap
                            regions={REGIONS}
                            selectedRegionIndex={selectedRegionIndex}
                            onSelectRegion={(idx) => {
                              setSelectedRegionIndex(idx);
                              setCustomLat(undefined);
                              setCustomLon(undefined);
                            }}
                            customLat={customLat}
                            customLon={customLon}
                            onSelectCoords={(cLat, cLon) => {
                              setCustomLat(cLat);
                              setCustomLon(cLon);
                              triggerAnalysis(cLat, cLon);
                            }}
                            lang={lang}
                          />
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl border border-[#DECAB3] shadow-sm space-y-6">
                          <div>
                            <div className="text-xs font-bold text-[#8C3A27]">{isAr ? 'الخطوة الثانية • الدورة الزراعية' : isEn ? 'Step 2 • Crop Rotation' : 'Étape 2 • Rotation'}</div>
                            <h2 className="text-2xl font-black text-[#1E331A] mt-1">
                              {isAr ? 'شنو كنتي زارع فـ هاد الأرض الموسم الفايت؟' : isEn ? 'What did you cultivate last season?' : 'Qu\'avez-vous cultivé la saison dernière ?'}
                            </h2>
                            <p className="text-xs text-[#7A6B53] mt-1">
                              {isAr 
                                ? 'باش خوارزمية ناسا تعرف شنو خاص الأرض من نيتروجين وخصوبة وما تنهكش التربة.' 
                                : isEn 
                                ? 'To calculate soil nutrient rotation, nitrogen fixation, and prevent soil depletion.'
                                : 'Pour adapter la rotation des nutriments et reposer le sol.'}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { id: 'wheat_hard', name_ar: 'القمح الصلب 🌾', name_fr: 'Blé Dur 🌾', name_en: 'Durum Wheat 🌾' },
                              { id: 'wheat_soft', name_ar: 'القمح الطري 🍞', name_fr: 'Blé Tendre 🍞', name_en: 'Soft Wheat 🍞' },
                              { id: 'barley', name_ar: 'الشعير 🌾', name_fr: 'Orge 🌾', name_en: 'Barley 🌾' },
                              { id: 'chickpea', name_ar: 'الحمص / قطاني 🫘', name_fr: 'Pois chiche 🫘', name_en: 'Chickpea / Legumes 🫘' },
                              { id: 'potato', name_ar: 'البطاطس 🥔', name_fr: 'Pomme de terre 🥔', name_en: 'Potato 🥔' },
                              { id: 'fallow', name_ar: 'أرض مريحة (بور) 🌿', name_fr: 'Jachère 🌿', name_en: 'Fallow land 🌿' },
                            ].map((c) => (
                              <button
                                key={c.id}
                                onClick={() => setPreviousCrop(c.id as CropId)}
                                className={`p-4 rounded-2xl border text-center font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                                  previousCrop === c.id 
                                    ? 'bg-[#2D4A27] text-white shadow-md border-[#2D4A27]' 
                                    : 'bg-[#EFE9DC] text-[#4D3F2C] border-[#DECAB3] hover:bg-[#E5DDCF]'
                                }`}
                              >
                                {isAr ? c.name_ar : isEn ? c.name_en : c.name_fr}
                              </button>
                            ))}
                          </div>

                          <div className="pt-4 border-t border-[#DECAB3]">
                            <label className="block text-xs font-bold text-[#1E331A] mb-2">
                              {isAr ? 'واش عندك السقي ولا معول غير على الشتا؟' : isEn ? 'Water availability / Irrigation access:' : 'Disponibilité de l\'eau :'}
                            </label>
                            <div className="grid grid-cols-2 gap-3 max-w-md">
                              <button
                                onClick={() => setWaterAccess('rainfed')}
                                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  waterAccess === 'rainfed'
                                    ? 'bg-[#8C3A27] text-white border-[#8C3A27] shadow-sm'
                                    : 'bg-[#EFE9DC] text-[#4D3F2C] border-[#DECAB3]'
                                }`}
                              >
                                {isAr ? '🌧️ بور (مياه الشتاء فقط)' : isEn ? '🌧️ Rainfed (Rain only)' : '🌧️ Pluvial seul'}
                              </button>
                              <button
                                onClick={() => setWaterAccess('irrigated')}
                                className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  waterAccess === 'irrigated'
                                    ? 'bg-[#2D4A27] text-white border-[#2D4A27] shadow-sm'
                                    : 'bg-[#EFE9DC] text-[#4D3F2C] border-[#DECAB3]'
                                }`}
                              >
                                {isAr ? '💧 مسقي (بئر / كوت-آ-كوت)' : isEn ? '💧 Irrigated (Well / Drip)' : '💧 Irrigué / Puits'}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4">
                            <button
                              onClick={() => setStep(1)}
                              className="px-5 py-3 rounded-xl bg-[#EFE9DC] text-[#61513C] font-bold text-xs hover:bg-[#E5DDCF] cursor-pointer"
                            >
                              {isAr ? 'رجوع لتحديد الأرض' : isEn ? 'Back to Location' : 'Retour'}
                            </button>

                            <button
                              onClick={() => {
                                setStep(3);
                                navigate('/recommendation');
                              }}
                              className="px-8 py-3.5 rounded-2xl bg-[#2D4A27] hover:bg-[#1E331A] text-white font-extrabold text-sm flex items-center gap-2 shadow-md cursor-pointer"
                            >
                              <span>{isAr ? 'أرني الزرعة الأنسب لأرضي دابا' : isEn ? 'View My Crop Recommendation' : 'Voir ma recommandation'}</span>
                              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <h3 className="text-sm font-bold text-[#7A6B53]">
                            {isAr ? 'أو حدد إحداثيات حقلك على خريطة المغرب التفاعلية :' : isEn ? 'Or select field location on the interactive Morocco map :' : 'Ou cliquez sur la carte interactive du Maroc :'}
                          </h3>
                          <FarmMap
                            regions={REGIONS}
                            selectedRegionIndex={selectedRegionIndex}
                            onSelectRegion={(idx) => {
                              setSelectedRegionIndex(idx);
                              setCustomLat(undefined);
                              setCustomLon(undefined);
                            }}
                            customLat={customLat}
                            customLon={customLon}
                            onSelectCoords={(cLat, cLon) => {
                              setCustomLat(cLat);
                              setCustomLon(cLon);
                              triggerAnalysis(cLat, cLon);
                            }}
                            lang={lang}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                } />

                {/* ─── ROUTE 2: "/recommendation" ─── */}
                <Route path="/recommendation" element={
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#8C3A27]">{isAr ? 'النتيجة الفلاحية المباشرة' : isEn ? 'Agricultural Recommendation' : 'Résultat Agronomique'}</div>
                        <h3 className="text-2xl font-black text-[#1E331A]">
                          {isAr ? `المحاصيل الأنسب لـ ${activeRegionName}` : isEn ? `Recommended Crops for ${activeRegionName}` : `Cultures recommandées pour ${activeRegionName}`}
                        </h3>
                        <p className="text-xs text-[#7A6B53]">
                          {L(
                            `بناءً على أمطار ناسا (${annualRain} ملم) ومحصولك السابق (${prevCropLabel})`,
                            `Basé sur les données NASA (${annualRain} mm) et votre précédent cultural (${prevCropLabel}).`,
                            `Based on NASA rainfall (${annualRain} mm) and your previous crop (${prevCropLabel}).`
                          )}
                        </p>
                      </div>

                      {recommendations.length > 1 && !loading && (
                        <div className="flex items-center gap-1.5 bg-[#EFE9DC] p-1 rounded-2xl border border-[#DECAB3]">
                          {recommendations.slice(0, 4).map((rec, idx) => (
                            <button
                              key={rec.crop_id}
                              onClick={() => setSelectedCropIndex(idx)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                selectedCropIndex === idx ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#61513C] hover:bg-[#E5DDCF]'
                              }`}
                            >
                              #{idx + 1} {isAr ? rec.crop_name_ar : isEn ? (rec.crop_name_en || rec.crop_name_fr) : rec.crop_name_fr}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {loading ? (
                      <div className="p-12 bg-[#FAF7F2] rounded-3xl border border-[#DECAB3] text-center space-y-4 shadow-sm animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-[#2D4A27]/10 text-[#2D4A27] flex items-center justify-center mx-auto">
                          <RefreshCw className="w-8 h-8 animate-spin text-[#8C3A27]" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-[#1E331A]">
                            {L('جاري تحليل إحداثيات الحقل عبر أقمار ناسا...', 'Traitement des observations NASA POWER en cours...', 'Processing NASA POWER observations...')}
                          </h4>
                          <p className="text-xs text-[#7A6B53] mt-1">
                            {L(
                              `فحص سجل 5 سنوات من التساقطات والحرارة التراكمية لموقع ${currentRegion.name_ar}...`,
                              `Calcul du bilan hydrique et de la rotation des sols pour ${currentRegion.name_fr}...`,
                              `Computing water balance and crop rotation for ${currentRegion.name_en}...`
                            )}
                          </p>
                        </div>
                      </div>
                    ) : activeRecommendation ? (
                      <div className="bg-[#FAF7F2] rounded-3xl border-2 border-[#2D4A27] p-6 sm:p-8 shadow-md relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                          <div className="md:col-span-7 space-y-4">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-xs font-extrabold px-3.5 py-1 bg-[#8C3A27] text-white rounded-full">
                                {selectedCropIndex === 0 ? (isAr ? 'الخيار الأكمل لموقعك' : isEn ? '#1 Recommended Crop' : 'Choix N°1') : (isAr ? `البديل رقم #${selectedCropIndex + 1}` : isEn ? `Alternative #${selectedCropIndex + 1}` : `Alternative #${selectedCropIndex + 1}`)}
                              </span>
                              <span className="text-xs font-bold text-[#2D4A27] bg-[#EAF2E8] px-3 py-1 rounded-full flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isAr ? `تطابق بنسبة ${activeRecommendation.score}%` : isEn ? `Affinity Score: ${activeRecommendation.score}%` : `Score d'affinité : ${activeRecommendation.score}%`}</span>
                              </span>
                            </div>

                            <div>
                              <h4 className="text-3xl sm:text-4xl font-black text-[#1E331A]">
                                {isAr ? activeRecommendation.crop_name_ar : isEn ? (activeRecommendation.crop_name_en || activeRecommendation.crop_name_fr) : activeRecommendation.crop_name_fr}
                              </h4>
                               <p className="text-xs font-bold text-[#7A6B53] mt-1">
                               {isAr 
                                ? `الفئة: ${translateCategory(activeRecommendation.crop_category)} • المساحة: ${fieldSize} هكتار` 
                                : isEn 
                                ? `Category: ${translateCategory(activeRecommendation.crop_category)} • Field Area: ${fieldSize} Ha` 
                                : `Catégorie : ${translateCategory(activeRecommendation.crop_category)} • Surface : ${fieldSize} Ha`}
                                 </p>
                            </div>

                            <div className="space-y-2">
                              {((isEn && activeRecommendation.reasons_en) ? activeRecommendation.reasons_en : (lang === 'fr' && activeRecommendation.reasons_fr) ? activeRecommendation.reasons_fr : activeRecommendation.reasons).map((r, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[#4D3F2C]">
                                  <CheckCircle2 className="w-4 h-4 text-[#2D4A27] shrink-0 mt-0.5" />
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>

                            {mode === 'expert' && activeRecommendation.evidences && activeRecommendation.evidences.length > 0 && (
                              <div className="p-4 bg-[#EFE9DC] rounded-2xl border border-[#DECAB3] space-y-2.5">
                                <div className="text-xs font-black text-[#1E331A] flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-[#2D4A27]" />
                                  <span>{isAr ? 'الأدلة العلمية والمراجع المعتمدة (INRA / FAO / NASA)' : isEn ? 'Scientific Evidence & Agronomic Citations (INRA / FAO / NASA)' : 'Preuves Scientifiques & Références Agronomiques'}</span>
                                </div>
                                <div className="space-y-2">
                                  {activeRecommendation.evidences.map((ev, i) => (
                                    <div key={i} className="text-xs bg-white/70 p-2.5 rounded-xl border border-[#D5C4AC]/60 space-y-1">
                                      <div className="flex items-center justify-between font-bold text-[#8C3A27]">
                                        <span>📊 {ev.parameter}: {ev.value}</span>
                                        <span className="text-[10px] text-[#2D4A27] bg-[#EAF2E8] px-2 py-0.5 rounded-full">
                                          {isAr ? 'موثق' : isEn ? 'Validated' : 'Validé'}
                                        </span>
                                      </div>
                                      <p className="text-[#3B3020] text-[11px] leading-relaxed">
                                        🔬 {isEn && ev.scientific_rule_en ? ev.scientific_rule_en : lang === 'fr' && ev.scientific_rule_fr ? ev.scientific_rule_fr : ev.scientific_rule}
                                      </p>
                                      <div className="text-[10px] text-[#7A6B53] font-semibold pt-0.5">
                                        📚 {isAr ? 'المرجع العلمي:' : isEn ? 'Scientific Source:' : 'Source:'} {ev.source}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {mode === 'expert' && (
                              <Link
                                to="/simulator"
                                className="flex items-center justify-between p-4 bg-[#F4EFE6] rounded-2xl border-2 border-[#2D4A27]/20 text-xs font-black text-[#1E331A] hover:bg-[#EFE9DC]"
                              >
                                <span className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-[#8C3A27]" />
                                  {L('افتح محاكي «ماذا لو؟»', 'Ouvrir le simulateur « Et si ? »', 'Open the What-If simulator')}
                                </span>
                                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                              </Link>
                            )}

                            {activeRecommendation.cautions && activeRecommendation.cautions.length > 0 && (
                              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                                <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                                  <span>{isAr ? 'تنبيهات واحتياطات زراعية مهمة' : isEn ? 'Important Agronomic Cautions' : 'Mises en garde agronomiques'}</span>
                                </div>
                                {((isEn && activeRecommendation.cautions_en) ? activeRecommendation.cautions_en : (lang === 'fr' && activeRecommendation.cautions_fr) ? activeRecommendation.cautions_fr : activeRecommendation.cautions).map((c, i) => (
                                  <p key={i} className="text-xs text-amber-800">• {c}</p>
                                ))}
                              </div>
                            )}

                            <div className="pt-2 flex flex-wrap items-center gap-4">
                              <button 
                                onClick={handleSaveParcel}
                                className="px-6 py-3.5 bg-[#8C3A27] hover:bg-[#752D1D] text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isAr ? 'تثبيت هذا المحصول وتطبيق خطة الزراعة' : isEn ? 'Adopt This Crop & Save Farm Plan' : 'Valider cette culture pour la saison'}</span>
                              </button>

                              <button
                                onClick={speakCurrentAdvice}
                                className="px-4 py-3 bg-[#EFE9DC] hover:bg-[#E5DDCF] border border-[#DECAB3] text-[#2D4A27] rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer"
                              >
                                <Volume2 className="w-4 h-4 text-[#8C3A27]" />
                                <span>{isAr ? 'استمع للشرح بالصوت' : isEn ? 'Listen to Audio Advice' : 'Écouter le détail'}</span>
                              </button>
                            </div>
                          </div>

                          <div className="md:col-span-5 relative rounded-3xl overflow-hidden shadow-lg h-64 md:h-80 border border-[#D5C4AC]">
                            <img 
                              src={CROP_IMAGES[activeRecommendation.crop_id] || CROP_IMAGES.barley} 
                              alt={activeRecommendation.crop_name_fr}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 start-4 bg-[#2D4A27]/90 backdrop-blur-md text-white text-xs font-black px-3.5 py-1.5 rounded-full shadow-md">
                              {isAr ? `مطابق بنسبة ${activeRecommendation.score}%` : isEn ? `Match ${activeRecommendation.score}%` : `Score ${activeRecommendation.score}%`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 bg-[#FAF7F2] rounded-3xl border border-[#DECAB3] text-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#8C3A27] mx-auto mb-2" />
                        <p className="text-xs font-bold text-[#61513C]">{L('جاري استرجاع معطيات ناسا...', 'Calcul des recommandations...', 'Computing recommendations...')}</p>
                      </div>
                    )}

                    <div className="pt-4 flex justify-between gap-3 flex-wrap">
                      <button
                        onClick={() => { setStep(2); navigate('/'); }}
                        className="px-6 py-3.5 bg-[#EFE9DC] hover:bg-[#E5DDCF] border border-[#DECAB3] text-[#2D4A27] rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer"
                      >
                        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        <span>{L('تغيير معطيات الحقل', 'Modifier la parcelle', 'Edit field details')}</span>
                      </button>

                      <button
                        onClick={() => { setMode('expert'); navigate('/weather'); }}
                        className="px-6 py-3.5 bg-[#2D4A27] hover:bg-[#1E331A] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Microscope className="w-4 h-4" />
                        <span>
                          {mode === 'farmer'
                            ? L('تفاصيل تقنية للمختصين', 'Détails techniques (spécialistes)', 'Technical details (specialists)')
                            : L('المؤشرات المناخية', 'Indicateurs climatiques', 'Climate indicators')}
                        </span>
                      </button>
                    </div>
                  </div>
                } />

                {/* ─── ROUTE 3: "/weather" ─── */}
                <Route path="/weather" element={
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-[#8C3A27] flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5" />
                          <span>{L('بيانات الأرصاد الفضائية الحقيقية • NASA POWER AG', 'Données satellites réelles • NASA POWER AG', 'Real satellite data • NASA POWER AG')}</span>
                        </div>
                        <h3 className="text-2xl font-black text-[#1E331A]">
                          {L(`المؤشرات المناخية لـ ${activeRegionName}`, `Indicateurs agro-climatiques : ${activeRegionName}`, `Agro-climatic indicators: ${activeRegionName}`)}
                        </h3>
                        <p className="text-xs text-[#7A6B53] mt-0.5">
                          {L(
                            `إحداثيات الرصد: ${activeLat.toFixed(2)}°N • ${activeLon.toFixed(2)}° • دقة الاستشعار 0.5°`,
                            `Coordonnées : ${activeLat.toFixed(2)}°N, ${activeLon.toFixed(2)}° • Résolution spatiale : 0.5°`,
                            `Coordinates: ${activeLat.toFixed(2)}°N, ${activeLon.toFixed(2)}° • Spatial resolution: 0.5°`
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#DECAB3] shadow-xs">
                        <span className={`w-3 h-3 rounded-full ${apiResponse?.data_status === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                        <div className="text-start">
                          <div className="text-[10px] font-black uppercase text-[#2D4A27]">
                            {apiResponse?.data_status === 'live'
                              ? L('بيانات ناسا مباشرة (LIVE)', 'NASA DIRECT LIVE', 'NASA LIVE DATA')
                              : L('مسترجع من الكاش (CACHED)', 'CACHE NASA ACTIF', 'NASA CACHED DATA')}
                          </div>
                          <div className="text-[10px] text-[#7A6B53]">
                            {apiResponse?.provenance?.period ? `${apiResponse.provenance.period.start.slice(0, 4)} - ${apiResponse.provenance.period.end.slice(0, 4)}` : L('2021 - 2025 (5 سنوات)', '2021 - 2025 (5 ans)', '2021 - 2025 (5 years)')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {[
                        {
                          icon: CloudRain, iconCls: 'text-sky-600', code: 'PRECTOTCORR',
                          title: L('التساقطات السنوية التراكمية', 'Précipitations annuelles', 'Annual precipitation'),
                          value: String(indicators?.annual_rain_mm ?? annualRain),
                          unit: L('ملم/سنة', 'mm/an', 'mm/yr'),
                          note: indicators?.annual_rain_mm && indicators.annual_rain_mm > 400
                            ? L('أمطار ملائمة للحبوب والقطاني بورية', 'Pluviosité favorable aux céréales', 'Rainfall favorable to cereals')
                            : L('منطقة نصف جافة تتطلب سقي تكميلي', "Zone semi-aride, appoint d'eau recommandé", 'Semi-arid zone, supplemental water recommended'),
                          footLabel: L('مؤشر الجفاف (UNEP)', "Indice d'aridité UNEP", 'UNEP aridity index'),
                          footValue: indicators?.aridity_index ? indicators.aridity_index.toFixed(3) : '—',
                        },
                        {
                          icon: Sun, iconCls: 'text-amber-600', code: 'T2M',
                          title: L('معدل الحرارة السنوي (2 متر)', 'Température moyenne (2 m)', 'Mean temperature (2 m)'),
                          value: indicators?.mean_annual_temp_c !== undefined ? indicators.mean_annual_temp_c.toFixed(1) : String(avgTemp),
                          unit: '°C',
                          note: indicators?.mean_annual_temp_c && indicators.mean_annual_temp_c >= 22
                            ? L('طقس دافئ إلى حار ملائم للأشجار المقاومة', "Climat chaud propice à l'argan et l'olivier", 'Warm climate suited to argan and olive')
                            : L('مناخ معتدل مناسب للنضج الخضري', 'Climat tempéré favorable', 'Mild climate, favorable to crop growth'),
                          footLabel: L('الحرارة التراكمية', 'Degrés-jours de croissance', 'Growing degree days'),
                          footValue: indicators?.gdd_base10 ? `${Math.round(indicators.gdd_base10)} GDD` : '—',
                        },
                        {
                          icon: Snowflake, iconCls: 'text-cyan-600', code: 'T2M_MIN < 0°C',
                          title: L('أيام الصقيع السنوي', 'Risque de gel annuel', 'Annual frost risk'),
                          value: String(indicators?.frost_days_per_year ?? 0),
                          unit: L('أيام/سنة', 'j/an', 'days/yr'),
                          note: (indicators?.frost_days_per_year || 0) <= 2
                            ? L('خطر الصقيع منعدم أو ضئيل جداً', 'Risque de gel minime ou nul', 'Minimal or no frost risk')
                            : L('انتباه من موجات البرد الشتوية', 'Attention au froid hivernal', 'Beware of winter cold spells'),
                          footLabel: L('أشهر الجفاف (<30 ملم)', 'Mois secs (<30 mm)', 'Dry months (<30 mm)'),
                          footValue: indicators?.dry_months !== undefined ? `${indicators.dry_months} ${L('أشهر/سنة', 'mois/an', 'months/yr')}` : '—',
                        },
                      ].map((c, i) => {
                        const Icon = c.icon;
                        return (
                          <div key={i} className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#DECAB3] flex flex-col justify-between shadow-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#7A6B53] flex items-center gap-1.5">
                                <Icon className={`w-4 h-4 ${c.iconCls}`} />
                                <span>{c.title}</span>
                              </span>
                              <span className="text-[10px] font-mono text-[#8C7A60] bg-[#EFE9DC] px-2 py-0.5 rounded-full">{c.code}</span>
                            </div>
                            <div className="my-4">
                              <div className="text-4xl font-black text-[#1E331A]">
                                {c.value} <span className="text-lg font-bold text-[#7A6B53]">{c.unit}</span>
                              </div>
                              <p className="text-[11px] text-[#7A6B53] mt-1">{c.note}</p>
                            </div>
                            <div className="pt-2 border-t border-[#DECAB3]/60 text-[10px] text-[#7A6B53] font-semibold flex items-center justify-between">
                              <span>{c.footLabel}</span>
                              <span className="font-mono font-bold">{c.footValue}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#DECAB3] space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-[#2D4A27]" />
                          <h4 className="text-sm font-extrabold text-[#1E331A]">
                            {L('المرجع الفضائي والمصدر (NASA Earth Observation)', 'Traçabilité et données scientifiques NASA POWER', 'NASA POWER data provenance')}
                          </h4>
                        </div>
                        <a href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer" className="text-[11px] font-bold text-[#8C3A27] hover:underline flex items-center gap-1">
                          <span>NASA POWER Project</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#EFE9DC] p-4 rounded-2xl border border-[#D5C4AC]/60">
                        <div>
                          <div className="text-[10px] text-[#7A6B53] font-bold">{L('المصدر:', 'Projet satellite :', 'Source:')}</div>
                          <div className="font-semibold text-[#1E331A]">{apiResponse?.provenance?.source || 'NASA POWER Daily AG v2'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#7A6B53] font-bold">{L('الفترة المدروسة:', 'Période analysée :', 'Analysed period:')}</div>
                          <div className="font-semibold text-[#1E331A]">
                            {apiResponse?.provenance?.period ? `${apiResponse.provenance.period.start} → ${apiResponse.provenance.period.end}` : '20210101 → 20251231'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#7A6B53] font-bold">{L('الإحداثيات الفعلية:', 'Point GPS exact :', 'Exact GPS point:')}</div>
                          <div className="font-semibold font-mono text-[#1E331A]">
                            {apiResponse?.provenance?.latitude ?? activeLat}°N, {apiResponse?.provenance?.longitude ?? activeLon}°
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#7A6B53] font-bold">{L('المتغيرات:', 'Variables API :', 'API variables:')}</div>
                          <div className="font-mono text-[10px] text-[#8C3A27] font-semibold">T2M, PRECTOTCORR, RH2M, GDD</div>
                        </div>
                      </div>

                      <p className="text-xs text-[#61513C] leading-relaxed">
                        {L(
                          'هذه المؤشرات مستخرجة من مشروع NASA POWER (Agroclimatology) بمركز لانغلي للأبحاث، وتُدمج مع قواعد الدورة الزراعية المعتمدة على INRA و FAO.',
                          'Indicateurs extraits du projet NASA POWER (Agroclimatology) du NASA Langley Research Center. Ces données alimentent nos règles agronomiques (INRA / FAO) pour une rotation des cultures durable.',
                          'Indicators extracted from NASA POWER (Agroclimatology) at the NASA Langley Research Center. They feed our agronomic rules (INRA / FAO) for sustainable crop rotation.'
                        )}
                      </p>
                    </div>

                    <div className="pt-4 flex justify-between gap-3 flex-wrap">
                      <Link to="/recommendation" className="px-6 py-3.5 bg-[#EFE9DC] hover:bg-[#E5DDCF] border border-[#DECAB3] text-[#2D4A27] rounded-xl font-bold text-xs flex items-center gap-2">
                        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        <span>{L('رجوع للتوصيات', 'Retour aux cultures', 'Back to recommendations')}</span>
                      </Link>
                      <Link to="/simulator" className="px-6 py-3.5 bg-[#8C3A27] hover:bg-[#732F1F] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm">
                        <span>{L('جرّب سيناريوهات «ماذا لو؟»', 'Tester des scénarios « Et si ? »', 'Try What-If scenarios')}</span>
                        {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </Link>
                    </div>
                  </div>
                } />

                {/* ─── ROUTE 4: "/advisor" ─── */}
                <Route path="/advisor" element={
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <div className="text-xs font-bold text-[#8C3A27]">
                        {isAr ? 'المرشد الصوتي الذكي' : isEn ? 'Smart Voice Advisor' : 'Assistant Vocal Intelligent'}
                      </div>
                      <h3 className="text-2xl font-black text-[#1E331A]">
                        {isAr ? 'سول عمي أحمد بصوتك بالدارجة' : isEn ? 'Ask Ami Ahmed With Your Voice' : 'Posez vos questions à Ami Ahmed'}
                      </h3>
                    </div>

                    <FellahQuestion
                      regionName={activeRegionName}
                      parcelle={apiResponse && apiResponse.status === 'ok' ? {
                        latitude: activeLat,
                        longitude: activeLon,
                        previous_crop: previousCrop,
                        water_access: waterAccess,
                        soil_type: soilType,
                        field_size_ha: parseFloat(fieldSize) || null,
                        data_status: apiResponse.data_status,
                        annual_rain_mm: apiResponse.indicators?.annual_rain_mm ?? null,
                        mean_annual_temp_c: apiResponse.indicators?.mean_annual_temp_c ?? null,
                      } : null}
                    />

                    <div className="bg-[#FAF7F2] p-8 rounded-3xl border border-[#DECAB3] shadow-sm max-w-2xl mx-auto text-center space-y-6">
                      <div className="w-20 h-20 rounded-full bg-[#8C3A27]/10 text-[#8C3A27] flex items-center justify-center font-bold mx-auto">
                        <Mic className="w-10 h-10" />
                      </div>

                      <div>
                        <h4 className="text-xl font-bold text-[#1E331A]">
                          {isAr ? 'اللاقط جاهز.. تكلم مباشرة بالدارجة' : isEn ? 'Microphone ready.. Speak directly' : 'Micro prêt.. parlez directement'}
                        </h4>
                        <p className="text-xs text-[#61513C] mt-2">
                          {isAr 
                            ? 'لا داعي للكتابة. اضغط على الزر وسول عمي أحمد على كمية البذور، مواعيد الحرث، أو كيفية التعامل مع تقلبات الطقس.'
                            : isEn
                            ? 'No need to type. Click and ask Ami Ahmed about seeding rates, soil prep, or adapting to weather fluctuations.'
                            : 'Pas besoin d\'écrire. Cliquez et posez vos questions sur les semis, l\'engrais ou la météo.'}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#EFE9DC] border border-[#DECAB3]">
                        <div className="flex items-center justify-center gap-1.5 mb-2">
                          <span className={`w-1.5 h-4 rounded-full ${isAudioPlaying ? 'bg-emerald-600 animate-bounce' : 'bg-[#8C3A27]'}`}></span>
                          <span className={`w-1.5 h-7 rounded-full ${isAudioPlaying ? 'bg-emerald-600 animate-bounce delay-75' : 'bg-[#8C3A27]'}`}></span>
                          <span className={`w-1.5 h-10 rounded-full ${isAudioPlaying ? 'bg-emerald-600 animate-bounce delay-150' : 'bg-[#2D4A27]'}`}></span>
                          <span className={`w-1.5 h-6 rounded-full ${isAudioPlaying ? 'bg-emerald-600 animate-bounce delay-100' : 'bg-[#8C3A27]'}`}></span>
                          <span className={`w-1.5 h-3 rounded-full ${isAudioPlaying ? 'bg-emerald-600 animate-bounce' : 'bg-[#8C3A27]'}`}></span>
                        </div>
                        <div className="text-xs text-[#7A6B53] font-semibold">
                          {isAudioPlaying 
                            ? (isAr ? 'عمي أحمد كيشرح لك التوصية دابا...' : isEn ? 'Ami Ahmed is speaking now...' : 'Ami Ahmed est en train de parler...') 
                            : (isAr ? 'اضغط أسفله لبدء الاستماع' : isEn ? 'Press below to start audio guidance' : 'Appuyez ci-dessous')}
                        </div>
                      </div>

                      <button 
                        onClick={speakCurrentAdvice}
                        className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-md transition-all cursor-pointer ${
                          isAudioPlaying ? 'bg-[#8C3A27] text-white animate-pulse' : 'bg-[#2D4A27] hover:bg-[#1E331A] text-white'
                        }`}
                      >
                        <Volume2 className="w-5 h-5" />
                        <span>
                          {isAudioPlaying 
                            ? (isAr ? 'إيقاف الصوت' : isEn ? 'Stop Audio' : 'Arrêter la voix') 
                            : (isAr ? 'استمع إلى نصيحة عمي أحمد لأرضك' : isEn ? 'Listen to Ami Ahmed\'s Agricultural Advice' : 'Écouter le conseil vocal')}
                        </span>
                      </button>
                    </div>
                  </div>
                } />

                {/* ─── ROUTE 5: "/nasa" ─── */}
                <Route path="/nasa" element={
                  <NASADataPage
                    apiResponse={apiResponse}
                    regionName={activeRegionName}
                    lat={activeLat}
                    lon={activeLon}
                    lang={lang}
                  />
                } />

                {/* ─── ROUTE 6: "/planner" ─── */}
                <Route path="/planner" element={
                  <RotationPlannerPage
                    apiResponse={apiResponse}
                    regionName={activeRegionName}
                    lat={activeLat}
                    lon={activeLon}
                    previousCrop={previousCrop}
                    waterAccess={waterAccess}
                    soilType={soilType}
                    fieldSize={fieldSize}
                    lang={lang}
                  />
                } />

                {/* ─── ROUTE 7: "/simulator" ─── */}
                <Route path="/simulator" element={
                  <SimulatorPage
                    lat={activeLat}
                    lon={activeLon}
                    defaultPrevCrop={previousCrop}
                    defaultWater={waterAccess}
                    regionName={activeRegionName}
                    soilType={soilType}
                    lang={lang}
                  />
                } />

                {/* ─── ROUTE 8: "/crops" ─── */}
                <Route path="/crops" element={
                  <CropLibraryPage lang={lang} />
                } />

                {/* ─── ROUTE 9: "/soil" ─── */}
                <Route path="/soil" element={
                  <SoilPage
                    currentSoil={soilType}
                    regionName={activeRegionName}
                    lang={lang}
                  />
                } />

                {/* ─── ROUTE 10: "/reports" ─── */}
                <Route path="/reports" element={
                  <ReportsPage
                    apiResponse={apiResponse}
                    regionName={activeRegionName}
                    lat={activeLat}
                    lon={activeLon}
                    previousCrop={previousCrop}
                    waterAccess={waterAccess}
                    soilType={soilType}
                    fieldSize={fieldSize}
                    lang={lang}
                  />
                } />

                {/* ─── ROUTE 11: "/sources" ─── */}
                <Route path="/sources" element={
                  <DataSourcesPage lang={lang} />
                } />

                {/* ─── ROUTE 12: "/farms" ─── */}
                <Route path="/farms" element={
                  <FarmsPage
                    onSelectParcel={(p) => {
                      triggerAnalysis(p.latitude, p.longitude);
                      navigate('/recommendation');
                    }}
                    lang={lang}
                  />
                } />
              </Routes>
            </div>
          </main>
        </div>

        <AuthModal 
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(u) => {
            setUser(u);
            setIsAuthOpen(false);
          }}
        />

        <ParcelsModal
          isOpen={isParcelsOpen}
          onClose={() => setIsParcelsOpen(false)}
          onSelectParcel={(p) => {
            setIsParcelsOpen(false);
            triggerAnalysis(p.latitude, p.longitude);
            navigate('/recommendation');
          }}
        />
      </div>
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}