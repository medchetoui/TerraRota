import { useContext } from 'react';
import { AppContext } from '../App';
import {
  Satellite,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Globe2,
  User as UserIcon,
  Leaf,
  Droplets,
  Sprout,
  FlaskConical,
  Zap,
} from 'lucide-react';

interface LandingProps {
  onStart: () => void;
  onOpenAuth: () => void;
  onOpenParcels: () => void;
}

export default function Landing({ onStart, onOpenAuth }: LandingProps) {
  const { t, user } = useContext(AppContext);

  return (
    <div
      className="w-full relative bg-[#070b08] text-slate-100 overflow-hidden"
      style={{ height: 'calc(100vh - 5rem)' }}
    >
      {/* ── Ambient Glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[1400px] h-[700px] rounded-full blur-[180px] opacity-[0.17]"
          style={{ background: 'radial-gradient(circle, #10b981 0%, #047857 50%, transparent 80%)' }}
        />
        <div
          className="absolute top-[40%] -right-[8%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.09]"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[0%] -left-[8%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.09]"
          style={{ background: 'radial-gradient(circle, #0284c7, transparent 70%)' }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col px-4 sm:px-8 lg:px-14 py-6 overflow-y-auto">
        {/* ─── SECTION 1: Hero ─────────────────────────────── */}
        <section className="flex-none text-center max-w-5xl mx-auto w-full pb-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 mb-6">
            <Satellite className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>NASA Space Apps Challenge 2026 • Défi Field Shift</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-black tracking-tight leading-[1.08] mb-5">
            <span className="text-white">AgTech Intelligente</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-200">
              pour le Maroc Agricole
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-medium max-w-2xl mx-auto mb-3 leading-relaxed">
            {t('tagline')}
          </p>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              id="start-btn"
              type="button"
              onClick={onStart}
              className="px-7 py-3.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 shadow-xl shadow-emerald-950/50 transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <Leaf className="w-4 h-4" />
              <span>{t('startBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-300 bg-white/5 hover:bg-white/10 border border-white/15 transition-all flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
            >
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span>{user ? user.username : 'Espace Agriculteur'}</span>
            </button>
          </div>
        </section>

        {/* ─── SECTION 2: Metrics Strip ──────────────────────── */}
        <section className="flex-none w-full mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.07] rounded-2xl overflow-hidden border border-white/10">
            {[
              { value: '1 826+', label: "Jours d'observations NASA", color: 'text-emerald-400' },
              { value: '10 Cultures', label: 'Blé, Olivier, Arganier, etc.', color: 'text-amber-400' },
              { value: '0.5° × 0.5°', label: 'Grille satellite (~50 km)', color: 'text-sky-400' },
              { value: '100%', label: 'Règles agronomiques vérifiables', color: 'text-slate-100' },
            ].map((m, i) => (
              <div key={i} className="text-center py-5 px-3 bg-[#070b08]/90 hover:bg-[#0d1610]/90 transition-colors">
                <div className={`text-2xl sm:text-3xl font-black ${m.color} mb-1`}>{m.value}</div>
                <div className="text-xs text-slate-400">{m.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECTION 3: Feature Cards Grid ─────────────────── */}
        <section className="flex-none w-full mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Satellite,
                title: 'Données Satellites Réelles',
                desc: 'Relevés quotidiens NASA POWER : température, précipitations, rayonnement.',
                tag: 'Précision',
                iconCls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                tagCls: 'text-emerald-400/90 bg-emerald-500/10 border-emerald-500/20',
                hoverBorder: 'hover:border-emerald-500/35',
              },
              {
                icon: Globe2,
                title: 'Écosystèmes Marocains',
                desc: 'Calibré pour le Haouz, Souss, Saïss, Tadla, Gharb et zones arides.',
                tag: 'Régional',
                iconCls: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                tagCls: 'text-amber-400/90 bg-amber-500/10 border-amber-500/20',
                hoverBorder: 'hover:border-amber-500/35',
              },
              {
                icon: ShieldCheck,
                title: 'Rotation & Sol Intelligents',
                desc: 'Évite les successions néfastes, valorise les légumineuses, préserve la fertilité.',
                tag: 'Agronomie',
                iconCls: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
                tagCls: 'text-sky-400/90 bg-sky-500/10 border-sky-500/20',
                hoverBorder: 'hover:border-sky-500/35',
              },
              {
                icon: BarChart3,
                title: 'Indices Agro-Climatiques',
                desc: 'GDD, Indice d\'Aridité, Gel et Stress Hydrique calculés rigoureusement.',
                tag: 'Décision',
                iconCls: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
                tagCls: 'text-violet-400/90 bg-violet-500/10 border-violet-500/20',
                hoverBorder: 'hover:border-violet-500/35',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className={`group p-5 rounded-xl bg-white/[0.025] ${item.hoverBorder} border border-white/10 transition-all duration-300 hover:bg-white/[0.05] hover:-translate-y-1 hover:shadow-xl cursor-default`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${item.iconCls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.tagCls}`}>
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── SECTION 4: Regions + Workflow + CTA ────────────── */}
        <section className="flex-1 w-full flex flex-col gap-3 min-h-0">
          {/* Two-column expandable panel */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
            {/* Left: Moroccan Regions */}
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4 flex flex-col">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-3">
                Zones Agricoles Couvertes
              </p>
              <div className="grid grid-cols-2 gap-2 flex-1">
                {[
                  { name: 'Haouz (Marrakech)', tag: 'Aride · Céréales', color: 'bg-amber-400' },
                  { name: 'Souss-Massa', tag: 'Chaud · Arganier', color: 'bg-orange-400' },
                  { name: 'Saïss (Fès·Meknès)', tag: 'Pluvial · Oliviers', color: 'bg-emerald-400' },
                  { name: 'Tadla (Béni Mellal)', tag: 'Irrigué · Arboriculture', color: 'bg-sky-400' },
                  { name: 'Gharb (Kénitra)', tag: 'Humide · Maraîchage', color: 'bg-teal-400' },
                  { name: 'Moulouya (Berkane)', tag: 'Oriental · Agrumes', color: 'bg-violet-400' },
                ].map((r, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.025] border border-white/[0.06] hover:border-emerald-500/20 transition-colors">
                    <span className={`w-2 h-2 rounded-full ${r.color} mt-1 shrink-0`} />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{r.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{r.tag}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: How It Works */}
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4 flex flex-col">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 mb-3">
                Comment ça marche
              </p>
              <div className="flex-1 flex flex-col justify-between gap-2">
                {[
                  { icon: Satellite, step: '01', label: 'Localisation GPS', desc: 'Sélectionnez votre bassin agricole marocain ou saisissez vos coordonnées GPS précises', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                  { icon: Droplets, step: '02', label: 'Profil de la Parcelle', desc: 'Régime hydrique, type de sol, taille du champ et culture de la campagne précédente', cls: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
                  { icon: FlaskConical, step: '03', label: 'Analyse NASA POWER', desc: "Extraction et calcul des séries climatiques quotidiennes sur 5 ans en temps réel", cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                  { icon: Sprout, step: '04', label: 'Recommandations Cultures', desc: "Classement par score avec facteurs favorables, vigilances et règles de décision", cls: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
                ].map(({ icon: Icon, step, label, desc, cls }, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${cls}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono text-slate-600">{step}</span>
                        <p className="text-xs font-bold text-slate-200">{label}</p>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Proof Bar + CTA */}
          <div className="w-full rounded-xl bg-gradient-to-r from-emerald-950/25 via-[#070b08] to-amber-950/15 border border-emerald-500/20 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-slate-300">Moteur déterministe & transparent</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-medium text-slate-300">NASA POWER — Open Data</span>
                </div>
              </div>
              <button
                id="start-btn-2"
                type="button"
                onClick={onStart}
                className="shrink-0 px-5 py-2 rounded-lg font-bold text-xs text-slate-950 bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 flex items-center gap-1.5 cursor-pointer transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-950/40"
              >
                <span>Commencer l'analyse</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full border-t border-white/5 pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-1">
            <span>Développé pour la communauté agricole marocaine • NASA Space Apps Challenge 2026</span>
            <span>Projet Open Source — Données publiques NASA POWER</span>
          </div>
        </section>
      </div>
    </div>
  );
}
