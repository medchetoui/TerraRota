import React, { useState } from 'react';
import {
  Sliders,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Droplets,
  Thermometer,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { runWhatIf } from '../api/client';
import type { WhatIfSimulation } from '../types/api';
import { translateCrop } from '../i18n/translations';

type Lang = 'ar' | 'fr' | 'en';

interface SimulatorPageProps {
  lat: number;
  lon: number;
  defaultPrevCrop: string;
  defaultWater: string;
  soilType?: string; // à passer depuis App.tsx pour que le score initial soit identique à la page de recommandation
  regionName: string;
  lang: Lang;
}

// Champs renvoyés par le nouveau simulator.py (optionnels : l'ancien backend reste supporté)
interface SimChange {
  type: 'rain' | 'temperature' | 'water_access' | 'previous_crop' | 'priorities';
  before?: number | string;
  after?: number | string | Record<string, number>;
  percent?: number;
  delta?: number;
}
type SimulationResult = WhatIfSimulation & {
  changes?: SimChange[];
  winner_before_id?: string | null;
  winner_after_id?: string | null;
};

const WATER_LABELS: Record<string, Record<Lang, string>> = {
  rainfed: { ar: 'بوري', fr: 'pluvial', en: 'rainfed' },
  irrigated: { ar: 'مسقي', fr: 'irrigué', en: 'irrigated' },
  partial: { ar: 'ري تكميلي', fr: "irrigation d'appoint", en: 'partially irrigated' },
};
const waterLabel = (w: unknown, lang: Lang): string => WATER_LABELS[String(w)]?.[lang] ?? String(w);

const signed = (n: number | undefined): string => {
  const v = n ?? 0;
  return v > 0 ? `+${v}` : `${v}`;
};

// Texte d'une modification, construit à partir des DONNÉES (plus de valeurs codées en dur)
const describeChange = (c: SimChange, lang: Lang): string => {
  const arrow = lang === 'ar' ? '←' : '→';
  switch (c.type) {
    case 'rain': {
      const pct = c.percent !== undefined ? ` (${signed(c.percent)}%)` : '';
      return lang === 'ar'
        ? `هطول الأمطار: ${c.before} مم ${arrow} ${c.after} مم${pct}`
        : lang === 'en'
        ? `Annual rainfall: ${c.before} mm ${arrow} ${c.after} mm${pct}`
        : `Précipitations annuelles : ${c.before} mm ${arrow} ${c.after} mm${pct}`;
    }
    case 'temperature': {
      const d = c.delta !== undefined ? ` (${signed(c.delta)}°C)` : '';
      return lang === 'ar'
        ? `متوسط الحرارة: ${c.before}°C ${arrow} ${c.after}°C${d}`
        : lang === 'en'
        ? `Mean temperature: ${c.before}°C ${arrow} ${c.after}°C${d}`
        : `Température moyenne : ${c.before}°C ${arrow} ${c.after}°C${d}`;
    }
    case 'water_access':
      return lang === 'ar'
        ? `نظام الري: ${waterLabel(c.before, lang)} ${arrow} ${waterLabel(c.after, lang)}`
        : lang === 'en'
        ? `Water regime: ${waterLabel(c.before, lang)} ${arrow} ${waterLabel(c.after, lang)}`
        : `Régime hydrique : ${waterLabel(c.before, lang)} ${arrow} ${waterLabel(c.after, lang)}`;
    case 'previous_crop': {
      const after = translateCrop(String(c.after ?? ''), lang);
      const value = c.before ? `${translateCrop(String(c.before), lang)} ${arrow} ${after}` : after;
      return lang === 'ar'
        ? `المحصول السابق: ${value}`
        : lang === 'en'
        ? `Previous crop: ${value}`
        : `Précédent cultural : ${value}`;
    }
    case 'priorities': {
      const a = (c.after ?? {}) as Record<string, number>;
      if (a.soil_health) {
        return lang === 'ar' ? 'الأولوية: صحة التربة' : lang === 'en' ? 'Priority: soil health' : 'Priorité : santé du sol';
      }
      if (a.profitability) {
        return lang === 'ar' ? 'الأولوية: المردودية' : lang === 'en' ? 'Priority: profitability' : 'Priorité : rentabilité';
      }
      return lang === 'ar' ? 'أولويات المزرعة معدّلة' : lang === 'en' ? 'Farm priorities updated' : "Priorités d'exploitation modifiées";
    }
    default:
      return '';
  }
};

// Repli pour l'ancien backend (phrases françaises) : on lit les valeurs dans le texte
const translateLegacyChange = (text: string, lang: Lang): string => {
  const t = text.toLowerCase();

  const rain = text.match(/(\d+)\s*mm\s*→\s*(\d+)\s*mm/);
  if (rain) {
    const before = Number(rain[1]);
    const after = Number(rain[2]);
    return describeChange(
      { type: 'rain', before, after, percent: before ? Math.round((after / before - 1) * 100) : undefined },
      lang
    );
  }

  const temp = text.match(/([\d.]+)\s*°C\s*→\s*([\d.]+)\s*°C\s*\(([+-]?[\d.]+)\s*°C\)/i);
  if (temp) {
    return describeChange(
      { type: 'temperature', before: Number(temp[1]), after: Number(temp[2]), delta: Number(temp[3]) },
      lang
    );
  }

  if (t.includes('régime') || t.includes('hydrique') || t.includes('water')) {
    const pair = text.match(/:\s*(\w+)\s*→\s*(\w+)/);
    if (pair) return describeChange({ type: 'water_access', before: pair[1], after: pair[2] }, lang);
  }

  if (t.includes('précédent') || t.includes('previous')) {
    const crop = text.split(':')[1]?.trim() ?? '';
    return describeChange({ type: 'previous_crop', after: crop }, lang);
  }

  if (t.includes('priorit')) return describeChange({ type: 'priorities' }, lang);

  return text;
};

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  lat,
  lon,
  defaultPrevCrop,
  defaultWater,
  soilType,
  regionName,
  lang,
}) => {
  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  const [rainFactor, setRainFactor] = useState<number>(0.8); // -20% by default
  const [tempDelta, setTempDelta] = useState<number>(1.5);
  const [waterAccess, setWaterAccess] = useState<string>(defaultWater || 'rainfed');
  const [prevCrop, setPrevCrop] = useState<string>(defaultPrevCrop || 'wheat_hard');
  const [priorityMode, setPriorityMode] = useState<'standard' | 'soil_health' | 'profitability'>('standard');

  const [loading, setLoading] = useState<boolean>(false);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const simulatedChanges: Record<string, any> = {
        rain_factor: rainFactor,
        temp_delta: tempDelta,
        water_access: waterAccess,
        previous_crop: prevCrop,
      };

      if (priorityMode === 'soil_health') {
        simulatedChanges.farmer_priorities = { soil_health: 1.0, water_conservation: 0.5 };
      } else if (priorityMode === 'profitability') {
        simulatedChanges.farmer_priorities = { profitability: 1.0, lower_risk: 0.2 };
      }

      const res = await runWhatIf({
        latitude: lat,
        longitude: lon,
        previous_crop: defaultPrevCrop,
        water_access: defaultWater,
        // le type du sol doit aussi partir au backend (voir client.ts et la vue Django)
        ...(soilType ? { soil_type: soilType } : {}),
        simulated_changes: simulatedChanges,
      });

      if (res?.simulation) {
        setSimulation(res.simulation as SimulationResult);
      } else {
        setError(isAr ? 'تعذر تشغيل المحاكاة.' : isEn ? 'The simulation could not be run.' : "La simulation n'a pas pu être lancée.");
      }
    } catch (err) {
      console.error('Error running what-if simulation:', err);
      setError(
        isAr
          ? 'حدث خطأ أثناء المحاكاة. تحقق من الاتصال بالخادم.'
          : isEn
          ? 'Something went wrong during the simulation. Check the server connection.'
          : 'Une erreur est survenue pendant la simulation. Vérifiez la connexion au serveur.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Modifications affichées : données structurées en priorité, ancien format en repli
  const changeLabels: string[] = simulation
    ? simulation.changes
      ? simulation.changes.map((c) => describeChange(c, lang))
      : (simulation.changes_applied ?? []).map((ch) => translateLegacyChange(ch, lang))
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3] shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8C3A27] text-white text-xs font-bold">
          <Sliders className="w-4 h-4" />
          <span>{isAr ? 'محاكي الفرضيات والتغير المناخي' : isEn ? 'What-If Scenario Simulator' : 'Simulateur "Et Si ?"'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1E331A]">
          {isAr ? `اختبار الفرضيات الزراعية لـ ${regionName}` : isEn ? `Hypothesis Simulator: ${regionName}` : `Simulateur d'Hypothèses : ${regionName}`}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A6B53] max-w-3xl leading-relaxed">
          {isAr
            ? 'ماذا يحدث إذا انخفضت الأمطار بنسبة 20% ؟ أو إذا قمت بإدخال الري الموضعي ؟ غير الفرضيات أسفله ولاحظ كيف تتغير ترتيبات المحاصيل بدقة.'
            : isEn
            ? 'Simulate hypothetical climate variations (drought, warming, irrigation investments) to observe real-time recommendation rank changes without affecting NASA truth.'
            : 'Simulez des variations climatiques ou agronomiques hypothétiques (baisse de pluie, hausse de température, irrigation) pour analyser les répercussions sur le choix des cultures.'}
        </p>

        {/* Scientific Disclaimer */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-600/20 text-xs text-amber-900 flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            {isAr
              ? 'تنبيه علمي : تعديل هذه الفرضيات هو محاكاة افتراضية لأغراض الدراسة، ولا يغير القياسات التاريخية لأقمار ناسا.'
              : isEn
              ? 'Integrity Guarantee: These parameters are hypothetical simulations and in no way alter baseline NASA satellite truth.'
              : "Garantie d'intégrité : Ces paramètres sont des simulations hypothétiques et ne modifient en aucun cas les observations satellitaires NASA de référence."}
          </span>
        </div>
      </div>

      {/* Control Sliders & Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-[#FAF7F2] p-6 rounded-3xl border border-[#DECAB3] shadow-xs space-y-6">
          <h3 className="text-base font-extrabold text-[#1E331A] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#8C3A27]" />
            <span>{isAr ? 'المتغيرات الافتراضية للتجربة' : isEn ? 'Parameters to Adjust' : 'Paramètres à Modifier'}</span>
          </h3>

          {/* Rainfall Factor */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#1E331A]">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-700" />
                <span>{isAr ? 'تغير نسبة الأمطار' : isEn ? 'Rainfall Variation' : 'Variation des Pluies'}</span>
              </span>
              <span className="text-[#8C3A27] font-black">
                {rainFactor === 1.0 ? (isAr ? '0% (مناخ ناسا الفعلي)' : isEn ? '0% (NASA Real Climate)' : '0% (Climat NASA Réel)') : `${Math.round((rainFactor - 1.0) * 100)}%`}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={rainFactor}
              onChange={(e) => setRainFactor(parseFloat(e.target.value))}
              className="w-full accent-[#8C3A27] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7A6B53]">
              <span>{isAr ? '-50% (جفاف حاد)' : isEn ? '-50% (Severe Drought)' : '-50% (Sécheresse sévère)'}</span>
              <span>{isAr ? 'بيانات ناسا الحالية' : isEn ? 'NASA Current' : 'NASA Actuel'}</span>
              <span>{isAr ? '+50% (سنة مطيرة)' : isEn ? '+50% (Wet Year)' : '+50% (Année humide)'}</span>
            </div>
          </div>

          {/* Temperature Delta */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-[#1E331A]">
              <span className="flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-700" />
                <span>{isAr ? 'ارتفاع معدل الحرارة (+°C)' : isEn ? 'Average Warming (+°C)' : 'Réchauffement Moyen (+°C)'}</span>
              </span>
              <span className="text-[#8C3A27] font-black">+{tempDelta.toFixed(1)} °C</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="4.0"
              step="0.5"
              value={tempDelta}
              onChange={(e) => setTempDelta(parseFloat(e.target.value))}
              className="w-full accent-[#8C3A27] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7A6B53]">
              <span>0 °C</span>
              <span>+2 °C (IPCC 2050)</span>
              <span>+4 °C ({isAr ? 'أقصى سيناريو' : isEn ? 'Extreme' : 'Extrême'})</span>
            </div>
          </div>

          {/* Water Access Toggle */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1E331A]">{isAr ? 'نظام الري' : isEn ? 'Irrigation Regime' : "Régime d'Irrigation"}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWaterAccess('rainfed')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  waterAccess === 'rainfed' ? 'bg-[#8C3A27] text-white border-[#8C3A27]' : 'bg-[#EFE9DC] text-[#4D3F2C] border-[#DECAB3]'
                }`}
              >
                🌧️ {isAr ? 'بوري (مطري)' : isEn ? 'Rainfed (Bour)' : 'Pluvial (Bour)'}
              </button>
              <button
                type="button"
                onClick={() => setWaterAccess('irrigated')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  waterAccess === 'irrigated' ? 'bg-[#2D4A27] text-white border-[#2D4A27]' : 'bg-[#EFE9DC] text-[#4D3F2C] border-[#DECAB3]'
                }`}
              >
                💧 {isAr ? 'مسقي (ري بالتنقيط)' : isEn ? 'Irrigated (Drip)' : 'Irrigué (Goutte-à-goutte)'}
              </button>
            </div>
          </div>

          {/* Previous Crop Toggle */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1E331A]">{isAr ? 'المحصول السابق المفترض' : isEn ? 'Simulated Previous Crop' : 'Précédent Cultural Simulé'}</label>
            <select
              value={prevCrop}
              onChange={(e) => setPrevCrop(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#EFE9DC] border border-[#DECAB3] text-xs font-bold text-[#3B3020] outline-none cursor-pointer"
            >
              <option value="wheat_hard">🌾 {isAr ? 'القمح الصلب' : isEn ? 'Durum Wheat' : 'Blé dur'}</option>
              <option value="wheat_soft">🍞 {isAr ? 'القمح الطري' : isEn ? 'Soft Wheat' : 'Blé tendre'}</option>
              <option value="barley">🌾 {isAr ? 'الشعير' : isEn ? 'Barley' : 'Orge'}</option>
              <option value="chickpea">🫘 {isAr ? 'الحمص (مثبت للأزوت)' : isEn ? 'Chickpea (N-Fixing)' : 'Pois chiche (Légumineuse fixatrice N)'}</option>
              <option value="fallow">🌿 {isAr ? 'راحة الأرض (فالاو)' : isEn ? 'Fallow (Rested soil)' : 'Jachère (Sol reposé)'}</option>
              <option value="potato">🥔 {isAr ? 'البطاطس' : isEn ? 'Potato' : 'Pomme de terre'}</option>
            </select>
          </div>

          {/* Priority Mode */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1E331A]">{isAr ? 'التوجه الاستراتيجي' : isEn ? 'Priority Orientation' : 'Orientation Prioritaire'}</label>
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPriorityMode('standard')}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  priorityMode === 'standard' ? 'bg-[#2D4A27] text-white' : 'bg-[#EFE9DC] text-[#61513C]'
                }`}
              >
                {isAr ? 'متوازن' : isEn ? 'Balanced' : 'Équilibré'}
              </button>
              <button
                type="button"
                onClick={() => setPriorityMode('soil_health')}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  priorityMode === 'soil_health' ? 'bg-[#2D4A27] text-white' : 'bg-[#EFE9DC] text-[#61513C]'
                }`}
              >
                {isAr ? 'صحة التربة' : isEn ? 'Soil Health' : 'Santé du Sol'}
              </button>
              <button
                type="button"
                onClick={() => setPriorityMode('profitability')}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  priorityMode === 'profitability' ? 'bg-[#2D4A27] text-white' : 'bg-[#EFE9DC] text-[#61513C]'
                }`}
              >
                {isAr ? 'المردودية' : isEn ? 'Profitability' : 'Rentabilité'}
              </button>
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunSimulation}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#8C3A27] hover:bg-[#732F1F] text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>{isAr ? 'تشغيل المحاكاة الآن' : isEn ? 'Run Simulation' : 'Lancer la Simulation'}</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          {simulation ? (
            <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#DECAB3] shadow-xs space-y-6">
              {/* Winner Transition (par identifiant de culture, traduit dans la langue courante) */}
              <div className="p-5 rounded-2xl bg-[#EFE9DC] border border-[#DECAB3] flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-[11px] font-bold text-[#7A6B53]">
                    {isAr ? 'الخيار رقم 1 قبل المحاكاة' : isEn ? 'Top Choice Before Simulation' : 'Choix N°1 avant simulation'}
                  </div>
                  <div className="text-lg font-black text-[#1E331A]">
                    {translateCrop(simulation.winner_before_id || simulation.winner_before, lang)}
                  </div>
                </div>
                {isAr ? (
                  <ArrowLeft className="w-6 h-6 text-[#8C3A27] hidden sm:block" />
                ) : (
                  <ArrowRight className="w-6 h-6 text-[#8C3A27] hidden sm:block" />
                )}
                <div>
                  <div className="text-[11px] font-bold text-[#8C3A27]">
                    {isAr ? 'الخيار رقم 1 بعد المحاكاة' : isEn ? 'Top Choice AFTER Simulation' : 'Choix N°1 APRÈS simulation'}
                  </div>
                  <div className="text-xl font-black text-[#8C3A27]">
                    {translateCrop(simulation.winner_after_id || simulation.winner_after, lang)}
                  </div>
                </div>
              </div>

              {/* Changes applied list */}
              <div>
                <h4 className="text-xs font-bold text-[#8C3A27] uppercase tracking-wider mb-2">
                  {isAr ? 'التعديلات المطبقة' : isEn ? 'Applied Modifications' : 'Modifications appliquées'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {changeLabels.length === 0 ? (
                    <span className="text-xs text-[#7A6B53] font-semibold">
                      {isAr ? 'لا توجد تعديلات' : isEn ? 'No changes applied' : 'Aucune modification'}
                    </span>
                  ) : (
                    changeLabels.map((label, i) => (
                      <span key={i} className="text-xs bg-[#EFE9DC] text-[#4D3F2C] px-3 py-1 rounded-full font-semibold border border-[#DECAB3]">
                        {label}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Crop Comparisons Table */}
              <div>
                <h4 className="text-xs font-bold text-[#1E331A] mb-3">
                  {isAr ? 'الأثر على نقاط التوافق (قبل مقابل بعد)' : isEn ? 'Impact on Crop Affinity Scores (Before vs After)' : "Impact sur les Scores d'Affinité (Avant vs Après)"}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#DECAB3] text-[#7A6B53] font-bold">
                        <th className="py-2">{isAr ? 'المحصول' : isEn ? 'Crop' : 'Culture'}</th>
                        <th className="py-2 text-center">{isAr ? 'النقاط الأولية' : isEn ? 'Initial Score' : 'Score Initial'}</th>
                        <th className="py-2 text-center">{isAr ? 'النقاط بالمحاكاة' : isEn ? 'Simulated Score' : 'Score Simulé'}</th>
                        <th className="py-2 text-center">{isAr ? 'التطور' : isEn ? 'Trend' : 'Évolution'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DECAB3]/50">
                      {/* Toutes les cultures : les cultures éliminées par la simulation ne sont plus coupées */}
                      {simulation.crop_comparisons.map((c) => (
                        <tr key={c.crop_id} className="hover:bg-[#EFE9DC]/40">
                          <td className="py-2.5 font-bold text-[#1E331A] flex items-center gap-1.5">
                            <span>{c.crop_emoji}</span>
                            <span>{isAr ? c.crop_name_ar : isEn ? (c.crop_name_en || c.crop_name_fr) : c.crop_name_fr}</span>
                          </td>
                          <td className="py-2.5 text-center font-bold text-[#7A6B53]">
                            {c.score_before !== null ? `${c.score_before}%` : (isAr ? 'مستبعد' : isEn ? 'Excluded' : 'Exclu')}
                          </td>
                          <td className="py-2.5 text-center font-black text-[#1E331A]">
                            {c.score_after !== null ? `${c.score_after}%` : <span className="text-red-700">{isAr ? 'غير مناسب' : isEn ? 'Not Viable' : 'Non viable'}</span>}
                          </td>
                          <td className="py-2.5 text-center">
                            {c.status_change === 'improved' && (
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-black">
                                <TrendingUp className="w-3.5 h-3.5" />
                                +{c.delta}
                              </span>
                            )}
                            {c.status_change === 'degraded' && (
                              <span className="inline-flex items-center gap-0.5 text-red-700 font-black">
                                <TrendingDown className="w-3.5 h-3.5" />
                                {c.delta}
                              </span>
                            )}
                            {c.status_change === 'unchanged' && (
                              <span className="text-[#7A6B53] font-bold">—</span>
                            )}
                            {c.status_change === 'became_ineligible' && (
                              <span className="text-red-700 text-[10px] bg-red-100 px-2 py-0.5 rounded-full font-bold">
                                {isAr ? 'أُقصي' : isEn ? 'Eliminated' : 'Éliminé'}
                              </span>
                            )}
                            {c.status_change === 'became_eligible' && (
                              <span className="text-emerald-700 text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                                {isAr ? 'مؤهل' : isEn ? 'Eligible' : 'Éligible'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#FAF7F2] p-12 rounded-3xl border border-[#DECAB3] text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#8C3A27] mx-auto opacity-75" />
              <p className="text-sm font-bold text-[#1E331A]">
                {isAr ? 'اختر التغييرات الافتراضية واضغط "تشغيل المحاكاة الآن"' : isEn ? 'Adjust simulation parameters and click "Run Simulation"' : 'Ajustez les paramètres à gauche et cliquez sur "Lancer la Simulation"'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};