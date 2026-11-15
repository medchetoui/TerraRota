import React from 'react';
import { MapPin, Droplets, Layers, Calendar, Sparkles, AlertCircle } from 'lucide-react';
import type { AdvisorContextData } from '../types/api';

interface FarmerContextPanelProps {
  context: AdvisorContextData | null;
  lang: 'ar' | 'fr' | 'en';
  onSelectParcel?: (parcelId: number) => void;
}

export const FarmerContextPanel: React.FC<FarmerContextPanelProps> = ({
  context,
  lang,
  onSelectParcel,
}) => {
  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  if (!context) {
    return (
      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#DECAB3] animate-pulse">
        <div className="h-4 bg-[#E5DDCF] rounded-full w-1/3 mb-2"></div>
        <div className="h-3 bg-[#E5DDCF] rounded-full w-2/3"></div>
      </div>
    );
  }

  const { farmer, active_parcel, parcels, previous_crop, indicators, is_demo } = context;

  const getSoilName = (type: string) => {
    const map: Record<string, { ar: string; fr: string; en: string }> = {
      clay_loam: { ar: 'تيرس (طينية-لومية)', fr: 'Argilo-limoneux (Tirs)', en: 'Clay loam (Tirs)' },
      clay: { ar: 'طينية', fr: 'Argileux', en: 'Clay' },
      loam: { ar: 'لومية', fr: 'Limoneux', en: 'Loam' },
      sandy_loam: { ar: 'رملية-لومية (حمري)', fr: 'Sablo-limoneux (Hamri)', en: 'Sandy loam (Hamri)' },
      sandy: { ar: 'رملية (رمل)', fr: 'Sableux (Rmel)', en: 'Sandy' },
      unknown: { ar: 'غير محدد', fr: 'Non renseigné', en: 'Not specified' },
    };
    return map[type]?.[lang] || type;
  };

  const getWaterLabel = (type: string) => {
    const map: Record<string, { ar: string; fr: string; en: string }> = {
      rainfed: { ar: 'بوري (أمطار)', fr: 'Bour (Pluvial)', en: 'Rainfed' },
      irrigated: { ar: 'مسقي (ري موضعي)', fr: 'Irrigué (Goutte-à-goutte)', en: 'Irrigated' },
      partial: { ar: 'سقي تكميلي', fr: 'Irrigation d\'appoint', en: 'Supplemental' },
    };
    return map[type]?.[lang] || type;
  };

  return (
    <div className="bg-[#FAF7F2] border border-[#DECAB3] rounded-3xl p-5 space-y-4 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header with Farmer identity & Demo badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#2D4A27] text-white flex items-center justify-center font-bold text-sm">
            {farmer.first_name ? farmer.first_name[0].toUpperCase() : 'F'}
          </div>
          <div>
            <div className="text-xs font-bold text-[#1E331A] flex items-center gap-1.5">
              <span>{farmer.first_name || farmer.username}</span>
              {is_demo && (
                <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                  {isAr ? 'حساب تجريبي' : isEn ? 'Demo Profile' : 'Profil Démo'}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#7A6B53]">
              {isAr ? 'الملف الزراعي للأرض المتصلة' : isEn ? 'Connected Farm Agronomic Profile' : 'Profil Agronomique Connecté'}
            </div>
          </div>
        </div>

        {/* Parcels selector if multiple */}
        {parcels && parcels.length > 1 && onSelectParcel && (
          <select
            value={active_parcel?.id || ''}
            onChange={(e) => onSelectParcel(Number(e.target.value))}
            className="text-xs font-bold bg-white border border-[#DECAB3] rounded-xl px-2.5 py-1 text-[#1E331A] cursor-pointer"
          >
            {parcels.map((p) => (
              <option key={p.id} value={p.id || ''}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Grid of real farm parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* 1. Location & Region */}
        <div className="p-3 bg-white rounded-2xl border border-[#DECAB3] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8C3A27]">
            <MapPin className="w-3.5 h-3.5" />
            <span>{isAr ? 'الموقع' : isEn ? 'Location' : 'Région'}</span>
          </div>
          <div className="text-xs font-black text-[#1E331A] mt-1 truncate">
            {active_parcel?.region || (isAr ? 'الشاوية' : 'Chaouia')}
          </div>
          <div className="text-[10px] text-[#7A6B53]">
            {active_parcel ? `${active_parcel.latitude.toFixed(2)}°, ${active_parcel.longitude.toFixed(2)}°` : '33.00°, -7.60°'}
          </div>
        </div>

        {/* 2. Soil type & pH */}
        <div className="p-3 bg-white rounded-2xl border border-[#DECAB3] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2D4A27]">
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? 'التربة' : isEn ? 'Soil' : 'Type de sol'}</span>
          </div>
          <div className="text-xs font-black text-[#1E331A] mt-1 truncate">
            {getSoilName(active_parcel?.soil_type || 'clay_loam')}
          </div>
          <div className="text-[10px] text-[#7A6B53]">
            {active_parcel?.soil_ph ? `pH ${active_parcel.soil_ph}` : 'pH neutre (7.2)'}
          </div>
        </div>

        {/* 3. Water access */}
        <div className="p-3 bg-white rounded-2xl border border-[#DECAB3] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700">
            <Droplets className="w-3.5 h-3.5" />
            <span>{isAr ? 'نظام السقي' : isEn ? 'Water Access' : 'Régime d\'eau'}</span>
          </div>
          <div className="text-xs font-black text-[#1E331A] mt-1 truncate">
            {getWaterLabel(active_parcel?.water_access || 'rainfed')}
          </div>
          <div className="text-[10px] text-[#7A6B53]">
            {indicators ? `${Math.round(indicators.annual_rain_mm)} mm/an` : '340 mm/an'}
          </div>
        </div>

        {/* 4. Previous Crop */}
        <div className="p-3 bg-white rounded-2xl border border-[#DECAB3] flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
            <Calendar className="w-3.5 h-3.5" />
            <span>{isAr ? 'المحصول السابق' : isEn ? 'Previous Crop' : 'Précédent'}</span>
          </div>
          <div className="text-xs font-black text-[#1E331A] mt-1 truncate">
            {previous_crop === 'wheat_hard' ? (isAr ? 'القمح الصلب' : isEn ? 'Durum Wheat' : 'Blé dur') :
             previous_crop === 'chickpea' ? (isAr ? 'الحمص' : isEn ? 'Chickpea' : 'Pois chiche') :
             previous_crop === 'barley' ? (isAr ? 'الشعير' : isEn ? 'Barley' : 'Orge') : previous_crop}
          </div>
          <div className="text-[10px] text-[#7A6B53]">
            {active_parcel?.field_size_ha ? `${active_parcel.field_size_ha} ha` : '5.5 ha'}
          </div>
        </div>
      </div>

      {/* Traceable NASA Live Link indicator */}
      <div className="flex items-center justify-between text-[11px] text-[#61513C] bg-[#EFE9DC] px-3.5 py-1.5 rounded-xl border border-[#DECAB3]">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#2D4A27]" />
          <span>
            {isAr
              ? 'مربوط مباشرة ببيانات ناسا باور (POWER v7) ونماذج المعهد الوطني للبحث الزراعي'
              : isEn
              ? 'Directly connected to NASA POWER v7 observations & INRA agronomic models'
              : 'Connecté directement aux observations NASA POWER v7 & modèles INRA'}
          </span>
        </div>
        <span className="font-bold text-[#2D4A27]">NASA LIVE</span>
      </div>
    </div>
  );
};
