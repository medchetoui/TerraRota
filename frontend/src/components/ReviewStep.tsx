import { useContext } from 'react';
import { AppContext, type FormData } from '../App';
import { PageWrapper } from './ui';
import { MapPin, SlidersHorizontal, Satellite, ArrowRight, ArrowLeft, Edit3 } from 'lucide-react';

interface ReviewStepProps {
  form: FormData;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (step: 'location' | 'details') => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-white/5 last:border-b-0">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className="text-xs font-semibold text-slate-200 text-right ml-4">{value || '—'}</span>
    </div>
  );
}

export default function ReviewStep({ form, onSubmit, onBack, onEdit }: ReviewStepProps) {
  const { t } = useContext(AppContext);

  return (
    <PageWrapper>
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Étape 3 sur 3</span>
        <h2 className="text-2xl font-black text-slate-100">{t('reviewTitle')}</h2>
      </div>

      {/* Location section */}
      <div className="glass-card p-5 mb-4 border border-white/10 rounded-2xl bg-white/[0.02]">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <MapPin className="w-4 h-4" />
            <h3 className="font-bold text-sm text-slate-200">{t('reviewCoords')}</h3>
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
        <Row label={t('latitude')} value={form.latitude} />
        <Row label={t('longitude')} value={form.longitude} />
      </div>

      {/* Farm constraints */}
      <div className="glass-card p-5 mb-6 border border-white/10 rounded-2xl bg-white/[0.02]">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 text-amber-400">
            <SlidersHorizontal className="w-4 h-4" />
            <h3 className="font-bold text-sm text-slate-200">{t('reviewConstraints')}</h3>
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
        <Row label={t('previousCrop')} value={form.previous_crop ? t(form.previous_crop) : '—'} />
        <Row label={t('waterAccess')} value={form.water_access ? t(form.water_access) : '—'} />
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

      {/* NASA feed note */}
      <div className="p-4 rounded-xl mb-6 bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-3 leading-relaxed">
        <Satellite className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
        <span>Le système va interroger l'API NASA POWER pour extraire les séries temporelles satellitaires (2021–2025) et calculer les indices agro-climatiques de cette zone.</span>
      </div>

      <button
        id="submit-btn"
        onClick={onSubmit}
        className="w-full py-4 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-slate-950 flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all cursor-pointer"
      >
        <span>{t('submitBtn')}</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <button
        onClick={onBack}
        className="w-full py-3 mt-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{t('backBtn')}</span>
      </button>
    </PageWrapper>
  );
}
