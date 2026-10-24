import { useContext, useState } from 'react';
import { AppContext, type FormData } from '../App';
import type { RecommendationResponse, CropRecommendation, Indicators } from '../types/api';

interface ResultsScreenProps {
  result: RecommendationResponse;
  form: FormData;
  onRevise: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'var(--color-sage)' :
    score >= 45 ? 'var(--color-gold)' :
    'var(--color-terracotta)';

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-12 h-12">
        <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${(score / 100) * 94.25} 94.25`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
    </div>
  );
}

function CropCard({ rec, rank }: { rec: CropRecommendation; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 1);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: rank === 1 ? 'rgba(193,68,14,0.1)' : 'rgba(22,33,17,0.8)',
        border: `1px solid ${rank === 1 ? 'rgba(193,68,14,0.4)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-4 p-4 text-left"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="text-3xl">{rec.crop_emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            {rank === 1 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'var(--color-gold)', color: '#1a0f00' }}>
                ★ N°1
              </span>
            )}
            <span className="font-bold text-base">{rec.crop_name_fr}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {rec.crop_name_ar}
            </span>
            {rec.is_provisional && (
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(212,160,23,0.15)', color: 'var(--color-gold)', border: '1px solid rgba(212,160,23,0.3)' }}>
                ⚠️ Provisoire
              </span>
            )}
          </div>
        </div>
        <ScoreBadge score={rec.score} />
        <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Reasons */}
          {rec.reasons.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sage-light)' }}>
                ✅ Points positifs
              </p>
              <ul className="space-y-1">
                {rec.reasons.map((r, i) => (
                  <li key={i} className="text-xs pl-3" style={{ color: 'var(--color-text-muted)', borderLeft: '2px solid var(--color-sage)' }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cautions */}
          {rec.cautions.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--color-gold)' }}>
                ⚠️ Mises en garde
              </p>
              <ul className="space-y-1">
                {rec.cautions.map((c, i) => (
                  <li key={i} className="text-xs pl-3" style={{ color: 'var(--color-text-muted)', borderLeft: '2px solid var(--color-gold)' }}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Infos */}
          {rec.infos?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--color-sky)' }}>
                ℹ️ Informations
              </p>
              <ul className="space-y-1">
                {rec.infos.map((info, i) => (
                  <li key={i} className="text-xs pl-3" style={{ color: 'var(--color-text-muted)', borderLeft: '2px solid var(--color-sky)' }}>
                    {info}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing data */}
          {rec.missing_data?.length > 0 && (
            <div className="rounded-lg p-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                📋 Données manquantes (amélioreraient les recommandations)
              </p>
              {rec.missing_data.map((m, i) => (
                <p key={i} className="text-xs" style={{ color: 'var(--color-text-muted)' }}>• {m}</p>
              ))}
            </div>
          )}

          {/* Provisional note */}
          {rec.is_provisional && rec.provisional_note && (
            <div className="rounded-lg p-3"
              style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)' }}>
              <p className="text-xs" style={{ color: 'var(--color-gold)' }}>
                ⚠️ {rec.provisional_note}
              </p>
            </div>
          )}

          {/* Rules applied */}
          {rec.rules_applied?.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
                Règles appliquées ({rec.rules_applied.length})
              </summary>
              <div className="mt-1 flex flex-wrap gap-1">
                {rec.rules_applied.map((r) => (
                  <code key={r} className="px-1.5 py-0.5 rounded text-xs"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }}>
                    {r}
                  </code>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function IndicatorCard({ indicators }: { indicators: Indicators }) {
  const items = [
    { label: 'Précipitations annuelles', value: `${indicators.annual_rain_mm?.toFixed(0)} mm`, icon: '🌧️' },
    { label: 'Température moyenne', value: `${indicators.mean_annual_temp_c?.toFixed(1)} °C`, icon: '🌡️' },
    { label: 'Degrés-jours (base 10°C)', value: `${indicators.gdd_base10?.toFixed(0)}`, icon: '☀️' },
    { label: 'Jours de gel / an', value: `${indicators.frost_days_per_year?.toFixed(1)}`, icon: '❄️' },
    { label: 'Indice d\'aridité', value: `${indicators.aridity_index?.toFixed(3)}`, icon: '🏜️' },
    { label: 'Mois secs / an', value: `${indicators.dry_months?.toFixed(1)}`, icon: '📅' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ label, value, icon }) => (
        <div key={label} className="rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)' }}>
          <div className="text-xl mb-1">{icon}</div>
          <div className="text-base font-bold">{value}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function ResultsScreen({ result, form, onRevise }: ResultsScreenProps) {
  const { t } = useContext(AppContext);
  const [showAbstained, setShowAbstained] = useState(false);

  const dataStatusColor =
    result.data_status === 'live' ? 'var(--color-sage)' :
    result.data_status === 'cached' ? 'var(--color-gold)' :
    'var(--color-terracotta)';

  const dataStatusLabel =
    result.data_status === 'live' ? t('nasaLive') :
    result.data_status === 'cached' ? t('nasaCached') :
    t('nasaSample');

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black gradient-text">{t('appName')}</h1>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', color: dataStatusColor }}>
          {dataStatusLabel}
        </div>
      </div>

      {/* Sample data warning */}
      {result.data_status === 'sample' && result.sample_note && (
        <div id="sample-data-warning" className="rounded-xl p-4 mb-5 text-sm font-medium"
          style={{ background: 'rgba(193,68,14,0.15)', border: '2px solid rgba(193,68,14,0.5)', color: 'var(--color-terracotta-light)' }}>
          {t('sampleDataWarning')}
        </div>
      )}

      {/* Insufficient data */}
      {result.data_status === 'insufficient_data' && (
        <div className="glass-card p-6 mb-5 text-center">
          <div className="text-4xl mb-3">📡</div>
          <h2 className="font-bold mb-2">{t('insufficientData')}</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {result.insufficient_data_reason}
          </p>
        </div>
      )}

      {/* Location summary */}
      <div className="flex items-center gap-2 mb-5 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        <span>📍</span>
        <span>Lat {form.latitude}, Lon {form.longitude}</span>
        {result.provenance?.period && (
          <span className="ml-auto text-xs">
            {result.provenance.period.start.slice(0, 4)}–{result.provenance.period.end.slice(0, 4)}
          </span>
        )}
      </div>

      {/* Climate indicators */}
      {result.indicators && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">📊 {t('indicators')}</h2>
          <IndicatorCard indicators={result.indicators} />
          {result.provenance && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Source : {result.provenance.source} · Résolution ~{result.provenance.spatial_resolution_deg ?? '?'}°
            </p>
          )}
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">🌾 {t('recommendations')}</h2>
          <div className="space-y-3">
            {result.recommendations.map((rec) => (
              <CropCard key={rec.crop_id} rec={rec} rank={rec.rank} />
            ))}
          </div>
        </div>
      ) : result.data_status !== 'insufficient_data' && (
        <div className="glass-card p-6 mb-6 text-center">
          <div className="text-3xl mb-2">🤔</div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {result.abstention_reason || t('noRecommendations')}
          </p>
        </div>
      )}

      {/* Abstained crops (collapsed) */}
      {result.abstained_crops?.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowAbstained(!showAbstained)}
            className="text-sm hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {showAbstained ? '▲' : '▼'} Cultures non éligibles ({result.abstained_crops.length})
          </button>
          {showAbstained && (
            <div className="mt-2 space-y-2">
              {result.abstained_crops.map((a) => (
                <div key={a.crop_id} className="rounded-xl px-4 py-3 flex justify-between items-start gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {a.crop_name_fr}
                  </span>
                  <span className="text-xs text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {a.reason}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Revise button */}
      <button
        id="revise-btn"
        onClick={onRevise}
        className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      >
        ← {t('reviseBtn')}
      </button>

      {/* Rules version */}
      {result.rules_version && (
        <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Moteur de règles : {result.rules_version}
        </p>
      )}
    </div>
  );
}
