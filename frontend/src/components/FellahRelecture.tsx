// /advisor?relire (développement seulement) : relire chaque phrase darija, la valider ou la corriger.
import { useEffect, useState } from 'react';
import { getFellahPhrases, validateFellahPhrase, type FellahPhraseEtat, type FellahValidation } from '../api/client';

const VALIDE = 'validé par Ranya';

export default function FellahRelecture() {
  const [phrases, setPhrases] = useState<FellahPhraseEtat[] | null>(null);
  const [edition, setEdition] = useState<string | null>(null);
  const [texte, setTexte] = useState('');
  const [resultat, setResultat] = useState<FellahValidation | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getFellahPhrases()
      .then((d) => setPhrases(d.phrases))
      .catch(() => setMessage('Outil disponible seulement en développement (backend en DEBUG).'));
  }, []);

  const envoyer = async (id: string, nouveau?: string) => {
    setMessage('');
    try {
      const r = await validateFellahPhrase(id, nouveau);
      setResultat(r);
      setPhrases((ps) => (ps || []).map((p) => (p.id === id ? { ...p, darija: r.darija, statut: r.statut, a_refaire: r.a_refaire } : p)));
      setEdition(null);
    } catch (e) {
      setMessage(`Refusé : ${(e as { data?: { message?: string } }).data?.message || 'erreur'}`);
    }
  };

  if (!phrases) {
    return <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3]">{message || 'Chargement…'}</div>;
  }
  const valides = phrases.filter((p) => p.statut === VALIDE).length;

  return (
    <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#DECAB3] shadow-sm max-w-3xl mx-auto space-y-4" data-testid="relecture">
      <div className="flex items-center justify-between flex-wrap gap-2" dir="ltr">
        <h4 className="text-lg font-bold text-[#1E331A]">Relire la darija</h4>
        <div className="text-2xl font-black text-[#2D4A27]" data-testid="compteur-valides">{valides} / {phrases.length} validées</div>
      </div>
      {resultat && (
        <div className="text-sm rounded-xl bg-white border border-[#DECAB3] px-3 py-2" dir="ltr" role="status" data-testid="relance-demo">
          {resultat.id} : {resultat.modifiee ? 'modifiée' : 'validée'} · questions de démo relancées :
          {' '}{resultat.demo.type_correct} / {resultat.demo.questions} types corrects,
          {' '}{resultat.demo.reponses_avec_chiffres} réponse(s) avec chiffre
          {resultat.a_refaire && ' · ⚠ clip à réenregistrer (/advisor?enregistrer)'}
        </div>
      )}
      {message && <div className="text-sm font-semibold text-[#8C3A27]" dir="ltr">{message}</div>}
      <div className="space-y-2">
        {phrases.map((p) => (
          <div key={p.id} data-testid={`phrase-${p.id}`}
            className={`rounded-2xl border p-4 space-y-2 ${p.statut === VALIDE ? 'bg-[#F1F8E9] border-[#A5C48F]' : 'bg-white border-[#DECAB3]'}`}>
            <div className="flex justify-between text-[11px] text-[#7A6B53]" dir="ltr">
              <code>{p.id}</code>
              <span>{p.demo ? 'démo · ' : ''}{p.statut}{p.a_refaire ? ' · ⚠ clip à refaire' : ''}</span>
            </div>
            {edition === p.id ? (
              <form onSubmit={(e) => { e.preventDefault(); envoyer(p.id, texte); }} className="space-y-2">
                <input dir="rtl" value={texte} onChange={(e) => setTexte(e.target.value)} autoFocus
                  className="w-full text-2xl rounded-xl border border-[#DECAB3] px-3 py-2" aria-label="Nouvelle phrase" />
                <div className="flex gap-2" dir="ltr">
                  <button type="submit" className="px-4 py-2 rounded-xl bg-[#2D4A27] text-white cursor-pointer">Enregistrer</button>
                  <button type="button" onClick={() => setEdition(null)} className="px-4 py-2 rounded-xl bg-[#EFE9DC] cursor-pointer">Annuler</button>
                </div>
              </form>
            ) : (
              <div className="text-2xl leading-relaxed text-[#1E331A]" dir="rtl">{p.darija}</div>
            )}
            <div className="flex items-center justify-between gap-2 flex-wrap" dir="ltr">
              <span className="text-sm text-[#61513C]">{p.fr}</span>
              {edition !== p.id && (
                <span className="flex gap-2">
                  <button type="button" onClick={() => envoyer(p.id)} data-testid={`ok-${p.id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#2D4A27] text-white text-sm cursor-pointer">✓ OK</button>
                  <button type="button" onClick={() => { setEdition(p.id); setTexte(p.darija); }} data-testid={`modifier-${p.id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#EFE9DC] text-sm cursor-pointer">✎ Modifier</button>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
