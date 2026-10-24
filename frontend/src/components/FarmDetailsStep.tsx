import { useContext } from 'react';
import { AppContext, type FormData } from '../App';
import { StepHeader, FormField, SelectInput, NavButtons, PageWrapper, TextInput } from './ui';
import type { CropId, WaterAccess, SoilType } from '../types/api';
import { Sprout, Check } from 'lucide-react';

interface FarmDetailsStepProps {
  form: FormData;
  setForm: (f: FormData) => void;
  onNext: () => void;
  onBack: () => void;
}

const CROPS: CropId[] = [
  'wheat_hard', 'wheat_soft', 'barley', 'olive',
  'argan', 'tomato', 'chickpea', 'cactus_pear',
  'potato', 'almond',
];

export default function FarmDetailsStep({ form, setForm, onNext, onBack }: FarmDetailsStepProps) {
  const { t } = useContext(AppContext);

  const cropOptions = [
    { value: '', label: '— ' + t('none') + ' —' },
    ...CROPS.map((id) => ({ value: id, label: `${t(id)}` })),
  ];

  const waterOptions = [
    { value: '', label: '— Sélectionner —' },
    { value: 'rainfed', label: t('rainfed') },
    { value: 'irrigated', label: t('irrigated') },
    { value: 'partial', label: t('partial') },
  ];

  const soilOptions: { value: SoilType; label: string }[] = [
    { value: 'clay', label: t('clay') },
    { value: 'clay_loam', label: t('clay_loam') },
    { value: 'loam', label: t('loam') },
    { value: 'sandy_loam', label: t('sandy_loam') },
    { value: 'sandy', label: t('sandy') },
    { value: 'unknown', label: t('unknown') },
  ];

  function togglePreferredCrop(cropId: CropId) {
    const current = form.preferred_crops;
    if (current.includes(cropId)) {
      setForm({ ...form, preferred_crops: current.filter((c) => c !== cropId) });
    } else {
      setForm({ ...form, preferred_crops: [...current, cropId] });
    }
  }

  return (
    <PageWrapper>
      <StepHeader
        currentStep={2}
        totalSteps={3}
        title={t('step2')}
        subtitle="Renseignez l'historique et les caractéristiques pédologiques de votre parcelle."
      />

      <div className="glass-panel p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="previous_crop" label={t('previousCrop')}>
            <SelectInput
              id="previous_crop"
              value={form.previous_crop}
              onChange={(v) => setForm({ ...form, previous_crop: v as CropId | '' })}
              options={cropOptions}
            />
          </FormField>

          <FormField id="water_access" label={t('waterAccess')}>
            <SelectInput
              id="water_access"
              value={form.water_access}
              onChange={(v) => setForm({ ...form, water_access: v as WaterAccess | '' })}
              options={waterOptions}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="soil_type" label={t('soilType')}>
            <SelectInput
              id="soil_type"
              value={form.soil_type}
              onChange={(v) => setForm({ ...form, soil_type: v as SoilType })}
              options={soilOptions}
            />
          </FormField>

          <FormField id="field_size_ha" label={t('fieldSize')} help="En hectares (ex: 3.5)">
            <TextInput
              id="field_size_ha"
              type="number"
              value={form.field_size_ha}
              onChange={(v) => setForm({ ...form, field_size_ha: v })}
              placeholder="3.5"
              step="0.1"
            />
          </FormField>
        </div>

        {/* Preferred crops chips */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2.5">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {t('preferredCrops')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CROPS.map((cropId) => {
              const selected = form.preferred_crops.includes(cropId);
              return (
                <button
                  key={cropId}
                  type="button"
                  onClick={() => togglePreferredCrop(cropId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selected
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{t(cropId)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <FormField id="notes" label={t('notes')} help="Détails complémentaires (pente, salinité, etc.)">
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Ex: Parcelle en légère pente, sol limoneux profond, irrigation goutte-à-goutte disponible..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-black/40 border border-white/10 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-slate-100 placeholder-slate-600 resize-none outline-none transition-all"
          />
        </FormField>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel={t('nextBtn')} />
    </PageWrapper>
  );
}
