import React, { useState, useEffect } from 'react';
import { 
  BookmarkPlus, 
  MapPin, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { getParcels, deleteParcel, getPlans, type ParcelItem } from '../api/client';
import type { FarmPlan } from '../types/api';

interface FarmsPageProps {
  onSelectParcel: (parcel: ParcelItem) => void;
  lang: 'ar' | 'fr' | 'en';
}

export const FarmsPage: React.FC<FarmsPageProps> = ({ onSelectParcel, lang }) => {
  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  const [parcels, setParcels] = useState<ParcelItem[]>([]);
  const [plans, setPlans] = useState<FarmPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [parcelsRes, plansRes] = await Promise.all([
        getParcels().catch(() => ({ status: 'ok', parcels: [] })),
        getPlans().catch(() => ({ status: 'ok', plans: [] })),
      ]);
      setParcels(parcelsRes.parcels || []);
      setPlans(plansRes.plans || []);
    } catch (err) {
      console.error('Error loading farms/plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette parcelle ?')) return;
    try {
      await deleteParcel(id);
      loadData();
    } catch (err) {
      console.error('Error deleting parcel', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3] shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE9DC] text-xs font-bold text-[#2D4A27]">
          <BookmarkPlus className="w-4 h-4 text-[#8C3A27]" />
          <span>{isAr ? 'إدارة الأراضي والمخططات الفلاحية' : isEn ? 'My Farms & Rotation Plans' : 'Mes Parcelles & Plans de Rotation'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1E331A]">
          {isAr ? 'الضيعات والمخططات المحفوظة' : isEn ? 'Saved Farms & Rotation Plans' : 'Exploitations & Plans Enregistrés'}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A6B53] max-w-2xl">
          {isAr
            ? 'تتبع أراضيك الفلاحية، واسترجع التوصيات السابقة والمخططات المعتمدة لكل موسم زراعي.'
            : isEn
            ? 'Access your saved agricultural parcels and review the historical record of your approved crop-rotation plans.'
            : 'Consultez vos parcelles agricoles sauvegardées et retrouvez l\'historique de vos plans de rotation approuvés.'}
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm font-bold text-[#7A6B53]">{isAr ? 'جاري تحميل ضيعاتك...' : isEn ? 'Loading your farms...' : 'Chargement de vos exploitations...'}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Saved Parcels List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-extrabold text-[#1E331A] flex items-center justify-between">
              <span>{isAr ? 'الأراضي الفلاحية المحفوظة' : isEn ? 'Saved Parcels' : 'Parcelles Enregistrées'}</span>
              <span className="text-xs bg-[#EFE9DC] px-2.5 py-1 rounded-full text-[#7A6B53]">
                {parcels.length} {isAr ? 'أرض' : isEn ? 'parcel(s)' : 'parcelle(s)'}
              </span>
            </h3>

            {parcels.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF7F2] rounded-3xl border border-[#DECAB3] space-y-2">
                <MapPin className="w-8 h-8 text-[#DECAB3] mx-auto" />
                <p className="text-xs text-[#7A6B53]">
                  {isAr ? 'لا توجد أراضٍ محفوظة بعد. قم بحفظ نتيجة التوصية من الصفحة الرئيسية.' : isEn ? 'No parcels saved yet. Save a recommendation result from the main page.' : 'Aucune parcelle sauvegardée pour l\'instant.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {parcels.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#DECAB3] hover:border-[#2D4A27] transition-all shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="font-extrabold text-sm text-[#1E331A] flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#8C3A27]" />
                        <span>{p.name}</span>
                      </div>
                      <div className="text-xs text-[#7A6B53]">
                        {p.latitude.toFixed(4)}°N, {p.longitude.toFixed(4)}°E • {p.field_size_ha || 4.8} Ha • {p.water_access === 'irrigated' ? (isAr ? '💧 مسقي' : isEn ? '💧 Irrigated' : '💧 Irrigué') : (isAr ? '🌧️ بور' : isEn ? '🌧️ Rainfed' : '🌧️ Pluvial')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectParcel(p)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#2D4A27] hover:bg-[#1E331A] text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isAr ? 'تحليل' : isEn ? 'Analyze' : 'Analyser'}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                        title={isAr ? 'حذف' : isEn ? 'Delete' : 'Supprimer'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Plans List */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-base font-extrabold text-[#1E331A]">
              {isAr ? 'مخططات التناوب المعتمدة' : isEn ? 'Validated Rotation Plans' : 'Plans de Rotation Validés'}
            </h3>

            {plans.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF7F2] rounded-3xl border border-[#DECAB3] space-y-2">
                <Layers className="w-8 h-8 text-[#DECAB3] mx-auto" />
                <p className="text-xs text-[#7A6B53]">
                  {isAr ? 'لم يتم اعتماد أي مخطط بعد. انتقل إلى مخطط التناوب لاعتماد استراتيجية.' : isEn ? 'No validated rotation plans yet. Go to Rotation Planner to adopt a strategy.' : 'Aucun plan validé pour le moment.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((pl) => (
                  <div
                    key={pl.id}
                    className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#DECAB3] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#1E331A]">{pl.title}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        pl.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        pl.status === 'rejected' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {pl.status === 'approved' ? (isAr ? '✓ معتمد' : isEn ? '✓ Approved' : '✓ Approuvé') : pl.status === 'rejected' ? (isAr ? '✕ مرفوض' : isEn ? '✕ Rejected' : '✕ Rejeté') : (isAr ? 'مقترح' : isEn ? 'Proposed' : 'Proposé')}
                      </span>
                    </div>
                    {pl.selected_crop && (
                      <div className="text-xs text-[#8C3A27] font-bold">
                        {isAr ? `المحصول المعتمد: ${pl.selected_crop}` : isEn ? `Selected Crop: ${pl.selected_crop}` : `Culture retenue : ${pl.selected_crop}`}
                      </div>
                    )}
                    {pl.farmer_feedback && (
                      <div className="text-[11px] text-[#61513C] italic">
                        "{pl.farmer_feedback}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
