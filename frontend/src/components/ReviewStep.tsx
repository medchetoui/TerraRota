import { useContext } from 'react';
import { AppContext, type FormData } from '../App';
import { NavButtons, PageWrapper } from './ui';

interface ReviewStepProps {
  form: FormData;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (step: 'location' | 'details') => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="text-sm font-medium text-right ml-4" style={{ color: 'var(--color-text)' }}>{value || '—'}</span>
    </div>
  );
}

export default function ReviewStep({ form, onSubmit, onBack, onEdit }: ReviewStepProps) {
  const { t } = useContext(AppContext);

  return (
    <PageWrapper>
      <div className="mb-6">
        <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Étape 3 / 3</p>
        <h2 className="text-2xl font-bold">{t('reviewTitle')}</h2>
      </div>

      {/* Location section */}
      <div className="glass-card p-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold" style={{ color: 'var(--color-gold)' }}>📍 {t('reviewCoords')}</h3>
          <button onClick={() => onEdit('location')} className="text-xs hover:opacity-80"
            style={{ color: 'var(--color-terracotta-light)' }}>Modifier</button>
        </div>
        <Row label={t('latitude')} value={form.latitude} />
        <Row label={t('longitude')} value={form.longitude} />
      </div>

      {/* Farm constraints */}
      <div className="glass-card p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold" style={{ color: 'var(--color-gold)' }}>🌾 {t('reviewConstraints')}</h3>
          <button onClick={() => onEdit('details')} className="text-xs hover:opacity-80"
            style={{ color: 'var(--color-terracotta-light)' }}>Modifier</button>
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

      {/* NASA note */}
      <div className="px-4 py-3 rounded-xl mb-4 text-sm"
        style={{ background: 'rgba(74,158,190,0.1)', border: '1px solid rgba(74,158,190,0.25)', color: 'var(--color-sky)' }}>
        🛰️ Le système va interroger NASA POWER pour récupérer les données climatiques des 5 dernières années pour ces coordonnées.
      </div>

      <button
        id="submit-btn"
        onClick={onSubmit}
        className="w-full py-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02]"
        style={{
          background: 'linear-gradient(135deg, var(--color-terracotta) 0%, var(--color-terracotta-light) 100%)',
          color: 'white',
          boxShadow: '0 8px 24px rgba(193,68,14,0.35)',
        }}
      >
        {t('submitBtn')} →
      </button>

      <button onClick={onBack} className="w-full py-3 mt-3 rounded-xl text-sm font-medium transition-all hover:opacity-70"
        style={{ background: 'transparent', color: 'var(--color-text-muted)' }}>
        ← {t('backBtn')}
      </button>
    </PageWrapper>
  );
}
