import { useContext, useState } from 'react';
import { AppContext, type FormData } from '../App';
import type { RecommendationResponse, CropRecommendation, Indicators } from '../types/api';
import { createParcel } from '../api/client';
import {
  Droplets,
  Thermometer,
  Sun,
  Snowflake,
  Wind,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  MapPin,
  Satellite,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Check,
  RotateCcw,
  Sparkles,
  TreeDeciduous,
  Wheat,
  CircleDot,
  Loader2,
} from 'lucide-react';

interface ResultsScreenProps {
  result: RecommendationResponse;
  form: FormData;
  onRevise: () => void;
  onOpenAuth: () => void;
}

function getCropIcon(category: string) {
  switch (category) {
    case 'cereal':
      return Wheat;
    case 'tree_crop':
      return TreeDeciduous;
    case 'legume':
    case 'vegetable':
    case 'cactus':
    default:
      return CircleDot;
  }
}

function ScoreBadge({ score }: { score: number }) {
  const strokeColor =
    score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  const textColor =
    score >= 70 ? 'text-emerald-400' : score >= 45 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15" fill="none"
            stroke={strokeColor}
            strokeWidth="3.2"
            strokeDasharray={`${(score / 100) * 94.25} 94.25`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute text-xs font-black ${textColor}`}>
          {score}
        </span>
      </div>
    </div>
  );
}

function CropCard({ rec, rank }: { rec: CropRecommendation; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 1);
  const CropIcon = getCropIcon(rec.crop_category);

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        rank === 1
          ? 'bg-gradient-to-r from-emerald-950/40 via-black/40 to-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/30'
          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
      }`}
    >
      <button
        type="button"
        className="w-full flex items-center gap-3.5 p-4 text-left cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          rank === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 text-slate-300 border border-white/10'
        }`}>
          <CropIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {rank === 1 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                Top 1
              </span>
            )}
            <h3 className="font-bold text-base text-slate-100 truncate">
              {rec.crop_name_fr}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400 font-medium">
              {rec.crop_name_ar}
            </span>
            {rec.is_provisional && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                Provisoire
              </span>
            )}
          </div>
        </div>

        <ScoreBadge score={rec.score} />

        <div className="text-slate-400 pl-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5 text-xs">
          {/* Reasons */}
          {rec.reasons.length > 0 && (
            <div>
              <p className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Facteurs favorables
              </p>
              <ul className="space-y-1">
                {rec.reasons.map((r, i) => (
                  <li key={i} className="pl-3 border-l-2 border-emerald-500/50 text-slate-300 leading-relaxed">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cautions */}
          {rec.cautions.length > 0 && (
            <div>
              <p className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Points de vigilance
              </p>
              <ul className="space-y-1">
                {rec.cautions.map((c, i) => (
                  <li key={i} className="pl-3 border-l-2 border-amber-500/50 text-slate-300 leading-relaxed">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Infos */}
          {rec.infos?.length > 0 && (
            <div>
              <p className="font-semibold text-sky-400 flex items-center gap-1.5 mb-1.5">
                <Info className="w-3.5 h-3.5" />
                Informations culturales
              </p>
              <ul className="space-y-1">
                {rec.infos.map((info, i) => (
                  <li key={i} className="pl-3 border-l-2 border-sky-500/50 text-slate-300 leading-relaxed">
                    {info}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rules applied tags */}
          {rec.rules_applied?.length > 0 && (
            <details className="pt-2 text-[11px] text-slate-400">
              <summary className="cursor-pointer hover:text-slate-200">
                Règles de décision validées ({rec.rules_applied.length})
              </summary>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {rec.rules_applied.map((rule) => (
                  <span
                    key={rule}
                    className="px-2 py-0.5 rounded bg-black/40 text-slate-400 border border-white/5 font-mono"
                  >
                    {rule}
                  </span>
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
    { label: 'Précipitations', value: `${indicators.annual_rain_mm?.toFixed(0)} mm`, icon: Droplets, sub: 'Cumul annuel' },
    { label: 'Température', value: `${indicators.mean_annual_temp_c?.toFixed(1)} °C`, icon: Thermometer, sub: 'Moyenne 2m' },
    { label: 'Degrés-jours', value: `${indicators.gdd_base10?.toFixed(0)}`, icon: Sun, sub: 'GDD base 10°C' },
    { label: 'Jours de gel', value: `${indicators.frost_days_per_year?.toFixed(1)} j/an`, icon: Snowflake, sub: 'Tmin < 0°C' },
    { label: 'Indice d\'aridité', value: `${indicators.aridity_index?.toFixed(3)}`, icon: Wind, sub: 'P / PET' },
    { label: 'Mois secs', value: `${indicators.dry_months?.toFixed(1)}`, icon: Calendar, sub: 'P < 2T' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {items.map(({ label, value, icon: Icon, sub }) => (
        <div
          key={label}
          className="rounded-xl p-3 bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-medium">{label}</span>
            <Icon className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-slate-100">{value}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
        </div>
      ))}
    </div>
  );
}

export default function ResultsScreen({ result, form, onRevise, onOpenAuth }: ResultsScreenProps) {
  const { t, user } = useContext(AppContext);
  const [showAbstained, setShowAbstained] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [parcelName, setParcelName] = useState(`Parcelle (${form.latitude}, ${form.longitude})`);
  const [showSaveInput, setShowSaveInput] = useState(false);

  const dataStatusClass =
    result.data_status === 'live'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : result.data_status === 'cached'
      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      : 'bg-rose-500/10 text-rose-300 border-rose-500/30';

  const dataStatusLabel =
    result.data_status === 'live'
      ? t('nasaLive')
      : result.data_status === 'cached'
      ? t('nasaCached')
      : t('nasaSample');

  const handleSaveParcel = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    setSaving(true);
    try {
      await createParcel({
        name: parcelName,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        water_access: form.water_access || '',
        soil_type: form.soil_type,
        field_size_ha: form.field_size_ha ? parseFloat(form.field_size_ha) : null,
        notes: form.notes,
      });
      setSaveSuccess(true);
      setShowSaveInput(false);
    } catch {
      alert("Erreur lors de l'enregistrement de la parcelle.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-slate-100 flex-1 flex flex-col justify-start">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">Rapport d'adéquation agro-climatique</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100">Recommandations</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${dataStatusClass}`}>
            <Satellite className="w-3.5 h-3.5" />
            <span>{dataStatusLabel}</span>
          </div>
        </div>
      </div>

      {/* Save parcel banner */}
      <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            {saveSuccess ? <BookmarkCheck className="w-5 h-5 text-emerald-400" /> : <Bookmark className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              {saveSuccess ? t('savedSuccess') : t('saveParcel')}
            </h2>
            <p className="text-xs text-slate-400">
              {user ? 'Conservez cette analyse dans votre compte' : t('authRequired')}
            </p>
          </div>
        </div>

        {!saveSuccess && (
          <div className="w-full sm:w-auto flex items-center gap-2">
            {showSaveInput ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={parcelName}
                  onChange={(e) => setParcelName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white"
                />
                <button
                  onClick={handleSaveParcel}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Confirmer</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!user) onOpenAuth();
                  else setShowSaveInput(true);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{user ? 'Sauvegarder' : t('login')}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Location Bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-6 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-slate-300">Lat {form.latitude}, Lon {form.longitude}</span>
        </div>
        {result.provenance?.period && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Période : {result.provenance.period.start.slice(0, 4)}–{result.provenance.period.end.slice(0, 4)}</span>
          </div>
        )}
      </div>

      {/* Climate Indicators Section */}
      {result.indicators && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{t('indicators')}</h2>
          </div>
          <IndicatorCard indicators={result.indicators} />
        </section>
      )}

      {/* Recommendations List */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">{t('recommendations')}</h2>
          </div>
          <span className="text-xs text-slate-400">{result.recommendations.length} cultures éligibles</span>
        </div>

        {result.recommendations.length > 0 ? (
          <div className="space-y-3">
            {result.recommendations.map((rec) => (
              <CropCard key={rec.crop_id} rec={rec} rank={rec.rank} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300">
              {result.abstention_reason || t('noRecommendations')}
            </p>
          </div>
        )}
      </section>

      {/* Abstained / Ineligible Crops */}
      {result.abstained_crops?.length > 0 && (
        <section className="mb-8">
          <button
            type="button"
            onClick={() => setShowAbstained(!showAbstained)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <span>Cultures non adaptées à ces contraintes ({result.abstained_crops.length})</span>
            {showAbstained ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAbstained && (
            <div className="mt-2 space-y-2">
              {result.abstained_crops.map((a) => (
                <div
                  key={a.crop_id}
                  className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-semibold text-slate-300">{a.crop_name_fr}</span>
                  <span className="text-slate-500 text-right">{a.reason}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Modify input button */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-6">
        <span className="text-xs text-slate-500">Prêt pour une nouvelle simulation de parcelle ?</span>
        <button
          id="revise-btn"
          onClick={onRevise}
          className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 inline-flex items-center gap-2 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('reviseBtn')}</span>
        </button>
      </div>
    </div>
  );
}
