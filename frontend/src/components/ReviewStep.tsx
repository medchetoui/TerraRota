import { useContext } from 'react';
import { AppContext, type FormData } from '../App';
import { PageWrapper, StepHeader } from './ui';
import { MapPin, SlidersHorizontal, Satellite, ArrowRight, ArrowLeft, Edit3, CheckCircle } from 'lucide-react';

interface ReviewStepProps {
  form: FormData;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (step: 'location' | 'details') => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-white/5 last:border-b-0">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className="text-xs font-semibold text-slate-200 text-right ml-4">{value || '—'}</span>
    </div>
  );
}

export default function ReviewStep({ form, onSubmit, onBack, onEdit }: ReviewStepProps) {
  const { t } = useContext(AppContext);

  return (
    <PageWrapper>
      <StepHeader
        currentStep={3}
        totalSteps={3}
        title={t('reviewTitle')}
        subtitle="Vérifiez l'ensemble des paramètres saisis avant de lancer le calcul satellite NASA."
      />

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Location Section */}
        <div className="lg:col-span-5 glass-panel p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2 text-emerald-400">
                <MapPin className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-200">{t('reviewCoords')}</h3>
              </div>
              <button
                type="button"
                onClick={() => onEdit('location')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Modifier</span>
              </button>
            </div>
            <Row label={t('latitude')} value={`${form.latitude}° N`} />
            <Row label={t('longitude')} value={`${form.longitude}° W`} />
          </div>

          <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400">
            Coordonnées spatiales prêtes pour l'interrogation de la cellule NASA POWER correspondante.
          </div>
        </div>

        {/* Farm Constraints */}
        <div className="lg:col-span-7 glass-panel p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2 text-amber-400">
                <SlidersHorizontal className="w-4 h-4" />
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-200">{t('reviewConstraints')}</h3>
              </div>
              <button
                type="button"
                onClick={() => onEdit('details')}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Modifier</span>
              </button>
            </div>
            <Row label={t('waterAccess')} value={form.water_access ? t(form.water_access) : 'Non précisé'} />
            <Row label={t('previousCrop')} value={form.previous_crop ? t(form.previous_crop) : 'Aucune'} />
            <Row label={t('soilType')} value={t(form.soil_type)} />
            <Row label={t('fieldSize')} value={form.field_size_ha ? `${form.field_size_ha} ha` : '—'} />
            {form.preferred_crops.length > 0 && (
              <Row
                label={t('preferredCrops')}
                value={form.preferred_crops.map((c) => t(c)).join(', ')}
              />
            )}
            {form.notes && <Row label={t('notes')} value={form.notes} />}
          </div>
        </div>
      </div>

      {/* NASA feed note */}
      <div className="w-full p-4 rounded-xl mb-6 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-3 leading-relaxed">
        <Satellite className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
        <div>
          <span className="font-bold">Calcul Déterministe & Transparent :</span> Le backend va interroger l'API NASA POWER pour extraire les séries temporelles climatiques réelles sur 5 ans (2021–2025) et appliquer les règles agronomiques spécifiques au Maroc.
        </div>
      </div>

      {/* Refined compact button bar */}
      <div className="w-full flex items-center justify-between gap-3 pt-4 border-t border-white/10">
        <button
          onClick={onBack}
          type="button"
          className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('backBtn')}</span>
        </button>

        <button
          id="submit-btn"
          onClick={onSubmit}
          type="button"
          className="px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 text-slate-950 flex items-center gap-2 shadow-md shadow-emerald-950 transition-all cursor-pointer"
        >
          <span>{t('submitBtn')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </PageWrapper>
  );
}
