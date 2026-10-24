import { useContext } from 'react';
import { AppContext, type FormData } from '../App';
import { StepHeader, FormField, SelectInput, NavButtons, PageWrapper, TextInput } from './ui';
import type { CropId, WaterAccess, SoilType } from '../types/api';

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
      <StepHeader currentStep={2} totalSteps={3} title={t('step2')} />

      <div className="glass-card p-6">
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

        <FormField id="soil_type" label={t('soilType')}>
          <SelectInput
            id="soil_type"
            value={form.soil_type}
            onChange={(v) => setForm({ ...form, soil_type: v as SoilType })}
            options={soilOptions}
          />
        </FormField>

        <FormField id="field_size_ha" label={t('fieldSize')} help="En hectares (ex: 2.5)">
          <TextInput
            id="field_size_ha"
            type="number"
            value={form.field_size_ha}
            onChange={(v) => setForm({ ...form, field_size_ha: v })}
            placeholder="2.5"
            step="0.1"
          />
        </FormField>

        {/* Preferred crops */}
        <div className="mb-5">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
            {t('preferredCrops')}
          </p>
          <div className="flex flex-wrap gap-2">
            {CROPS.map((cropId) => {
              const selected = form.preferred_crops.includes(cropId);
              return (
                <button
                  key={cropId}
                  type="button"
                  onClick={() => togglePreferredCrop(cropId)}
                  aria-pressed={selected}
                  className="px-3 py-1.5 rounded-full text-sm transition-all"
                  style={{
                    background: selected ? 'rgba(193,68,14,0.25)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${selected ? 'rgba(193,68,14,0.6)' : 'rgba(255,255,255,0.12)'}`,
                    color: selected ? 'var(--color-terracotta-light)' : 'var(--color-text-muted)',
                  }}
                >
                  {t(cropId)}
                </button>
              );
            })}
          </div>
        </div>

        <FormField id="notes" label={t('notes')} help="Max 500 caractères">
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Terrain en pente, accès limité..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--color-text)',
              outline: 'none',
            }}
          />
        </FormField>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel={t('nextBtn')} />
    </PageWrapper>
  );
}
