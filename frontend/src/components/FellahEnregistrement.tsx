// /advisor?enregistrer (développement seulement) : enregistrer les clips darija de la démo, une phrase à la fois.
import { useEffect, useRef, useState } from 'react';
import { getFellahPhrases, saveFellahClip, type FellahPhraseEtat } from '../api/client';
import { versWavMono16k } from '../audio/wav';

type Etat = 'pret' | 'enregistre' | 'fini' | 'envoi';

export default function FellahEnregistrement() {
  const [phrases, setPhrases] = useState<FellahPhraseEtat[] | null>(null);
  const [toutes, setToutes] = useState(false);
  const [index, setIndex] = useState(0);
  const [etat, setEtat] = useState<Etat>('pret');
  const [wav, setWav] = useState<{ blob: Blob; url: string; secondes: number } | null>(null);
  const [message, setMessage] = useState('');
  const [version, setVersion] = useState(Date.now());
  const recorder = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    getFellahPhrases()
      .then((d) => setPhrases(d.phrases))
      .catch(() => setMessage('Outil disponible seulement en développement (backend en DEBUG).'));
  }, []);

  const liste = (phrases || []).filter((p) => toutes || p.demo);
  const courante = liste[Math.min(index, liste.length - 1)];
  const faits = liste.filter((p) => p.present && !p.a_refaire).length;

  const oublier = () => {
    if (wav) URL.revokeObjectURL(wav.url);
    setWav(null);
    setEtat('pret');
  };

  const aller = (i: number) => {
    oublier();
    setMessage('');
    setIndex(Math.max(0, Math.min(liste.length - 1, i)));
  };

  const demarrer = async () => {
    oublier();
    setMessage('');
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      const morceaux: Blob[] = [];
      const r = new MediaRecorder(flux);
      r.ondataavailable = (e) => morceaux.push(e.data);
      r.onstop = async () => {
        flux.getTracks().forEach((t) => t.stop());
        try {
          const { wav: blob, secondes } = await versWavMono16k(new Blob(morceaux, { type: r.mimeType }));
          setWav({ blob, url: URL.createObjectURL(blob), secondes });
          setEtat('fini');
        } catch {
          setMessage('Conversion impossible : recommencez.');
          setEtat('pret');
        }
      };
      recorder.current = r;
      r.start();
      setEtat('enregistre');
    } catch {
      setMessage('Micro refusé ou absent.');
    }
  };

  const arreter = () => recorder.current?.state === 'recording' && recorder.current.stop();

  const garder = async () => {
    if (!wav || !courante) return;
    setEtat('envoi');
    try {
      await saveFellahClip(courante.id, wav.blob);
      setPhrases((ps) => (ps || []).map((p) => (p.id === courante.id ? { ...p, present: true, a_refaire: false } : p)));
      setVersion(Date.now());
      setMessage(`✓ ${courante.id}.wav enregistré`);
      oublier();
      const suivante = liste.findIndex((p, i) => i > index && (!p.present || p.a_refaire));
      if (suivante >= 0) setIndex(suivante);
    } catch (e) {
      const detail = (e as { data?: { message?: string } }).data?.message;
      setMessage(`Refusé : ${detail || 'erreur'}`);
      setEtat('fini');
    }
  };

  if (!phrases) {
    return <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3]">{message || 'Chargement…'}</div>;
  }

  return (
    <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#DECAB3] shadow-sm max-w-2xl mx-auto space-y-5" data-testid="enregistrement">
      <div className="flex items-center justify-between flex-wrap gap-2" dir="ltr">
        <h4 className="text-lg font-bold text-[#1E331A]">Enregistrer les clips darija</h4>
        <div className="text-2xl font-black text-[#2D4A27]" data-testid="compteur">{faits} / {liste.length}</div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#61513C]" dir="ltr">
        <input type="checkbox" checked={toutes} onChange={(e) => { setToutes(e.target.checked); aller(0); }} />
        Toutes les phrases ({phrases.length}), pas seulement les {phrases.filter((p) => p.demo).length} de la démo
      </label>

      {courante && (
        <div className="rounded-2xl bg-white border border-[#DECAB3] p-6 space-y-3 text-center">
          <div className="text-xs text-[#7A6B53]" dir="ltr">
            {index + 1} / {liste.length} · <code data-testid="nom-fichier">{courante.id}.wav</code>
            {courante.present && !courante.a_refaire && ' · ✓ déjà enregistré'}
            {courante.a_refaire && ' · ⚠ texte modifié depuis : à réenregistrer'}
          </div>
          <div className="text-4xl leading-relaxed font-bold text-[#1E331A]" dir="rtl" data-testid="phrase">{courante.darija}</div>
          <div className="text-sm text-[#61513C]" dir="ltr">{courante.fr}</div>
          {courante.present && etat === 'pret' && (
            <audio controls src={`/audio/darija/${courante.id}.wav?v=${version}`} className="mx-auto" />
          )}
        </div>
      )}

      <div className="grid grid-cols-5 gap-2 text-sm font-bold" dir="ltr">
        <button type="button" onClick={demarrer} disabled={etat === 'enregistre' || etat === 'envoi'}
          className="py-3 rounded-2xl bg-[#8C3A27] text-white disabled:opacity-40 cursor-pointer">⏺ Enregistrer</button>
        <button type="button" onClick={arreter} disabled={etat !== 'enregistre'}
          className={`py-3 rounded-2xl bg-[#1E331A] text-white disabled:opacity-40 cursor-pointer ${etat === 'enregistre' ? 'animate-pulse' : ''}`}>⏹ Arrêter</button>
        <button type="button" onClick={() => wav && new Audio(wav.url).play()} disabled={!wav}
          className="py-3 rounded-2xl bg-[#EFE9DC] text-[#1E331A] disabled:opacity-40 cursor-pointer">▶ Réécouter</button>
        <button type="button" onClick={garder} disabled={!wav || etat === 'envoi'}
          className="py-3 rounded-2xl bg-[#2D4A27] text-white disabled:opacity-40 cursor-pointer">✓ Garder</button>
        <button type="button" onClick={oublier} disabled={!wav}
          className="py-3 rounded-2xl bg-[#EFE9DC] text-[#1E331A] disabled:opacity-40 cursor-pointer">↺ Refaire</button>
      </div>
      {wav && <div className="text-xs text-[#61513C]" dir="ltr">Prise : {wav.secondes.toFixed(1)} s (WAV mono 16 bits 16000 Hz)</div>}
      {message && <div className="text-sm font-semibold text-[#8C3A27]" role="status" dir="ltr">{message}</div>}

      <div className="flex justify-between" dir="ltr">
        <button type="button" onClick={() => aller(index - 1)} className="px-4 py-2 rounded-xl bg-[#EFE9DC] cursor-pointer">‹ Précédente</button>
        <button type="button" onClick={() => aller(index + 1)} className="px-4 py-2 rounded-xl bg-[#EFE9DC] cursor-pointer">Suivante ›</button>
      </div>
      <div className="flex flex-wrap gap-1" dir="ltr">
        {liste.map((p, i) => (
          <button key={p.id} type="button" title={p.id} onClick={() => aller(i)}
            className={`w-7 h-7 rounded-full text-[10px] cursor-pointer ${i === index ? 'ring-2 ring-[#8C3A27]' : ''} ${
              p.a_refaire ? 'bg-amber-300' : p.present ? 'bg-[#2D4A27] text-white' : 'bg-[#E5DDCF]'}`}>{i + 1}</button>
        ))}
      </div>
    </div>
  );
}
