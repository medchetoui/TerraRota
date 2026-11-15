import { useEffect, useRef, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
// @ts-ignore – import JSON (Vite le gère nativement)
import worldTopo from 'world-atlas/countries-50m.json';
import type { Lang } from '../i18n/translations';

/* ───────── Palette Terrarota ───────── */
const C = {
  deep: '#1E331A',
  green: '#2D4A27',
  cream: '#F4EFE6',
  sand: '#DECAB3',
  land: '#EFE9DC',
  terra: '#8C3A27',
  amber: '#FBBF24',
};

/* ───────── Géographie ───────── */
// Territoire mis en évidence (codes ISO numériques). Ajuste cette liste si besoin.
const HIGHLIGHT_IDS = new Set(['504', '732']);

const ALL: any[] = (feature(worldTopo as any, (worldTopo as any).objects.countries) as any).features;
const HIGHLIGHT = ALL.filter((f) => HIGHLIGHT_IDS.has(String(f.id)));
const OTHERS = ALL.filter((f) => !HIGHLIGHT_IDS.has(String(f.id)));
const GRATICULE = geoGraticule10();
const SPHERE = { type: 'Sphere' } as any;

// Tes 5 zones agricoles [lon, lat]
const FIELDS: [number, number][] = [
  [-5.0, 33.89],
  [-8.87, 30.42],
  [-8.0, 31.62],
  [-7.6, 33.0],
  [-6.58, 34.26],
];
const TARGET = { lon: -7.5, lat: 30.5 };

/* ───────── Chronologie (ms) ───────── */
const T_SPIN = 1800; // spinning globe
const T_ZOOM = 2200; // dive toward Morocco
const T_TEXT = T_SPIN + T_ZOOM - 400; // sentence appears
const T_SUB = T_TEXT + 700; // signature appears
const T_END = T_SUB + 1700; // fade to the app
const START_LON = 140;
const SPIN_SPEED = 0.06; // degrees / ms (faster, so it still rotates about as far)

const PHRASES: Record<Lang, { main: string; sub: string }> = {
  fr: {
    main: 'Chaque champ du Maroc mérite le regard des satellites.',
    sub: "L'agriculture de demain, guidée par les données de la NASA.",
  },
  en: {
    main: 'Every Moroccan field deserves a view from space.',
    sub: "Tomorrow's farming, guided by NASA data.",
  },
  ar: {
    main: 'كل حقل في المغرب يستحق نظرة من الفضاء.',
    sub: 'فلاحة الغد، بعيون أقمار ناسا.',
  },
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export default function Intro({ lang, onDone }: { lang: Lang; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const finished = useRef(false);

  const [showText, setShowText] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const finish = (delay: number) => {
    if (finished.current) return;
    finished.current = true;
    setLeaving(true);
    setTimeout(() => doneRef.current(), delay);
  };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3,
      a: Math.random() * 0.6 + 0.2, tw: Math.random() * 6,
    }));
    const lines = Array.from({ length: 70 }, () => ({
      ang: Math.random() * Math.PI * 2, ph: Math.random(), w: Math.random(),
    }));

    const projection = geoOrthographic().clipAngle(90);
    const path = geoPath(projection, ctx);

    const timers = [
      setTimeout(() => setShowText(true), T_TEXT),
      setTimeout(() => setShowSub(true), T_SUB),
      setTimeout(() => finish(600), T_END),
    ];

    const onKey = (e: KeyboardEvent) => {
      if (['Escape', 'Enter', ' '].includes(e.key)) finish(400);
    };
    window.addEventListener('keydown', onKey);

    const t0 = performance.now();
    const lonA = START_LON - T_SPIN * SPIN_SPEED;
    const LAT0 = 18;

    const frame = (now: number) => {
      const ms = now - t0;
      const base = Math.min(w, h);
      const cx = w / 2, cy = h / 2;
      const R0 = base * 0.3, R1 = base * 3.0;

      /* ── Caméra ── */
      let lon: number, lat: number, R: number, p = 0;
      if (ms <= T_SPIN) {
        lon = START_LON - ms * SPIN_SPEED;
        lat = LAT0;
        R = R0 * (0.82 + 0.18 * easeOut(clamp(ms / 900)));
      } else {
        p = clamp((ms - T_SPIN) / T_ZOOM);
        const eRot = easeOut(p);
        lon = lonA + wrap(TARGET.lon - lonA) * eRot;
        lat = LAT0 + (TARGET.lat - LAT0) * eRot;
        R = R0 * Math.pow(R1 / R0, easeInOut(p));
      }
      const speed = ms > T_SPIN && p < 1 ? Math.pow(Math.sin(Math.PI * p), 1.2) : 0;
      const shake = speed * 1.6;
      const ox = (Math.random() - 0.5) * shake;
      const oy = (Math.random() - 0.5) * shake;

      projection.translate([cx + ox, cy + oy]).scale(R).rotate([-lon, -lat]);

      /* ── Fond ── */
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) * 0.6);
      bg.addColorStop(0, '#243d1f');
      bg.addColorStop(1, '#0d170b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      /* ── Étoiles (deviennent des traînées pendant le zoom) ── */
      for (const s of stars) {
        const x = s.x * w, y = s.y * h;
        const a = s.a * (0.6 + 0.4 * Math.sin(ms / 400 + s.tw));
        ctx.strokeStyle = `rgba(244,239,230,${a})`;
        ctx.lineWidth = s.r;
        ctx.beginPath();
        if (speed > 0.05) {
          const k = speed * 0.3;
          ctx.moveTo(x, y);
          ctx.lineTo(x + (x - cx) * k, y + (y - cy) * k);
        } else {
          ctx.moveTo(x, y);
          ctx.lineTo(x + 0.1, y + 0.1);
        }
        ctx.stroke();
      }

      /* ── Océan ── */
      ctx.beginPath();
      path(SPHERE);
      const og = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.05, cx, cy, R * 1.1);
      og.addColorStop(0, '#4a7a3d');
      og.addColorStop(0.55, C.green);
      og.addColorStop(1, '#16260f');
      ctx.fillStyle = og;
      ctx.fill();

      /* ── Graticule ── */
      ctx.beginPath();
      path(GRATICULE);
      ctx.strokeStyle = 'rgba(244,239,230,0.10)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      /* ── Continents ── */
      ctx.beginPath();
      for (const f of OTHERS) path(f);
      ctx.fillStyle = C.land;
      ctx.fill();
      ctx.strokeStyle = C.sand;
      ctx.lineWidth = 0.7;
      ctx.stroke();

      /* ── Maroc en surbrillance ── */
      const m = clamp((ms - (T_SPIN + T_ZOOM * 0.45)) / 600);
      ctx.beginPath();
      for (const f of HIGHLIGHT) path(f);
      ctx.fillStyle = C.land;
      ctx.fill();
      if (m > 0) {
        ctx.save();
        ctx.globalAlpha = m;
        ctx.shadowColor = 'rgba(251,191,36,0.8)';
        ctx.shadowBlur = 18 * m;
        ctx.fillStyle = C.terra;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      /* ── Ombrage du bord de la sphère (effet 3D) ── */
      ctx.save();
      ctx.beginPath();
      path(SPHERE);
      ctx.clip();
      const sh = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.35, cx, cy, R);
      sh.addColorStop(0, 'rgba(0,0,0,0)');
      sh.addColorStop(1, 'rgba(8,16,6,0.6)');
      ctx.fillStyle = sh;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      /* ── Halo d'atmosphère ── */
      const atm = 1 - clamp((R - R0) / (R0 * 3));
      if (atm > 0.02) {
        ctx.save();
        ctx.globalAlpha = atm;
        ctx.shadowColor = 'rgba(244,239,230,0.75)';
        ctx.shadowBlur = 28;
        ctx.strokeStyle = 'rgba(244,239,230,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        path(SPHERE);
        ctx.stroke();
        ctx.restore();
      }

      /* ── Les 5 zones agricoles qui pulsent ── */
      const tPins = T_SPIN + T_ZOOM * 0.75;
      if (ms > tPins) {
        const k = clamp((ms - tPins) / 500);
        const s = clamp(base / 900, 0.6, 1.4);
        FIELDS.forEach(([lo, la], i) => {
          const pt = projection([lo, la]);
          if (!pt) return;
          const pulse = ((ms + i * 260) % 1500) / 1500;
          ctx.strokeStyle = `rgba(251,191,36,${(1 - pulse) * 0.9 * k})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], (6 + pulse * 34) * s, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = C.amber;
          ctx.strokeStyle = C.cream;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], 7 * s * k, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }

      /* ── Lignes de vitesse ── */
      if (speed > 0.03) {
        const diag = Math.hypot(w, h);
        for (const l of lines) {
          const t = (l.ph + ms * 0.0012 * (1 + speed * 2)) % 1;
          const r0 = base * 0.22 + t * diag * 0.55;
          const len = base * 0.05 + speed * base * 0.55 * t;
          const x0 = cx + Math.cos(l.ang) * r0, y0 = cy + Math.sin(l.ang) * r0;
          const x1 = cx + Math.cos(l.ang) * (r0 + len), y1 = cy + Math.sin(l.ang) * (r0 + len);
          ctx.strokeStyle = l.w > 0.8
            ? `rgba(251,191,36,${speed * 0.55 * (0.3 + t)})`
            : `rgba(244,239,230,${speed * 0.5 * (0.3 + t)})`;
          ctx.lineWidth = 1 + 2.2 * t;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
      }

      /* ── Vignette ── */
      const vg = ctx.createRadialGradient(cx, cy, base * 0.35, cx, cy, Math.hypot(w, h) * 0.6);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(5,10,4,${0.35 + speed * 0.3})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      timers.forEach(clearTimeout);
    };
  }, []);

  const txt = PHRASES[lang];
  const isAr = lang === 'ar';

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#F4EFE6] transition-opacity duration-700 ${leaving ? 'opacity-0' : 'opacity-100'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Carte de texte */}
      <div className="absolute inset-x-0 bottom-[7%] flex justify-center px-4 pointer-events-none">
        <div
          className={`w-full max-w-3xl rounded-[2rem] border border-[#DECAB3]/30 bg-[#1E331A]/85 backdrop-blur-md px-6 sm:px-10 py-7 text-center shadow-2xl transition-all duration-700 ${
            showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          } ${isAr ? 'font-arabic' : ''}`}
        >
          <h2 className="text-2xl sm:text-4xl font-black leading-snug text-[#F4EFE6]">{txt.main}</h2>

          <div className={`transition-all duration-700 ${showSub ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
            <div className="mx-auto my-4 h-px w-24 bg-[#DECAB3]/40" />
            <div className="text-3xl sm:text-5xl font-black tracking-tight text-[#F4EFE6]">
              Terra<span className="text-[#FBBF24]">Rota</span>
            </div>
            <p className="mt-2 text-sm sm:text-base text-[#DECAB3]">{txt.sub}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => finish(400)}
        className="absolute top-5 end-5 px-4 py-2 rounded-full text-xs font-bold text-[#F4EFE6] bg-[#1E331A]/70 hover:bg-[#1E331A] border border-[#DECAB3]/30 cursor-pointer backdrop-blur-sm"
      >
        {lang === 'ar' ? 'تخطي' : lang === 'en' ? 'Skip' : 'Passer'}
      </button>
    </div>
  );
}