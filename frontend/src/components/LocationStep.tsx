import { useContext, useState } from 'react';
import { AppContext, type FormData } from '../App';
import { StepHeader, FormField, TextInput, NavButtons, PageWrapper } from './ui';
import { MapPin, Navigation, BookmarkCheck } from 'lucide-react';

interface LocationStepProps {
  form: FormData;
  setForm: (f: FormData) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenParcels?: () => void;
}

export default function LocationStep({ form, setForm, onNext, onBack, onOpenParcels }: LocationStepProps) {
  const { t, user } = useContext(AppContext);
  const [errors, setErrors] = useState<{ latitude?: string; longitude?: string }>({});

  function validate(): boolean {
    const errs: typeof errors = {};
    const lat = parseFloat(form.latitude);
    const lon = parseFloat(form.longitude);

    if (!form.latitude.trim()) {
      errs.latitude = t('requiredField');
    } else if (isNaN(lat) || lat < -90 || lat > 90) {
      errs.latitude = t('invalidLat');
    }

    if (!form.longitude.trim()) {
      errs.longitude = t('requiredField');
    } else if (isNaN(lon) || lon < -180 || lon > 180) {
      errs.longitude = t('invalidLon');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  return (
    <PageWrapper>
      <StepHeader currentStep={1} totalSteps={3} title={t('step1')} />

      <div className="glass-card p-6 border border-white/10 rounded-2xl bg-white/[0.02]">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-slate-400 leading-relaxed">
            Entrez les coordonnées géodésiques WGS84 de votre parcelle ou sélectionnez un pôle agricole marocain.
          </p>
          {user && onOpenParcels && (
            <button
              type="button"
              onClick={onOpenParcels}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors shrink-0 ml-3 cursor-pointer"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('myParcels')}</span>
            </button>
          )}
        </div>

        <FormField
          id="latitude"
          label={t('latitude')}
          error={errors.latitude}
          required
          help={t('latitudeHelp')}
        >
          <TextInput
            id="latitude"
            type="number"
            value={form.latitude}
            onChange={(v) => setForm({ ...form, latitude: v })}
            placeholder="31.52"
            error={errors.latitude}
            step="0.0001"
          />
        </FormField>

        <FormField
          id="longitude"
          label={t('longitude')}
          error={errors.longitude}
          required
          help={t('longitudeHelp')}
        >
          <TextInput
            id="longitude"
            type="number"
            value={form.longitude}
            onChange={(v) => setForm({ ...form, longitude: v })}
            placeholder="-8.75"
            error={errors.longitude}
            step="0.0001"
          />
        </FormField>

        {/* Quick presets for Morocco */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 mb-2.5 text-slate-400 text-xs">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pôles agricoles de référence (Maroc) :</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Marrakech (Haouz)', lat: '31.63', lon: '-8.00' },
              { label: 'Agadir (Souss)', lat: '30.43', lon: '-9.60' },
              { label: 'Fès (Saïss)', lat: '34.03', lon: '-5.00' },
              { label: 'Beni Mellal (Tadla)', lat: '32.33', lon: '-6.35' },
              { label: 'Kénitra (Gharb)', lat: '34.26', lon: '-6.58' },
            ].map(({ label, lat, lon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setForm({ ...form, latitude: lat, longitude: lon })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={handleNext} nextLabel={t('nextBtn')} />
    </PageWrapper>
  );
}
