import { useContext } from 'react';
import { AppContext, type FormData } from '../App';
import { StepHeader, FormField, SelectInput, NavButtons, PageWrapper, TextInput } from './ui';
import type { CropId, WaterAccess, SoilType } from '../types/api';
import { Sprout, Check, Droplets, Layers, Sparkles } from 'lucide-react';

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
        subtitle="Renseignez les caractéristiques hydriques, pédologiques et culturales de votre champ."
      />

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Water & Previous Crop */}
        <div className="lg:col-span-6 glass-panel p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Ressources & Historique
                </h3>
                <p className="text-[11px] text-slate-400">Régime hydrique et culture de la campagne précédente</p>
              </div>
            </div>

            <div className="space-y-3">
              <FormField id="water_access" label={t('waterAccess')} required help="Régime de votre parcelle">
                <SelectInput
                  id="water_access"
                  value={form.water_access}
                  onChange={(v) => setForm({ ...form, water_access: v as WaterAccess | '' })}
                  options={waterOptions}
                />
              </FormField>

              <FormField id="previous_crop" label={t('previousCrop')} help="Pour optimiser la rotation et éviter les maladies">
                <SelectInput
                  id="previous_crop"
                  value={form.previous_crop}
                  onChange={(v) => setForm({ ...form, previous_crop: v as CropId | '' })}
                  options={cropOptions}
                />
              </FormField>

              <FormField id="field_size_ha" label={t('fieldSize')} help="En hectares (ex: 4.5)">
                <TextInput
                  id="field_size_ha"
                  type="number"
                  value={form.field_size_ha}
                  onChange={(v) => setForm({ ...form, field_size_ha: v })}
                  placeholder="4.5"
                  step="0.1"
                />
              </FormField>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-amber-400 font-semibold">Conseil agronomique :</span> La rotation céréale-légumineuse (ex: blé après pois chiche) permet une fixation naturelle de l'azote atmosphérique et réduit le besoin en engrais de synthèse.
          </div>
        </div>

        {/* Right Column: Soil & Preferred Crops */}
        <div className="lg:col-span-6 glass-panel p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Pédologie & Objectifs
                </h3>
                <p className="text-[11px] text-slate-400">Texture du sol et cultures souhaitées</p>
              </div>
            </div>

            <FormField id="soil_type" label={t('soilType')} help="Texture prédominante de la terre">
              <SelectInput
                id="soil_type"
                value={form.soil_type}
                onChange={(v) => setForm({ ...form, soil_type: v as SoilType })}
                options={soilOptions}
              />
            </FormField>

            {/* Preferred crops chips */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    {t('preferredCrops')}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500">Optionnel (bonus +5 pts)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CROPS.map((cropId) => {
                  const selected = form.preferred_crops.includes(cropId);
                  return (
                    <button
                      key={cropId}
                      type="button"
                      onClick={() => togglePreferredCrop(cropId)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        selected
                          ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-950 font-bold'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{t(cropId)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3">
              <FormField id="notes" label={t('notes')} help="Pente, salinité, antécédents...">
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Ex: Sol profond, présence d'un puits équipé en énergie solaire..."
                  maxLength={500}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-black/40 border border-white/10 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-slate-100 placeholder-slate-600 resize-none outline-none transition-all"
                />
              </FormField>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <NavButtons onBack={onBack} onNext={onNext} nextLabel={t('nextBtn')} />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
