import { useContext, useState } from 'react';
import { AppContext, type FormData } from '../App';
import { StepHeader, FormField, TextInput, NavButtons, PageWrapper } from './ui';

interface LocationStepProps {
  form: FormData;
  setForm: (f: FormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function LocationStep({ form, setForm, onNext, onBack }: LocationStepProps) {
  const { t } = useContext(AppContext);
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

      <div className="glass-card p-6">
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Entrez les coordonnées GPS de votre parcelle. Utilisez Google Maps ou un GPS pour trouver les coordonnées exactes.
        </p>

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
        <div className="mt-2">
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Lieux de référence (Maroc) :
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Marrakech', lat: '31.63', lon: '-8.00' },
              { label: 'Agadir', lat: '30.43', lon: '-9.60' },
              { label: 'Fès', lat: '34.03', lon: '-5.00' },
              { label: 'Beni Mellal', lat: '32.33', lon: '-6.35' },
            ].map(({ label, lat, lon }) => (
              <button
                key={label}
                onClick={() => setForm({ ...form, latitude: lat, longitude: lon })}
                className="px-3 py-1 rounded-full text-xs transition-all hover:opacity-80"
                style={{ background: 'rgba(107,158,107,0.15)', border: '1px solid rgba(107,158,107,0.3)', color: 'var(--color-sage-light)' }}
              >
                📍 {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <NavButtons onBack={onBack} onNext={handleNext} nextLabel={t('nextBtn')} />
    </PageWrapper>
  );
}
