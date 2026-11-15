import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Droplets, 
  Sprout, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  BookmarkCheck,
  RefreshCw,
  Info,
  X
} from 'lucide-react';
import { getScenarios, createPlan, updatePlan } from '../api/client';
import type { Scenario, RecommendationResponse } from '../types/api';

interface RotationPlannerPageProps {
  apiResponse: RecommendationResponse | null;
  regionName: string;
  lat: number;
  lon: number;
  previousCrop: string;
  waterAccess: string;
  soilType: string;
  fieldSize: string;
  lang: 'ar' | 'fr' | 'en';
  onPlanSaved?: () => void;
}

export const RotationPlannerPage: React.FC<RotationPlannerPageProps> = ({
  apiResponse,
  regionName,
  lat,
  lon,
  previousCrop,
  waterAccess,
  soilType,
  fieldSize,
  lang,
  onPlanSaved,
}) => {
  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [approvalStatus, setApprovalStatus] = useState<'idle' | 'approving' | 'approved' | 'rejected'>('idle');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // Dictionnaire avec les CODES COURTS pour le backend
  const REJECTION_REASONS = [
    { key: 'water', fr: 'Besoins en eau excessifs', ar: 'احتياجات مائية مفرطة', en: 'Excessive water needs' },
    { key: 'seeds', fr: 'Semences non disponibles sur le marché local', ar: 'البذور غير متوفرة في السوق المحلية', en: 'Seeds not available in the local market' },
    { key: 'cash', fr: 'Contrainte de trésorerie / investissement initial', ar: 'قيود مالية / تكلفة الاستثمار الأولي', en: 'Cash flow constraint / initial investment' },
    { key: 'pref', fr: 'Préférence personnelle pour une autre culture', ar: 'تفضيل شخصي لمحصول آخر', en: 'Personal preference for another crop' },
  ];

  const getStrategyBadge = (scenario: Scenario) => {
    if (isAr) return (scenario as any).badge_ar || scenario.badge;
    if (isEn) return (scenario as any).badge_en || scenario.badge;
    return (scenario as any).badge_fr || scenario.badge;
  };

  useEffect(() => {
    async function loadScenarios() {
      setLoading(true);
      try {
        const res = await getScenarios({
          latitude: lat,
          longitude: lon,
          previous_crop: previousCrop as any,
          water_access: waterAccess as any,
          soil_type: soilType as any,
          field_size_ha: parseFloat(fieldSize) || 4.8,
        });
        if (res?.scenarios?.length) {
          setScenarios(res.scenarios);
        }
      } catch (err) {
        console.error('Error fetching scenarios:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScenarios();
  }, [lat, lon, previousCrop, waterAccess, soilType, fieldSize]);

  const activeScenario: Scenario | undefined = scenarios[selectedScenarioIndex];

  const handleApprovePlan = async () => {
    if (!activeScenario) return;
    setApprovalStatus('approving');
    try {
      await createPlan({
        // On envoie un titre neutre basé sur l'ID pour éviter le texte en dur
        title: `Plan Approuvé: ${activeScenario.id}`, 
        status: 'approved',
        selected_crop: activeScenario.crop_sequence[0]?.crop_id || 'chickpea',
        crop_sequence: activeScenario.crop_sequence,
        farmer_feedback: 'approved_by_farmer', // Code court au lieu de la phrase
      });
      setApprovalStatus('approved');
      if (onPlanSaved) onPlanSaved();
    } catch (err) {
      console.error('Error approving plan:', err);
      setApprovalStatus('idle');
    }
  };

  const handleRejectPlan = async () => {
    if (!activeScenario) return;
    
    // On récupère la clé du dictionnaire (ex: 'water', 'pref')
    const reasonKey = REJECTION_REASONS.find(r => 
      (isAr ? r.ar : isEn ? r.en : r.fr) === rejectionReason
    )?.key || 'pref';

    try {
      await createPlan({
        // Titre neutre
        title: `Plan Rejeté: ${activeScenario.id}`,
        status: 'rejected',
        selected_crop: activeScenario.crop_sequence[0]?.crop_id || '',
        rejection_reason: reasonKey, // On envoie le code court ("pref")
        crop_sequence: activeScenario.crop_sequence,
      });
      setApprovalStatus('rejected');
      setIsRejectModalOpen(false);
      if (onPlanSaved) onPlanSaved();
    } catch (err) {
      console.error('Error rejecting plan:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3] shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE9DC] text-xs font-bold text-[#8C3A27]">
          <Layers className="w-4 h-4" />
          <span>{isAr ? 'مخطط التناوب والمقارنة' : isEn ? 'Multi-Year Rotation Planner' : 'Planificateur & Comparateur de Scénarios'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1E331A]">
          {isAr ? `مقارنة استراتيجيات الدورة الزراعية لـ ${regionName}` : isEn ? `Soil Rotation Strategies: ${regionName}` : `Stratégies de Rotation des Sols : ${regionName}`}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A6B53] max-w-3xl leading-relaxed">
          {isAr
            ? 'يقترح محرك تيراروتا عدة بدائل علمية توازن بين تجديد التربة واستهلاك المياه والمردودية المالية، مع منح الفلاح القرار النهائي للموافقة أو التعديل.'
            : isEn
            ? 'Explore explainable multi-year rotation alternatives balancing soil regeneration, water savings, and profitability. The farmer maintains full decision control.'
            : 'Explorez plusieurs alternatives pluriannuelles équilibrant régénération des sols, économie d\'eau et rentabilité. L\'agriculteur garde le contrôle décisionnel.'}
        </p>
      </div>

      {loading ? (
        <div className="p-12 bg-[#FAF7F2] rounded-3xl border border-[#DECAB3] text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#8C3A27] mx-auto" />
          <p className="text-sm font-bold text-[#1E331A]">
            {isAr ? 'جاري توليد سيناريوهات التناوب الزراعي...' : isEn ? 'Generating agronomic rotation scenarios...' : 'Génération des scénarios de rotation agronomiques...'}
          </p>
        </div>
      ) : scenarios.length > 0 ? (
        <div className="space-y-6">
          {/* Scenario Selector Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {scenarios.map((sc, i) => (
              <button
                key={sc.id}
                onClick={() => {
                  setSelectedScenarioIndex(i);
                  setApprovalStatus('idle');
                }}
                className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  selectedScenarioIndex === i
                    ? 'bg-[#2D4A27] text-white border-[#2D4A27] shadow-md'
                    : 'bg-[#EFE9DC] text-[#4D3F2C] border-[#DECAB3] hover:bg-[#E5DDCF]'
                }`}
              >
                <div className="text-[10px] opacity-75 font-semibold">
                  #{i + 1} {getStrategyBadge(sc)}
                </div>
                <div>{isAr ? sc.title_ar : isEn ? sc.title_en : sc.title_fr}</div>
              </button>
            ))}
          </div>

          {/* Active Scenario Card */}
          {activeScenario && (
            <div className="bg-[#FAF7F2] rounded-3xl border-2 border-[#2D4A27] p-6 sm:p-8 shadow-md space-y-8">
              {/* Scenario Title & Badges */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <span className="text-xs font-extrabold px-3 py-1 bg-[#8C3A27] text-white rounded-full">
                    {getStrategyBadge(activeScenario)}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#1E331A] mt-2">
                    {isAr ? activeScenario.title_ar : isEn ? activeScenario.title_en : activeScenario.title_fr}
                  </h3>
                </div>

                {/* Status Badge */}
                {approvalStatus === 'approved' ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-700 text-white text-xs font-black shadow-sm">
                    <BookmarkCheck className="w-4 h-4" />
                    <span>{isAr ? 'تم اعتماد المخطط بنجاح ✓' : isEn ? 'Plan Officially Adopted ✓' : 'Plan Officiellement Approuvé ✓'}</span>
                  </div>
                ) : approvalStatus === 'rejected' ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-800 text-white text-xs font-black shadow-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{isAr ? 'تم رفض المخطط وتوثيق السبب' : isEn ? 'Plan Rejected / Under Review' : 'Plan Rejeté / En Révision'}</span>
                  </div>
                ) : null}
              </div>

              {/* 3-Year Crop Sequence Visual Timeline */}
              <div>
                <h4 className="text-xs font-bold text-[#8C3A27] uppercase tracking-wider mb-3">
                  {isAr ? 'تسلسل المحاصيل على مدى 3 سنوات' : isEn ? 'Multi-Year Horizon (3-Year Sequence)' : 'Horizon Pluriannuel (Séquence sur 3 Ans)'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {activeScenario.crop_sequence.map((step, idx) => (
                    <div 
                      key={step.year}
                      className="p-5 rounded-2xl bg-[#EFE9DC] border border-[#DECAB3] relative space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs text-[#7A6B53] font-bold">
                        <span>{isAr ? `السنة ${step.year} (${step.season})` : isEn ? `Year ${step.year} (${step.season})` : `Année ${step.year} (${step.season})`}</span>
                        <span className="text-xl">{step.crop_emoji}</span>
                      </div>
                      <div className="text-lg font-black text-[#1E331A]">
                        {isAr ? step.crop_name_ar : isEn ? (step.crop_name_en || step.crop_name_fr) : step.crop_name_fr}
                      </div>
                      <div className="text-[11px] text-[#8C3A27] font-semibold">
                        {idx === 0 
                          ? (isAr ? 'الموسم القادم (الزرع المباشر)' : isEn ? 'Year N+1 (Next Sowing)' : 'Année N+1 (Prochain semis)') 
                          : idx === 1 
                          ? (isAr ? 'السنة الثانية (المتابعة)' : isEn ? 'Year N+2 (Follow-up)' : 'Année N+2 (Suivi)') 
                          : (isAr ? 'السنة الثالثة (ختام الدورة)' : isEn ? 'Year N+3 (Cycle Closure)' : 'Année N+3 (Clôture cycle)')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Dimension Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#EFE9DC] border border-[#DECAB3] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1E331A]">
                    <span className="flex items-center gap-1.5">
                      <Sprout className="w-4 h-4 text-[#2D4A27]" />
                      <span>{isAr ? 'صحة التربة' : isEn ? 'Soil Health' : 'Santé du Sol'}</span>
                    </span>
                    <span className="font-black text-[#2D4A27]">{activeScenario.soil_health_score}/100</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/50 overflow-hidden">
                    <div className="h-full bg-[#2D4A27] rounded-full" style={{ width: `${activeScenario.soil_health_score}%` }}></div>
                  </div>
                  <div className="text-[11px] text-[#7A6B53]">
                    {isAr ? `تثبيت الأزوت: ${activeScenario.n_fixation_kg_ha}` : isEn ? `N-Fixation: ${activeScenario.n_fixation_kg_ha}` : `Fixation N : ${activeScenario.n_fixation_kg_ha}`}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#EFE9DC] border border-[#DECAB3] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1E331A]">
                    <span className="flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-cyan-700" />
                      <span>{isAr ? 'توفير المياه' : isEn ? 'Water Savings' : 'Économie d\'Eau'}</span>
                    </span>
                    <span className="font-black text-cyan-800">+{activeScenario.water_savings_pct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/50 overflow-hidden">
                    <div className="h-full bg-cyan-700 rounded-full" style={{ width: `${activeScenario.resilience_score}%` }}></div>
                  </div>
                  <div className="text-[11px] text-[#7A6B53]">
                    {isAr 
                      ? `الطلب المائي: ${(activeScenario as any).water_demand_level_ar || activeScenario.water_demand_level}` 
                      : isEn 
                      ? `Demand: ${(activeScenario as any).water_demand_level_en || activeScenario.water_demand_level}` 
                      : `Demande : ${(activeScenario as any).water_demand_level_fr || activeScenario.water_demand_level}`}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#EFE9DC] border border-[#DECAB3] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1E331A]">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-amber-700" />
                      <span>{isAr ? 'المردودية والربح' : isEn ? 'Margin / Profit' : 'Marge / Rentabilité'}</span>
                    </span>
                    <span className="font-black text-amber-800">{activeScenario.profitability_score}/100</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/50 overflow-hidden">
                    <div className="h-full bg-amber-700 rounded-full" style={{ width: `${activeScenario.profitability_score}%` }}></div>
                  </div>
                  <div className="text-[11px] text-[#7A6B53]">
                    {isAr ? `المرونة الإجمالية: ${activeScenario.resilience_score}%` : isEn ? `Overall Resilience: ${activeScenario.resilience_score}%` : `Résilience Globale : ${activeScenario.resilience_score}%`}
                  </div>
                </div>
              </div>

              {/* Advantages and Tradeoffs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#2D4A27] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'المكاسب والمزايا الزراعية' : isEn ? 'Agronomic Benefits' : 'Bénéfices Agronomiques'}</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#4D3F2C]">
                    {((isAr ? (activeScenario as any).advantages_ar : isEn ? (activeScenario as any).advantages_en : (activeScenario as any).advantages_fr) || activeScenario.advantages)?.map((adv: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-700 font-bold">•</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#8C3A27] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{isAr ? 'النقاط الواجب مراعاتها والمخاطر' : isEn ? 'Precautions & Tradeoffs' : 'Précautions & Arbitrages'}</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#4D3F2C]">
                    {((isAr ? (activeScenario as any).risks_ar : isEn ? (activeScenario as any).risks_en : (activeScenario as any).risks_fr) || activeScenario.risks)?.map((risk: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#8C3A27] font-bold">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Scientific Basis */}
              <div className="p-4 rounded-2xl bg-[#EFE9DC]/70 border border-[#DECAB3] text-xs text-[#61513C] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#2D4A27] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#1E331A]">{isAr ? 'الأساس العلمي:' : isEn ? 'Scientific Justification:' : 'Justification Scientifique :'}</strong>{' '}
                  {isAr 
                    ? ((activeScenario as any).scientific_basis_ar || activeScenario.scientific_basis) 
                    : isEn 
                    ? ((activeScenario as any).scientific_basis_en || activeScenario.scientific_basis) 
                    : ((activeScenario as any).scientific_basis_fr || activeScenario.scientific_basis)}
                </div>
              </div>

              {/* Farmer Decision Actions */}
              <div className="pt-4 border-t border-[#DECAB3] flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-[#7A6B53]">
                  {isAr 
                    ? 'القرار للفلاح : يمكنك اعتماد هذا المخطط، حفظه في حسابك، أو طلب بديل آخر.'
                    : isEn
                    ? 'Farmer Decision: Adopt this strategy, save to your profile, or request adjustments.'
                    : 'Workflow décisionnel : validez ce plan ou formulez vos réserves pour ajustement.'}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl border border-[#DECAB3] bg-[#EFE9DC] hover:bg-[#E5DDCF] text-xs font-bold text-[#8C3A27] transition-colors cursor-pointer"
                  >
                    {isAr ? 'رفض / طلب تعديل' : isEn ? 'Reject / Adjust' : 'Refuser / Modifier'}
                  </button>

                  <button
                    onClick={handleApprovePlan}
                    disabled={approvalStatus === 'approving' || approvalStatus === 'approved'}
                    className="px-6 py-2.5 rounded-xl bg-[#2D4A27] hover:bg-[#1E331A] text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <BookmarkCheck className="w-4 h-4" />
                    <span>
                      {approvalStatus === 'approved' 
                        ? (isAr ? 'المخطط معتمد' : isEn ? 'Plan Adopted ✓' : 'Plan Approuvé') 
                        : (isAr ? 'اعتماد هذا المخطط الفلاحي' : isEn ? 'Adopt this Strategy' : 'Adopter cette Stratégie')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Modal */}
          {isRejectModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-[#FAF7F2] p-6 rounded-3xl max-w-md w-full border border-[#DECAB3] shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-[#1E331A]">
                    {isAr ? 'سبب طلب التعديل أو الرفض' : isEn ? 'Reason for Review / Rejection' : 'Motif de révision du plan'}
                  </h4>
                  <button onClick={() => setIsRejectModalOpen(false)} className="text-[#7A6B53] hover:text-[#1E331A]">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-xs text-[#7A6B53]">
                  {isAr ? 'ساعدنا على تحسين الاقتراح : ما هو العائق الرئيسي؟' : isEn ? 'Help us improve the proposal: what is the main constraint?' : 'Indiquez la contrainte non satisfaite pour ajuster l\'algorithme :'}
                </p>

                <div className="space-y-2">
                  {REJECTION_REASONS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setRejectionReason(isAr ? r.ar : isEn ? r.en : r.fr)}
                      className={`w-full text-start p-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        rejectionReason === (isAr ? r.ar : isEn ? r.en : r.fr) 
                          ? 'bg-[#8C3A27] text-white border-[#8C3A27]' 
                          : 'bg-[#EFE9DC] text-[#4D3F2C] border-[#DECAB3]'
                      }`}
                    >
                      {isAr ? r.ar : isEn ? r.en : r.fr}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    onClick={() => setIsRejectModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#61513C] hover:bg-[#EFE9DC] cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : isEn ? 'Cancel' : 'Annuler'}
                  </button>
                  <button
                    onClick={handleRejectPlan}
                    className="px-5 py-2 rounded-xl bg-[#8C3A27] text-white text-xs font-bold cursor-pointer"
                  >
                    {isAr ? 'تأكيد' : isEn ? 'Confirm' : 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-[#FAF7F2] rounded-3xl border border-[#DECAB3]">
          <p className="text-xs text-[#7A6B53]">
            {isAr ? 'لا توجد سيناريوهات متاحة لهذه المعايير.' : isEn ? 'No scenarios available for these criteria.' : 'Aucun scénario disponible pour ces critères.'}
          </p>
        </div>
      )}
    </div>
  );
};