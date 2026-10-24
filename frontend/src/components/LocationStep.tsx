import { useContext, useState } from 'react';
import { AppContext, type FormData } from '../App';
import { StepHeader, FormField, TextInput, NavButtons, PageWrapper } from './ui';
import { MapPin, Navigation, BookmarkCheck, Compass, Info, Check } from 'lucide-react';

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

  const moroccoRegions = [
    { label: 'Marrakech (Haouz)', lat: '31.63', lon: '-8.00', desc: 'Climat aride / semi-aride (Bour & Souss)' },
    { label: 'Agadir (Souss-Massa)', lat: '30.43', lon: '-9.60', desc: 'Zone côtière chaude, biosphère de l\'arganier' },
    { label: 'Fès (Saïss)', lat: '34.03', lon: '-5.00', desc: 'Grand bassin céréalier et arboricole' },
    { label: 'Beni Mellal (Tadla)', lat: '32.33', lon: '-6.35', desc: 'Plaine irriguée aux pieds de l\'Atlas' },
    { label: 'Kénitra (Gharb)', lat: '34.26', lon: '-6.58', desc: 'Zone côtière humide à fort potentiel maraîcher' },
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

  return (
    <PageWrapper>
      <StepHeader
        currentStep={1}
        totalSteps={3}
        title={t('step1')}
        subtitle="Définissez les coordonnées GPS précises de votre exploitation agricole au Maroc."
      />

      <div className="space-y-6">
        {/* Moroccan Agricultural Hub Presets Card */}
        <div className="glass-panel p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Pôles agricoles marocains
                </h3>
                <p className="text-xs text-slate-400">Sélectionnez un bassin agricole ou saisissez vos coordonnées personnalisées</p>
              </div>
            </div>

            {user && onOpenParcels && (
              <button
                type="button"
                onClick={onOpenParcels}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <BookmarkCheck className="w-4 h-4 text-emerald-400" />
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
                  onClick={() => setForm({ ...form, latitude: region.lat, longitude: region.lon })}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400 shadow-md shadow-emerald-950/40 text-white'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span className="font-bold text-xs">{region.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 pl-5 leading-snug">{region.desc}</p>
                    <div className="text-[10px] text-emerald-400/80 font-mono mt-1 pl-5">
                      {region.lat}° N, {region.lon}° W
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Precise GPS Coordinate Form */}
        <div className="glass-panel p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Coordonnées GPS (WGS84)
              </h3>
              <p className="text-xs text-slate-400">Précision recommandée à 4 décimales pour la grille NASA POWER (~50 km)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder="31.5200"
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
                placeholder="-8.7500"
                error={errors.longitude}
                step="0.0001"
              />
            </FormField>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Les données climatiques de la NASA couvrent l'intégralité du territoire marocain. Vous pouvez saisir les coordonnées GPS exactes depuis Google Maps ou votre smartphone.
            </span>
          </div>
        </div>

        <NavButtons onBack={onBack} onNext={handleNext} nextLabel={t('nextBtn')} />
      </div>
    </PageWrapper>
  );
}
