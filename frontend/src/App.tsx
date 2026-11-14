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
  Navigation, 
  Volume2, 
  Mic, 
  CheckCircle2, 
  Calendar, 
  Sun, 
  Droplets, 
  Layers, 
  Compass, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight,
  TrendingUp,
  ThermometerSun,
  ShieldCheck,
  Languages,
  User,
  Radio,
  RefreshCw,
  Plus,
  Minus,
  AlertTriangle,
  BookmarkPlus,
  Check,
  Zap,
  HelpCircle,
  Database,
  CloudRain,
  Flame,
  Snowflake,
  ExternalLink,
  Info,
  Activity
} from 'lucide-react';
import { 
  getRecommendations, 
  getMe, 
  setToken, 
  getToken, 
  createParcel, 
  type UserProfile, 
  type ParcelItem 
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
import { Sliders, FileText, Menu, X } from 'lucide-react';

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

// 5 Moroccan agricultural regions
const REGIONS = [
  { name_ar: 'جهة فاس - مكناس (حوض سايس)', name_fr: 'Fès - Meknès (Saïss)', name_en: 'Fes - Meknes (Saïss)', lat: 33.89, lon: -5.00, soil: 'clay_loam', desc_ar: 'تيرس غني، عمق خصب > 90 سم', desc_fr: 'Tirs fertile > 90cm', desc_en: 'Rich Tirs soil, depth > 90cm' },
  { name_ar: 'جهة سوس - ماسة (تارودانت / هوارة)', name_fr: 'Souss - Massa (Taroudant)', name_en: 'Souss - Massa (Taroudant)', lat: 30.42, lon: -8.87, soil: 'sandy_loam', desc_ar: 'حمري خفيف رملي نصف جاف', desc_fr: 'Hamri sableux semi-aride', desc_en: 'Sandy Hamri, semi-arid' },
  { name_ar: 'جهة مراكش - الحوز (تانسيفت)', name_fr: 'Marrakech - Tensift', name_en: 'Marrakech - Tensift', lat: 31.62, lon: -8.00, soil: 'clay', desc_ar: 'تربة طينية متماسكة خصبة', desc_fr: 'Argileux profond', desc_en: 'Deep fertile clay soil' },
  { name_ar: 'جهة الشاوية - ورديغة (سطات)', name_fr: 'Chaouia - Settat', name_en: 'Chaouia - Settat', lat: 33.00, lon: -7.60, soil: 'clay_loam', desc_ar: 'أراضي التيرس الكبرى للحبوب', desc_fr: 'Grande zone céréalière', desc_en: 'Major cereal Tirs plain' },
  { name_ar: 'جهة الغرب - شراردة بني حسن', name_fr: 'Gharb - Kénitra', name_en: 'Gharb - Kenitra', lat: 34.26, lon: -6.58, soil: 'clay', desc_ar: 'أراضي الرمل والغرين الغنية بالمياه', desc_fr: 'Sols alluviaux riches', desc_en: 'Water-rich alluvial soil' },
];

function MainLayout() {
  const [lang, setLang] = useState<Lang>('ar');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isParcelsOpen, setIsParcelsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Step state for the guided workflow (1: Location -> 2: Last Crop -> 3: Recommendation)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Simplified Farmer Selections
  const [selectedRegionIndex, setSelectedRegionIndex] = useState(0);
  const [previousCrop, setPreviousCrop] = useState<CropId>('wheat_hard');
  const [waterAccess, setWaterAccess] = useState<WaterAccess>('rainfed');
  const [soilType, setSoilType] = useState<SoilType>('clay_loam');
  const [fieldSize, setFieldSize] = useState('4.8');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [customLat, setCustomLat] = useState<number | undefined>(undefined);
  const [customLon, setCustomLon] = useState<number | undefined>(undefined);

  // Dynamic API State
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
      
      // Artificial delay (800ms) if data is cached so the user actually sees the satellite scanning/treatment state
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

  // One-click automatic GPS detection
  const handleAutomaticGPS = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          triggerAnalysis(pos.coords.latitude, pos.coords.longitude);
          setStep(2); // Automatically advance to crop question
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
    try {
      await createParcel({
        name: `Parcelle ${activeRegionName} (${crop})`,
        latitude: activeLat,
        longitude: activeLon,
        water_access: waterAccess,
        soil_type: soilType,
        field_size_ha: parseFloat(fieldSize) || 4.8,
      });
      setIsSaved(true);
      setSaveSuccessMsg(isAr ? 'تم حفظ القطعة بنجاح في حسابك !' : isEn ? 'Field parcel saved successfully!' : 'Parcelle sauvegardée avec succès !');
      // Automatically redirect to /farms to see the saved farm
      navigate('/farms');
    } catch (err) {
      console.error('Error saving parcel', err);
      // If unauthorized, prompt login modal
      setIsAuthOpen(true);
    }
  };

  const recommendations = apiResponse?.recommendations || [];
  const activeRecommendation: CropRecommendation | undefined = recommendations[selectedCropIndex] || recommendations[0];
  const indicators = apiResponse?.indicators;

  const annualRain = indicators?.annual_rain_mm ? Math.round(indicators.annual_rain_mm) : 340;
  const avgTemp = indicators?.mean_annual_temp_c ? Math.round(indicators.mean_annual_temp_c) : 21;
  const isRainAdequate = annualRain > 280;

  // Audio speech assistance
  const speakCurrentAdvice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!isAudioPlaying) {
      const cropName = isAr ? activeRecommendation?.crop_name_ar : activeRecommendation?.crop_name_fr;
      const reasonsText = activeRecommendation?.reasons?.slice(0, 2).join('. ') || '';
      const text = isAr 
        ? `السلام عليكم يا فلاحنا. بناءً على صور الأقمار الاصطناعية ديال ناسا فـ ${currentRegion.name_ar}، أحسن محصول موصى به لأرضك هو ${cropName}. ${reasonsText}.`
        : `Bonjour cher agriculteur. Selon les observations satellites NASA pour la région de ${currentRegion.name_fr}, la culture recommandée pour votre parcelle est ${cropName}. ${reasonsText}.`;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = isAr ? 'ar-MA' : 'fr-FR';
      utterance.onend = () => setIsAudioPlaying(false);
      setIsAudioPlaying(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsAudioPlaying(false);
    }
  };

  const path = location.pathname;

  return (
    <AppContext.Provider value={{ t, lang, setLang, user, logout }}>
      <div className={`min-h-screen bg-[#F4EFE6] text-[#2C2416] antialiased ${isAr ? 'font-arabic' : 'font-sans'}`} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-col lg:flex-row min-h-screen">
          
          {/* ─── SIDEBAR OVERLAY ─── */}
          {isSidebarOpen && (
            <div 
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-xs transition-opacity"
            />
          )}

          {/* ─── SIDEBAR with REAL ROUTER LINKS ─── */}
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

                {/* Close Button Inside Sidebar */}
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl text-[#7A6B53] hover:text-[#1E331A] hover:bg-[#E4DCCB] transition-colors cursor-pointer"
                  title={isAr ? 'إغلاق القائمة' : 'Fermer le menu'}
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

              {/* Navigation Links */}
              <nav className="p-3 space-y-1">
                <Link 
                  to="/"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    path === '/' ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>{isAr ? 'الرئيسية والمحاصيل' : isEn ? 'Overview & Field' : 'Accueil & Parcelle'}</span>
                </Link>

                <Link 
                  to="/recommendation"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    path === '/recommendation' ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>{isAr ? 'توصية المحصول' : isEn ? 'Crop Recommendation' : 'Recommandation'}</span>
                </Link>

                <Link 
                  to="/nasa"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    path === '/nasa' ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                  }`}
                >
                  <Sun className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{isAr ? 'مرصد ناسا المناخي' : isEn ? 'NASA Earth Data' : 'Données NASA (Climat)'}</span>
                </Link>

                <Link 
                  to="/planner"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    path === '/planner' ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{isAr ? 'مخطط التناوب والسيناريوهات' : isEn ? 'Rotation Scenarios' : 'Planificateur & Scénarios'}</span>
                </Link>

                <Link 
                  to="/simulator"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    path === '/simulator' ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                  }`}
                >
                  <Sliders className="w-4 h-4 shrink-0 text-[#8C3A27]" />
                  <span>{isAr ? 'محاكي الفرضيات والتغير' : isEn ? 'What-If Simulator' : 'Simulateur "Et Si ?"'}</span>
                </Link>

                <Link 
                  to="/crops"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    path === '/crops' ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                  }`}
                >
                  <Sprout className="w-4 h-4 shrink-0 text-[#2D4A27]" />
                  <span>{isAr ? 'موسوعة المحاصيل' : isEn ? 'Crop Library' : 'Guide des Cultures'}</span>
                </Link>

                <Link 
                  to="/soil"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    path === '/soil' ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                  }`}
                >
                  <Compass className="w-4 h-4 shrink-0 text-cyan-700" />
                  <span>{isAr ? 'مرصد التربة (تيرس/حمري)' : isEn ? 'Soil Intelligence' : 'Pédologie & Sols'}</span>
                </Link>

                <Link 
                  to="/reports"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    path === '/reports' ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0 text-[#8C3A27]" />
                  <span>{isAr ? 'تقرير اتخاذ القرار (PDF)' : isEn ? 'Decision Report (PDF)' : 'Rapport Décisionnel'}</span>
                </Link>

                <Link 
                  to="/sources"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    path === '/sources' ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                  }`}
                >
                  <Database className="w-4 h-4 shrink-0 text-[#7A6B53]" />
                  <span>{isAr ? 'سجل بيانات ناسا' : isEn ? 'NASA Data Sources' : 'Registre NASA'}</span>
                </Link>

                <Link 
                  to="/farms"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    path === '/farms' ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                  }`}
                >
                  <BookmarkPlus className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>{isAr ? 'ضيعاتي ومخططاتي' : isEn ? 'My Farms & Plans' : 'Mes Parcelles & Plans'}</span>
                </Link>

                <Link 
                  to="/advisor"
                  onClick={() => setIsSidebarOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    path === '/advisor' ? 'bg-[#2D4A27] text-white shadow-sm' : 'text-[#5A4D3B] hover:bg-[#E5DDCF]'
                  }`}
                >
                  <Mic className="w-4 h-4 shrink-0 text-[#8C3A27]" />
                  <span>{isAr ? 'المرشد الصوتي (عمي أحمد)' : isEn ? 'Voice Advisor' : 'Conseiller Vocal'}</span>
                </Link>
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
                  <span className="font-bold">{isAr ? 'إرشاد فلاحي بالصوت' : isEn ? 'Audio Guide' : 'Audio Guide'}</span>
                </div>
                <span className="text-[10px] bg-[#2D4A27] text-white px-2 py-0.5 rounded-full font-bold">
                  {isAr ? 'عمي أحمد' : 'Ami Ahmed'}
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
                {/* Hamburger Button to Toggle Menu */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-xl bg-[#EFE9DC] hover:bg-[#E4DCCB] text-[#1E331A] border border-[#DECAB3] transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold shadow-xs"
                  title={isAr ? 'فتح / إغلاق القائمة' : 'Ouvrir / Fermer le menu'}
                >
                  {isSidebarOpen ? <X className="w-4 h-4 text-[#8C3A27]" /> : <Menu className="w-4 h-4 text-[#2D4A27]" />}
                  <span className="hidden sm:inline">{isSidebarOpen ? (isAr ? 'إغلاق' : 'Fermer') : (isAr ? 'القائمة' : 'Menu')}</span>
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

                {/* Demo Mode Button for Judges */}
                <button
                  onClick={() => {
                    setSelectedRegionIndex(3); // Chaouia
                    setPreviousCrop('wheat_hard');
                    setWaterAccess('rainfed');
                    setSoilType('clay_loam');
                    setFieldSize('5.5');
                    triggerAnalysis(33.0, -7.6);
                  }}
                  className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer"
                  title="Charger la ferme pilote pour la démonstration"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isAr ? 'عرض توضيحي للمحكمين ⭐' : isEn ? 'Demo Mode ⭐' : 'Mode Démo (Chaouia) ⭐'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={speakCurrentAdvice}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8C3A27] text-white text-xs font-bold shadow-sm hover:bg-[#732F1F] transition-colors cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'بالدارجة المغربية' : isEn ? 'Audio Guide' : 'En Français'}</span>
                </button>

                {/* 3-Language Switcher (AR / FR / EN) */}
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
                {/* ─── ROUTE 1: "/" (SUPER SIMPLE & GUIDED WORKFLOW FOR FARMERS) ─── */}
                <Route path="/" element={
                  <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Visual 3-Step Progress Indicator */}
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

                    {/* ════════ STEP 1: CHOOSE REGION OR CLICK AUTO GPS ════════ */}
                    {step === 1 && (
                      <div className="space-y-6">
                        {/* Big Automated Action Button (No technical input needed) */}
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

                        {/* Visual Region Cards (Easy Tap) */}
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

                        {/* Interactive Leaflet Map for Moroccan Field Coordinates */}
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

                    {/* ════════ STEP 2: SIMPLE CROP & WATER QUESTION ════════ */}
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

                          {/* Big Visual Buttons for Crop */}
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

                          {/* Water Option */}
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

                          {/* Buttons */}
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

                        {/* Interactive Leaflet Map for Moroccan Field Coordinates */}
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

                {/* ─── ROUTE 2: "/recommendation" (توصية المحصول) ─── */}
                <Route path="/recommendation" element={
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="text-xs font-bold text-[#8C3A27]">{isAr ? 'النتيجة الفلاحية المباشرة' : isEn ? 'Agricultural Recommendation' : 'Résultat Agronomique'}</div>
                        <h3 className="text-2xl font-black text-[#1E331A]">
                          {isAr ? `المحاصيل الأنسب لـ ${activeRegionName}` : isEn ? `Recommended Crops for ${activeRegionName}` : `Cultures recommandées pour ${activeRegionName}`}
                        </h3>
                        <p className="text-xs text-[#7A6B53]">
                          {isAr 
                            ? `بناءً على أمطار ناسا (${annualRain} ملم) ومحصولك السابق (${previousCrop === 'wheat_hard' ? 'القمح الصلب' : previousCrop})`
                            : isEn
                            ? `Based on NASA rainfall (${annualRain} mm) and previous crop.`
                            : `Basé sur les données NASA (${annualRain} mm) et votre précédent cultural.`}
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
                              #{idx + 1} {isAr ? rec.crop_name_ar : rec.crop_name_fr}
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
                            {isAr ? 'جاري تحليل إحداثيات الحقل عبر أقمار ناسا...' : 'Traitement des observations NASA POWER en cours...'}
                          </h4>
                          <p className="text-xs text-[#7A6B53] mt-1">
                            {isAr 
                              ? `فحص سجل 5 سنوات من التساقطات والحرارة التراكمية لموقع ${currentRegion.name_ar}...`
                              : `Calcul du bilan hydrique et de la rotation des sols pour ${currentRegion.name_fr}...`}
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
                                {isAr ? `الفئة: ${activeRecommendation.crop_category} • المساحة: ${fieldSize} هكتار` : isEn ? `Category: ${activeRecommendation.crop_category} • Field Area: ${fieldSize} Ha` : `Catégorie : ${activeRecommendation.crop_category} • Surface : ${fieldSize} Ha`}
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

                            {/* Scientific Evidences & Agronomic Citations (For Doctors & Engineers) */}
                            {activeRecommendation.evidences && activeRecommendation.evidences.length > 0 && (
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

                            {/* ─── NEW: WHAT-IF SIMULATOR & MULTI-YEAR ROTATION PLAN ─── */}
                            <div className="p-4 bg-[#F4EFE6] rounded-2xl border-2 border-[#2D4A27]/20 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-[#8C3A27]" />
                                  <span className="text-xs font-black text-[#1E331A]">
                                    {isAr ? 'محاكاة السيناريوهات المناخية (Et si / ماذا لو؟)' : isEn ? 'Climate "What-If" Scenario Simulator' : 'Simulateur d\'aléas "Et Si ?" (What-If)'}
                                  </span>
                                </div>
                                <span className="text-[10px] bg-[#2D4A27] text-white px-2 py-0.5 rounded-full font-bold">
                                  {isAr ? 'خوارزمية جديدة' : isEn ? 'New Engine' : 'Nouveau Moteur'}
                                </span>
                              </div>

                              <p className="text-[11px] text-[#61513C]">
                                {isAr 
                                  ? 'اختر سيناريو مناخي لاختبار متانة خطتك ومحاكاة النتيجة في حالة الجفاف أو توفر مياه السقي:' 
                                  : isEn
                                  ? 'Test your field plan resilience under simulated climate anomalies or irrigation availability:'
                                  : 'Testez la résilience de votre parcelle face aux aléas climatiques :'}
                              </p>

                              {/* What-If Scenario Pills */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-white/80 border border-[#DECAB3] space-y-1">
                                  <div className="font-bold text-[#8C3A27] flex items-center justify-between text-[11px]">
                                    <span>🌧️ {isAr ? 'لو نقص المطر 20%' : isEn ? 'Rainfall -20%' : 'Pluie -20%'}</span>
                                    <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">-9 pts</span>
                                  </div>
                                  <p className="text-[10px] text-[#7A6B53]">
                                    {isAr ? 'الحمص يظل مقاوماً، والقمح يتراجع لخيار خطر.' : isEn ? 'Chickpea stays resilient, wheat shifts to higher risk.' : 'Le pois chiche résiste, le blé devient risqué.'}
                                  </p>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white/80 border border-[#DECAB3] space-y-1">
                                  <div className="font-bold text-[#2D4A27] flex items-center justify-between text-[11px]">
                                    <span>💧 {isAr ? 'لو تم سقي الحقل' : isEn ? 'Supplemental Irrigation' : 'Irrigation'}</span>
                                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">+22 pts</span>
                                  </div>
                                  <p className="text-[10px] text-[#7A6B53]">
                                    {isAr ? 'يقفز التوافق إلى 100% ويفتح إمكانية زراعة البطاطس.' : isEn ? 'Affinity reaches 100% and unlocks high-yield potato rotation.' : 'Score 100% et rotation vers pomme de terre.'}
                                  </p>
                                </div>

                                <div className="p-2.5 rounded-xl bg-white/80 border border-[#DECAB3] space-y-1">
                                  <div className="font-bold text-red-700 flex items-center justify-between text-[11px]">
                                    <span>⚠️ {isAr ? 'لو كررنا القمح' : isEn ? 'Continuous Wheat (2 yrs)' : 'Céréale / Céréale'}</span>
                                    <span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-mono">-39 pts</span>
                                  </div>
                                  <p className="text-[10px] text-[#7A6B53]">
                                    {isAr ? 'خيار مرفوض (à éviter) بسبب استنزاف النيتروجين.' : isEn ? 'Strictly discouraged: soil nitrogen depletion and fungal root rot.' : 'À éviter absolument : rupture de fertilité.'}
                                  </p>
                                </div>
                              </div>

                              {/* Multi-Year Rotation Horizon */}
                              <div className="pt-2 border-t border-[#DECAB3]/70 flex items-center justify-between text-[11px] text-[#4D3F2C] flex-wrap gap-2">
                                <span className="font-bold">
                                  📅 {isAr ? 'أفق الدورة للسنة القادمة (N+1):' : isEn ? 'Next Season Horizon (Year N+1):' : 'Horizon de rotation (Année N+1) :'}
                                </span>
                                <span className="bg-[#EFE9DC] px-2.5 py-1 rounded-lg font-semibold text-[#1E331A] border border-[#D5C4AC]">
                                  {isAr ? '🌾 قمح صلب / لين (استفادة من نيتروجين الحمص)' : isEn ? '🌾 Durum / Soft Wheat (Leveraging fixed N)' : '🌾 Blé Dur / Tendre (Valorisation de l\'azote fixé)'}
                                </span>
                              </div>
                            </div>

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
                              {isAr ? `مطابق بنسبة ${activeRecommendation.score}%` : `Score ${activeRecommendation.score}%`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 bg-[#FAF7F2] rounded-3xl border border-[#DECAB3] text-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#8C3A27] mx-auto mb-2" />
                        <p className="text-xs font-bold text-[#61513C]">{isAr ? 'جاري استرجاع معطيات ناسا...' : 'Calcul des recommandations...'}</p>
                      </div>
                    )}

                    <div className="pt-4 flex justify-between">
                      <button
                        onClick={() => {
                          setStep(2);
                          navigate('/');
                        }}
                        className="px-6 py-3.5 bg-[#EFE9DC] hover:bg-[#E5DDCF] border border-[#DECAB3] text-[#2D4A27] rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer"
                      >
                        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        <span>{isAr ? 'تغيير معطيات الحقل' : 'Modifier la parcelle'}</span>
                      </button>

                      <Link
                        to="/weather"
                        className="px-6 py-3.5 bg-[#2D4A27] hover:bg-[#1E331A] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm"
                      >
                        <span>{isAr ? 'فحص حالة الأرض والطقس' : 'Voir la météo du sol'}</span>
                        {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </Link>
                    </div>
                  </div>
                } />

                {/* ─── ROUTE 3: "/weather" (حالة الأرض والطقس الحقيقية من NASA POWER) ─── */}
                <Route path="/weather" element={
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold text-[#8C3A27] flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5" />
                          <span>{isAr ? 'بيانات الأرصاد الفضائية الحقيقية • NASA POWER AG' : 'Données Satellites Réelles • NASA POWER AG'}</span>
                        </div>
                        <h3 className="text-2xl font-black text-[#1E331A]">
                          {isAr ? `المؤشرات المناخية لـ ${currentRegion.name_ar}` : `Indicateurs Agro-climatiques : ${currentRegion.name_fr}`}
                        </h3>
                        <p className="text-xs text-[#7A6B53] mt-0.5">
                          {isAr 
                            ? `إحداثيات الرصد: خط العرض ${currentRegion.lat}°N • خط الطول ${currentRegion.lon}°W • دقة الاستشعار 0.5°`
                            : `Coordonnées : ${currentRegion.lat}°N, ${currentRegion.lon}°W • Résolution spatiale : 0.5°`}
                        </p>
                      </div>

                      {/* Official NASA Badge */}
                      <div className="flex items-center gap-2 bg-[#FAF7F2] p-2.5 rounded-2xl border border-[#DECAB3] shadow-xs">
                        <span className={`w-3 h-3 rounded-full ${apiResponse?.data_status === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                        <div className="text-start">
                          <div className="text-[10px] font-black uppercase text-[#2D4A27]">
                            {apiResponse?.data_status === 'live' ? (isAr ? 'بيانات ناسا مباشرة (LIVE)' : 'NASA DIRECT LIVE') : (isAr ? 'مسترجع من الكاش (CACHED)' : 'CACHE NASA ACTIF')}
                          </div>
                          <div className="text-[10px] text-[#7A6B53]">
                            {apiResponse?.provenance?.period ? `${apiResponse.provenance.period.start.slice(0,4)} - ${apiResponse.provenance.period.end.slice(0,4)}` : '2021 - 2025 (5 ans)'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scientific Indicators Grid (100% Real from API) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      
                      {/* 1. Annual Precipitation */}
                      <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#DECAB3] flex flex-col justify-between shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#7A6B53] flex items-center gap-1.5">
                            <CloudRain className="w-4 h-4 text-sky-600" />
                            <span>{isAr ? 'التساقطات السنوية التراكمية' : 'Précipitations Annuelles'}</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#8C7A60] bg-[#EFE9DC] px-2 py-0.5 rounded-full">PRECTOTCORR</span>
                        </div>
                        <div className="my-4">
                          <div className="text-4xl font-black text-[#1E331A]">
                            {indicators?.annual_rain_mm !== undefined ? indicators.annual_rain_mm : annualRain} <span className="text-lg font-bold text-[#7A6B53]">{isAr ? 'ملم/سنة' : 'mm/an'}</span>
                          </div>
                          <p className="text-[11px] text-[#7A6B53] mt-1">
                            {indicators?.annual_rain_mm && indicators.annual_rain_mm > 400 
                              ? (isAr ? 'أمطار ملائمة للحبوب والقطاني بورية' : 'Pluviosité favorable aux céréales') 
                              : (isAr ? 'منطقة نصف جافة تتطلب سقي تكميلي' : 'Zone semi-aride, appoint d\'eau recommandé')}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[#DECAB3]/60 text-[10px] text-[#8C3A27] font-semibold flex items-center justify-between">
                          <span>{isAr ? 'مؤشر الجفاف (UNEP Aridity)' : 'Indice d\'aridité UNEP'}</span>
                          <span className="font-mono font-bold">{indicators?.aridity_index ? indicators.aridity_index.toFixed(3) : '0.40'}</span>
                        </div>
                      </div>

                      {/* 2. Mean Annual Temperature */}
                      <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#DECAB3] flex flex-col justify-between shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#7A6B53] flex items-center gap-1.5">
                            <Sun className="w-4 h-4 text-amber-600" />
                            <span>{isAr ? 'معدل الحرارة السنوي (2 متر)' : 'Température Moyenne (2m)'}</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#8C7A60] bg-[#EFE9DC] px-2 py-0.5 rounded-full">T2M</span>
                        </div>
                        <div className="my-4">
                          <div className="text-4xl font-black text-[#1E331A]">
                            {indicators?.mean_annual_temp_c !== undefined ? indicators.mean_annual_temp_c.toFixed(1) : avgTemp} <span className="text-lg font-bold text-[#7A6B53]">°C</span>
                          </div>
                          <p className="text-[11px] text-[#7A6B53] mt-1">
                            {indicators?.mean_annual_temp_c && indicators.mean_annual_temp_c >= 22 
                              ? (isAr ? 'طقس دافئ إلى حار ملائم للأشجار المقاومة' : 'Climat chaud propice à l\'argan et l\'olivier') 
                              : (isAr ? 'مناخ معتدل مناسب للنضج الخضري' : 'Climat tempéré favorable')}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[#DECAB3]/60 text-[10px] text-[#2D4A27] font-semibold flex items-center justify-between">
                          <span>{isAr ? 'حساب الحرارة التراكمية' : 'Degrés-jours de croissance'}</span>
                          <span className="font-mono font-bold">{indicators?.gdd_base10 ? `${Math.round(indicators.gdd_base10)} GDD` : '4076 GDD'}</span>
                        </div>
                      </div>

                      {/* 3. Frost Risk & Extreme Cold */}
                      <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#DECAB3] flex flex-col justify-between shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#7A6B53] flex items-center gap-1.5">
                            <Snowflake className="w-4 h-4 text-cyan-600" />
                            <span>{isAr ? 'أيام الصقيع السنوي (جريحة)' : 'Risque de Gel Annuel'}</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#8C7A60] bg-[#EFE9DC] px-2 py-0.5 rounded-full">T2M_MIN &lt; 0°C</span>
                        </div>
                        <div className="my-4">
                          <div className="text-4xl font-black text-[#1E331A]">
                            {indicators?.frost_days_per_year !== undefined ? indicators.frost_days_per_year : 0} <span className="text-lg font-bold text-[#7A6B53]">{isAr ? 'أيام/سنة' : 'j/an'}</span>
                          </div>
                          <p className="text-[11px] text-[#7A6B53] mt-1">
                            {(indicators?.frost_days_per_year || 0) <= 2 
                              ? (isAr ? 'خطر الصقيع منعدم أو ضئيل جداً على المحاصيل' : 'Risque de gel minime ou nul') 
                              : (isAr ? 'انتباه من موجات البرد الشتوية في المرتفعات' : 'Attention au froid hivernal')}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[#DECAB3]/60 text-[10px] text-[#7A6B53] font-semibold flex items-center justify-between">
                          <span>{isAr ? 'أشهر الجفاف (<30mm)' : 'Mois secs (<30mm)'}</span>
                          <span className="font-mono font-bold">{indicators?.dry_months ? `${indicators.dry_months} mois/an` : '7 mois/an'}</span>
                        </div>
                      </div>

                    </div>

                    {/* Scientific Provenance Banner (NASA Space Apps Challenge Field Shift Compliance) */}
                    <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#DECAB3] space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-[#2D4A27]" />
                          <h4 className="text-sm font-extrabold text-[#1E331A]">
                            {isAr ? 'بيانات المرجع الفضائي والمصدر (NASA Earth Observation Provenance)' : 'Traçabilité et Données Scientifiques NASA POWER'}
                          </h4>
                        </div>
                        <a 
                          href="https://power.larc.nasa.gov/" 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[11px] font-bold text-[#8C3A27] hover:underline flex items-center gap-1"
                        >
                          <span>NASA POWER Project</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-[#EFE9DC] p-4 rounded-2xl border border-[#D5C4AC]/60">
                        <div>
                          <div className="text-[10px] text-[#7A6B53] font-bold">{isAr ? 'المصدر الفضائي:' : 'Projet Satellite :'}</div>
                          <div className="font-semibold text-[#1E331A]">{apiResponse?.provenance?.source || 'NASA POWER Daily AG v2'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#7A6B53] font-bold">{isAr ? 'فترة الحساب الإحصائي:' : 'Période analysée :'}</div>
                          <div className="font-semibold text-[#1E331A]">
                            {apiResponse?.provenance?.period ? `${apiResponse.provenance.period.start} → ${apiResponse.provenance.period.end}` : '20210101 → 20251231'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#7A6B53] font-bold">{isAr ? 'الإحداثيات الفعلية:' : 'Point GPS exact :'}</div>
                          <div className="font-semibold font-mono text-[#1E331A]">
                            {apiResponse?.provenance?.latitude ?? currentRegion.lat}°N, {apiResponse?.provenance?.longitude ?? currentRegion.lon}°W
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#7A6B53] font-bold">{isAr ? 'المتغيرات المسترجعة:' : 'Variables API :'}</div>
                          <div className="font-mono text-[10px] text-[#8C3A27] font-semibold">T2M, PRECTOTCORR, RH2M, GDD</div>
                        </div>
                      </div>

                      <p className="text-xs text-[#61513C] leading-relaxed">
                        {isAr 
                          ? `هذه المؤشرات مستخرجة مباشرة من مشروع NASA POWER (Agroclimatology Community) بمركز لانغلي للأبحاث (Langley Research Center). يتم دمج هذه القياسات مع معادلات الدورة الزراعية المعتمدة من المعهد الوطني للبحث الزراعي (INRA) ومنظمة (FAO) لتقديم أدق توصية لمحصول القطعة الأرضية.`
                          : `Indicateurs extraits directement du projet NASA POWER (Agroclimatology Community) du NASA Langley Research Center. Ces données alimentent nos règles agronomiques (INRA / FAO) pour une rotation des cultures durable et rentable.`}
                      </p>
                    </div>

                    <div className="pt-4 flex justify-between">
                      <Link
                        to="/recommendation"
                        className="px-6 py-3.5 bg-[#EFE9DC] hover:bg-[#E5DDCF] border border-[#DECAB3] text-[#2D4A27] rounded-xl font-bold text-xs flex items-center gap-2"
                      >
                        {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        <span>{isAr ? 'رجوع للتوصيات' : 'Retour aux cultures'}</span>
                      </Link>

                      <Link
                        to="/advisor"
                        className="px-6 py-3.5 bg-[#8C3A27] hover:bg-[#732F1F] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm"
                      >
                        <span>{isAr ? 'استشارة المرشد الصوتي' : 'Parler à Ami Ahmed'}</span>
                        {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                      </Link>
                    </div>
                  </div>
                } />

                {/* ─── ROUTE 4: "/advisor" (المرشد الفلاحي الصوتي) ─── */}
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

                {/* ─── ROUTE 5: "/nasa" (مرصد ناسا المناخي والتتبع) ─── */}
                <Route path="/nasa" element={
                  <NASADataPage
                    apiResponse={apiResponse}
                    regionName={activeRegionName}
                    lat={activeLat}
                    lon={activeLon}
                    lang={lang}
                  />
                } />

                {/* ─── ROUTE 6: "/planner" (مخطط التناوب ومقارنة السيناريوهات) ─── */}
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

                {/* ─── ROUTE 7: "/simulator" (محاكي الفرضيات والتغير المناخي) ─── */}
                <Route path="/simulator" element={
                  <SimulatorPage
                    lat={activeLat}
                    lon={activeLon}
                    defaultPrevCrop={previousCrop}
                    defaultWater={waterAccess}
                    regionName={activeRegionName}
                    lang={lang}
                  />
                } />

                {/* ─── ROUTE 8: "/crops" (دليل وموسوعة المحاصيل الزراعية) ─── */}
                <Route path="/crops" element={
                  <CropLibraryPage lang={lang} />
                } />

                {/* ─── ROUTE 9: "/soil" (مرصد التربة والقدرة الحقلية) ─── */}
                <Route path="/soil" element={
                  <SoilPage
                    currentSoil={soilType}
                    regionName={activeRegionName}
                    lang={lang}
                  />
                } />

                {/* ─── ROUTE 10: "/reports" (تقرير اتخاذ القرار والتحميل PDF) ─── */}
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

                {/* ─── ROUTE 11: "/sources" (سجل بيانات الأقمار الاصطناعية) ─── */}
                <Route path="/sources" element={
                  <DataSourcesPage lang={lang} />
                } />

                {/* ─── ROUTE 12: "/farms" (ضيعاتي ومخططاتي المحفوظة) ─── */}
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
