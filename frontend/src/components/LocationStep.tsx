import { useContext, useState } from 'react';
import { AppContext, type FormData } from '../App';
import { StepHeader, FormField, TextInput, NavButtons, PageWrapper } from './ui';
import { MapPin, Navigation, BookmarkCheck, Compass, Info, Check, Crosshair, Satellite } from 'lucide-react';

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
  const [isLocating, setIsLocating] = useState(false);

  const moroccoRegions = [
    { label: 'Marrakech (Haouz)', lat: '31.63', lon: '-8.00', desc: 'Climat aride / semi-aride, plaines céréalières et oliveraies', tag: 'Aride / Bour' },
    { label: 'Agadir (Souss-Massa)', lat: '30.43', lon: '-9.60', desc: 'Zone côtière chaude, biosphère de l\'arganier et primeurs', tag: 'Chaud / Souss' },
    { label: 'Fès - Meknès (Saïss)', lat: '34.03', lon: '-5.00', desc: 'Grand bassin agricole fertile, céréales, vigne et oliviers', tag: 'Pluvial Saïss' },
    { label: 'Beni Mellal (Tadla)', lat: '32.33', lon: '-6.35', desc: 'Plaine irriguée aux pieds de l\'Atlas, arboriculture et maraîchage', tag: 'Irrigué Tadla' },
    { label: 'Kénitra (Gharb)', lat: '34.26', lon: '-6.58', desc: 'Zone côtière humide à fort potentiel maraîcher et rizicole', tag: 'Humide Gharb' },
    { label: 'Berkane (Moulouya)', lat: '34.92', lon: '-2.32', desc: 'Plaine orientale irriguée, réputée pour ses agrumes et cultures maraîchères', tag: 'Oriental' },
  ];

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

  function handleGetCurrentLocation() {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setForm({
          ...form,
          latitude: pos.coords.latitude.toFixed(4),
          longitude: pos.coords.longitude.toFixed(4),
        });
        setErrors({});
      },
      (err) => {
        setIsLocating(false);
        alert(`Impossible d'obtenir votre position : ${err.message}`);
      },
      { timeout: 10000 }
    );
  }

  return (
    <PageWrapper>
      <StepHeader
        currentStep={1}
        totalSteps={3}
        title={t('step1')}
        subtitle="Sélectionnez un grand bassin agricole marocain ou saisissez les coordonnées GPS précises de votre champ."
      />

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Moroccan Agricultural Hub Presets (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wide">
                    Bassins Agricoles du Maroc
                  </h3>
                  <p className="text-[11px] text-slate-400">Cliquez sur une région pour charger ses coordonnées moyennes</p>
                </div>
              </div>

              {user && onOpenParcels && (
                <button
                  type="button"
                  onClick={onOpenParcels}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('myParcels')}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {moroccoRegions.map((region) => {
                const isSelected = form.latitude === region.lat && form.longitude === region.lon;
                return (
                  <button
                    key={region.label}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, latitude: region.lat, longitude: region.lon });
                      setErrors({});
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400 shadow-sm shadow-emerald-950/40 text-white'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                        {region.label}
                      </span>
                      <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-black/40 text-emerald-400 border border-emerald-500/20">
                        {region.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {region.desc}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/5">
                      <span>{region.lat}° N, {region.lon}° W</span>
                      {isSelected && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                          <Check className="w-3 h-3" /> Sélectionné
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Vous cultivez dans une autre zone ?</span>
            <span className="text-emerald-400 font-medium">Saisissez vos coordonnées exactes à droite ➔</span>
          </div>
        </div>

        {/* Right Column: GPS Inputs & Tools (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wide">
                    Coordonnées GPS (WGS84)
                  </h3>
                  <p className="text-[11px] text-slate-400">Précision recommandée : 4 décimales</p>
                </div>
              </div>

              {/* Geolocation Button */}
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-300 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                title="Détecter ma position GPS actuelle"
              >
                <Crosshair className={`w-3 h-3 ${isLocating ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
                <span>{isLocating ? 'Localisation...' : 'GPS Direct'}</span>
              </button>
            </div>

            <div className="space-y-3">
              <FormField
                id="latitude"
                label={t('latitude')}
                error={errors.latitude}
                required
                help="Ex: 31.6295 (Marrakech)"
              >
                <TextInput
                  id="latitude"
                  value={form.latitude}
                  onChange={(v) => setForm({ ...form, latitude: v })}
                  placeholder="31.6295"
                  error={errors.latitude}
                />
              </FormField>

              <FormField
                id="longitude"
                label={t('longitude')}
                error={errors.longitude}
                required
                help="Ex: -7.9811 (Marrakech)"
              >
                <TextInput
                  id="longitude"
                  value={form.longitude}
                  onChange={(v) => setForm({ ...form, longitude: v })}
                  placeholder="-7.9811"
                  error={errors.longitude}
                />
              </FormField>
            </div>

            {/* Satellite Grid Info Box */}
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Satellite className="w-3.5 h-3.5" /> Maille NASA POWER
                </span>
                <span className="font-mono text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Résolution ~50 km
                </span>
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                Les séries temporelles quotidiennes (températures min/max, pluie, rayonnement solaire et vent) sont extraites en temps réel pour ces coordonnées.
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>Point de calcul :</span>
                <span className="text-white font-bold">
                  {form.latitude ? `${form.latitude}° N` : '—'}, {form.longitude ? `${form.longitude}° W` : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <NavButtons
              onBack={onBack}
              onNext={handleNext}
              nextLabel="Suivant : Parcelle & Sols"
              nextId="location-next-btn"
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
