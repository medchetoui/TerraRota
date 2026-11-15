// Questions du fellah en darija / multi-langues : 🎤 (reconnaissance vocale du navigateur) ou texte tapé,
// réponse du modèle darija en phrases enregistrées (ou synthèse vocale Web Speech en repli quand les wav manquent).
import { useEffect, useRef, useState } from 'react';
import { Mic, Volume2, VolumeX, Send, Sparkles } from 'lucide-react';
import {
  askFellah,
  getFellahSetup,
  logFellahVoiceTry,
  type FellahAnswer,
  type FellahSetup,
} from '../api/client';
import type { FellahParcelle } from '../api/client';
import FellahEnregistrement from './FellahEnregistrement';
import FellahRelecture from './FellahRelecture';

interface RecognitionResult { 0: { transcript: string } }
interface RecognitionEvent { results: { 0: RecognitionResult } & ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const UI_STRINGS = {
  ar: {
    title: 'سول بالدارجة',
    subtitle: 'طرح سؤالك بالصوت أو بالكتابة واحصل على نصيحة فلاحية دقيقة ومسموعة',
    scenarioLabel: 'البلان',
    micListening: 'كنسمعك… تكلم دابا',
    micIdle: 'ضغط و سول بصوتك',
    micAria: 'سجل سؤالك',
    inputPlaceholder: 'اكتب سؤالك',
    sendAria: 'صيفط',
    serviceDown: 'الخدمة ما خدامةش دابا.',
    unsupportedBrowser: 'هاد المتصفح ما كيسمعش الصوت. يمكنك كتابة سؤالك.',
    cannotAnswer: 'ما قدرتش نجاوب دابا. عاود من بعد.',
    stopVoice: 'إيقاف الصوت',
    listenAnswer: 'سمع الجواب بالصوت',
    synthesizedVoice: 'صوت افتراضي (مباشر)',
    recordedVoice: 'صوت مسجل',
    aiVoice: 'صوت اصطناعي · voix de synthèse',
    myPlot: 'الأرض ديالي',
    examples: 'أمثلة',
    errors: {
      'not-allowed': 'الميكرو ما خدامش أو مرفوض. اكتب سؤالك.',
      'service-not-allowed': 'الميكرو ما خدامش. اكتب سؤالك.',
      'no-speech': 'ما سمعتش. عاود أو اكتب سؤالك.',
      'audio-capture': 'ما لقيتش الميكرو. اكتب سؤالك.',
      network: 'خاص الأنترنيت باش نسمعك. اكتب سؤالك.',
      default: 'ما فهمتش. اكتب سؤالك.',
    },
  },
  fr: {
    title: 'Conseiller Vocal Agricole (Ami Ahmed)',
    subtitle: 'Posez votre question à voix haute ou par écrit et écoutez la réponse d\'Ami Ahmed',
    scenarioLabel: 'Scénario agricole',
    micListening: 'Je vous écoute… Parlez maintenant',
    micIdle: 'Cliquez et posez votre question à voix haute',
    micAria: 'Enregistrer votre question',
    inputPlaceholder: 'Tapez votre question (ex: que planter cette année ?)',
    sendAria: 'Envoyer',
    serviceDown: 'Service temporairement indisponible.',
    unsupportedBrowser: 'Ce navigateur ne prend pas en charge la reconnaissance vocale. Tapez votre question.',
    cannotAnswer: 'Impossible de répondre pour le moment. Réessayez.',
    stopVoice: 'Arrêter la voix',
    listenAnswer: 'Écouter la réponse vocale',
    synthesizedVoice: 'Synthèse vocale directe',
    recordedVoice: 'Voix enregistrée',
    aiVoice: 'voix de synthèse',
    myPlot: 'Ma parcelle',
    examples: 'Exemples',
    errors: {
      'not-allowed': 'Accès micro refusé. Veuillez taper votre question.',
      'service-not-allowed': 'Service micro non disponible. Tapez votre question.',
      'no-speech': 'Rien entendu. Répétez ou tapez votre question.',
      'audio-capture': 'Aucun microphone détecté. Tapez votre question.',
      network: 'Connexion réseau requise. Tapez votre question.',
      default: 'Non compris. Tapez votre question.',
    },
  },
  en: {
    title: 'Smart Agricultural Advisor (Ami Ahmed)',
    subtitle: 'Ask your farming question by voice or text and listen to spoken advice',
    scenarioLabel: 'Crop scenario',
    micListening: 'Listening… Speak now',
    micIdle: 'Click to speak your question',
    micAria: 'Record your question',
    inputPlaceholder: 'Type your question (e.g. what should I plant this year?)',
    sendAria: 'Send',
    serviceDown: 'Voice advisor service is currently unavailable.',
    unsupportedBrowser: 'Speech recognition is not supported in this browser. Please type your question.',
    cannotAnswer: 'Could not answer right now. Please try again.',
    stopVoice: 'Stop Voice',
    listenAnswer: 'Listen to Spoken Advice',
    synthesizedVoice: 'Live Web Voice',
    recordedVoice: 'Recorded voice',
    aiVoice: 'synthetic voice',
    myPlot: 'My plot',
    examples: 'Examples',
    errors: {
      'not-allowed': 'Microphone permission denied. Please type your question.',
      'service-not-allowed': 'Microphone service unavailable. Please type your question.',
      'no-speech': 'No speech detected. Please repeat or type your question.',
      'audio-capture': 'No microphone found. Please type your question.',
      network: 'Network connection required for voice. Please type.',
      default: 'Did not understand. Please type your question.',
    },
  },
};

interface FellahQuestionProps {
  lang?: 'ar' | 'fr' | 'en';
  persona?: 'ami_ahmed' | 'mi_fatima';
  parcelle?: FellahParcelle | null;
  regionName?: string;
}

const EAU_FR: Record<string, string> = { rainfed: 'pluvial', irrigated: 'irrigué', partial: 'irrigation partielle' };

export default function FellahQuestion(props: FellahQuestionProps) {
  const params = new URLSearchParams(window.location.search);
  if (params.has('enregistrer')) return <FellahEnregistrement />;
  if (params.has('relire')) return <FellahRelecture />;
  return <FellahQuestionPanel {...props} />;
}

function FellahQuestionPanel({ lang = 'ar', persona = 'ami_ahmed', parcelle = null, regionName = '' }: FellahQuestionProps) {
  const [setup, setSetup] = useState<FellahSetup | null>(null);
  const [scenario, setScenario] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<FellahAnswer | null>(null);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('');
  const [playing, setPlaying] = useState(false);
  const [testId, setTestId] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const derniereDemande = useRef(0);
  const [surParcelle, setSurParcelle] = useState(true);
  const useParcelle = surParcelle && parcelle !== null;
  const supported = recognitionCtor() !== null;
  const testMode = new URLSearchParams(window.location.search).has('test-voix');

  const isAr = lang === 'ar';
  const isEn = lang === 'en';
  const ui = UI_STRINGS[lang] || UI_STRINGS.ar;

  useEffect(() => {
    getFellahSetup()
      .then((s) => {
        setSetup(s);
        setScenario(s.defaut);
        setTestId(s.questions_test[0]?.id || '');
      })
      .catch(() => setNotice(ui.serviceDown));
  }, [ui.serviceDown]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const logTry = (entry: Record<string, unknown>) => {
    if (!testMode || !setup?.journal) return;
    logFellahVoiceTry({ methode: 'app-navigateur', attendu_id: testId, ...entry }).catch(() => undefined);
    const ids = setup.questions_test.map((q) => q.id);
    const suivant = ids[ids.indexOf(testId) + 1];
    if (suivant) setTestId(suivant);
  };

  const playAnswerAudio = async (ans: FellahAnswer) => {
    stopAudio();

    // Prepare text to speak depending on selected language
    let textToSpeak = '';
    if (isAr) {
      textToSpeak = ans.phrases.map((g) => g.map((p) => p.darija).join(' ')).join('. ');
    } else if (isEn) {
      textToSpeak = ans.phrases.map((g) => g.map((p) => p.fr).join(' ')).join('. ');
    } else {
      textToSpeak = ans.phrases.map((g) => g.map((p) => p.fr).join(' ')).join('. ');
    }
    if (!textToSpeak.trim()) {
      textToSpeak = ans.texte;
    }

    setPlaying(true);

    // 1. Try server-side neural human voice (Edge-TTS)
    try {
      const resp = await fetch('/api/v1/advisor/voice/speak/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, lang, persona }),
      });
      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        audioRef.current = a;
        a.onended = () => {
          URL.revokeObjectURL(url);
          setPlaying(false);
        };
        a.onerror = () => {
          URL.revokeObjectURL(url);
          playWithTTS(textToSpeak);
        };
        await a.play();
        return;
      }
    } catch {
      // Fallback below
    }

    // 2. Fallback to Browser Speech Synthesis
    playWithTTS(textToSpeak);
  };

  const ask = async (texte: string, voix?: { langue: string; t0: number }) => {
    const q = texte.trim();
    if (!q || (!scenario && !useParcelle)) return;
    stopAudio();
    setQuestion(q);
    const demande = ++derniereDemande.current;
    try {
      const r = await askFellah(q, scenario, useParcelle ? parcelle : null);
      if (demande !== derniereDemande.current) return;
      setAnswer(r);
      setNotice('');
      if (voix) {
        logTry({
          langue: voix.langue, transcription: q, intention: r.intention, culture: r.culture,
          reponse: r.texte, erreur: null, ms: Math.round(performance.now() - voix.t0),
        });
        // Question dite à voix haute -> réponse lue automatiquement (clips darija en arabe, voix de Mohamed sinon)
        setTimeout(() => {
          lire(r);
        }, 150);
      }
    } catch {
      if (demande === derniereDemande.current) setNotice(ui.cannotAnswer);
    }
  };

  const listen = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      setNotice(ui.unsupportedBrowser);
      return;
    }
    stopAudio();
    const rec = new Ctor();
    const t0 = performance.now();
    const speechLang = isAr ? 'ar-MA' : isEn ? 'en-US' : 'fr-FR';
    rec.lang = speechLang;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => ask(e.results[0][0].transcript, { langue: speechLang, t0 });
    rec.onerror = (e) => {
      if (e.error === 'language-not-supported' && speechLang === 'ar-MA') {
        rec.lang = 'ar';
        try { rec.start(); return; } catch { /* ignore */ }
      }
      const errMap = ui.errors as Record<string, string>;
      setNotice(errMap[e.error] || ui.errors.default);
      if (e.error !== 'aborted') {
        logTry({
          langue: speechLang, transcription: '', intention: null, culture: null, reponse: null, erreur: e.error,
          ms: Math.round(performance.now() - t0),
        });
      }
    };
    rec.onend = () => setListening(false);
    setNotice('');
    setListening(true);
    rec.start();
  };

  const clipsDe = (ans: FellahAnswer | null) => (ans?.phrases.flat().map((p) => p.audio).filter(Boolean) as string[]) || [];
  const clips = clipsDe(answer);
  const synthese = !!answer?.phrases.flat().some((p) => p.audio && p.voix === 'synthese');

  const playWithTTS = (customText?: string) => {
    if (!('speechSynthesis' in window) || !answer) {
      stopAudio();
      return;
    }
    window.speechSynthesis.cancel();

    let textToSpeak = customText || '';
    if (!textToSpeak) {
      if (isAr) {
        textToSpeak = answer.phrases.map((g) => g.map((p) => p.darija).join(' ')).join('. ');
      } else {
        textToSpeak = answer.phrases.map((g) => g.map((p) => p.fr).join(' ')).join('. ');
      }
      if (!textToSpeak.trim()) textToSpeak = answer.texte;
    }

    const voiceLang = isAr ? 'ar-MA' : isEn ? 'en-US' : 'fr-FR';
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const lire = (ans: FellahAnswer) => {
    if (!isAr) {
      playAnswerAudio(ans);
      return;
    }
    // Darija : clips des phrases fixes, l'un après l'autre ; un clip absent ou illisible est sauté (texte seul)
    const liste = clipsDe(ans);
    if (liste.length === 0) return;
    stopAudio();
    let i = 0;
    const next = () => {
      if (i >= liste.length) {
        stopAudio();
        return;
      }
      const a = new Audio(liste[i++]);
      audioRef.current = a;
      a.onended = next;
      a.onerror = next;
      a.play().catch(next);
    };
    setPlaying(true);
    next();
  };

  const play = () => {
    if (playing) {
      stopAudio();
      return;
    }
    if (answer) lire(answer);
  };

  return (
    <div
      className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#DECAB3] shadow-sm max-w-2xl mx-auto space-y-4"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h4 className="text-xl font-bold text-[#1E331A] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8C3A27]" />
            <span>{ui.title}</span>
          </h4>
          <p className="text-xs text-[#7A6B53] mt-0.5">{ui.subtitle}</p>
        </div>
        {parcelle && (
          <div className="flex rounded-xl border border-[#DECAB3] overflow-hidden text-xs" role="group">
            <button
              type="button"
              data-testid="mode-parcelle"
              onClick={() => { setSurParcelle(true); setAnswer(null); }}
              className={`px-3 py-2 cursor-pointer ${useParcelle ? 'bg-[#2D4A27] text-white' : 'bg-white text-[#1E331A]'}`}
            >
              {ui.myPlot}
            </button>
            <button
              type="button"
              data-testid="mode-demo"
              onClick={() => { setSurParcelle(false); setAnswer(null); }}
              className={`px-3 py-2 cursor-pointer ${!useParcelle ? 'bg-[#2D4A27] text-white' : 'bg-white text-[#1E331A]'}`}
            >
              {ui.examples}
            </button>
          </div>
        )}
        {setup && !useParcelle && (
          <select
            aria-label={ui.scenarioLabel}
            value={scenario}
            onChange={(e) => { setScenario(e.target.value); setAnswer(null); }}
            className="text-xs font-semibold rounded-xl border border-[#DECAB3] bg-white px-3 py-2 text-[#1E331A] cursor-pointer"
          >
            {setup.scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {isAr ? s.darija : s.fr} {isAr ? `(${s.fr})` : `(${s.darija})`}
              </option>
            ))}
          </select>
        )}
      </div>

      {useParcelle && parcelle && (
        <div className="text-xs text-[#61513C] bg-[#EFE9DC] rounded-xl px-3 py-2" dir="ltr" data-testid="resume-parcelle">
          Parcelle : {regionName || `${parcelle.latitude.toFixed(2)}, ${parcelle.longitude.toFixed(2)}`} · précédent {parcelle.previous_crop}
          {' · '}{EAU_FR[parcelle.water_access] || 'eau inconnue'}
          {parcelle.data_status === 'live' || parcelle.data_status === 'cached'
            ? ` · NASA : ${parcelle.annual_rain_mm != null ? `${Math.round(parcelle.annual_rain_mm)} mm/an` : 'pluie inconnue'}, ${
                parcelle.mean_annual_temp_c != null ? `${Math.round(parcelle.mean_annual_temp_c)} °C` : 'température inconnue'}`
            : ' · climat NASA indisponible'}
        </div>
      )}

      {testMode && setup && (
        <select
          aria-label="Question de test"
          dir="ltr"
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          className="w-full text-xs rounded-xl border border-dashed border-[#8C3A27] bg-white px-3 py-2"
        >
          {setup.questions_test.map((q) => (
            <option key={q.id} value={q.id}>{q.id} · {q.ecriture_arabe} · {q.a_dire} · {q.traduction_fr}</option>
          ))}
        </select>
      )}

      {supported && (
        <button
          type="button"
          onClick={() => listen()}
          disabled={listening || !setup}
          aria-label={ui.micAria}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-md text-white transition-all ${
            listening ? 'bg-[#8C3A27] animate-pulse' : 'bg-[#2D4A27] hover:bg-[#1E331A] cursor-pointer'
          }`}
        >
          <Mic className="w-6 h-6" />
          <span>{listening ? ui.micListening : ui.micIdle}</span>
        </button>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); ask(question); }}
        className="flex gap-2"
      >
        <input
          id="fellah-question"
          dir="auto"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={ui.inputPlaceholder}
          className="flex-1 rounded-2xl border border-[#DECAB3] bg-white px-4 py-3 text-sm focus:outline-[#2D4A27]"
        />
        <button
          type="submit"
          aria-label={ui.sendAria}
          className="px-4 rounded-2xl bg-[#2D4A27] hover:bg-[#1E331A] text-white transition-colors cursor-pointer"
        >
          <Send className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
        </button>
      </form>

      {notice && <div className="text-xs font-semibold text-[#8C3A27]" role="status">{notice}</div>}

      {setup && (
        <div className="flex flex-wrap gap-2">
          {setup.suggestions.map((s) => (
            <button
              key={s.question}
              type="button"
              title={s.fr}
              data-testid="fellah-suggestion"
              onClick={() => ask(s.question)}
              className="text-xs rounded-full bg-[#EFE9DC] border border-[#DECAB3] px-3 py-1.5 text-[#1E331A] cursor-pointer hover:bg-[#E5DDCF] transition-colors"
            >
              {isAr ? s.question : isEn ? (s.fr || s.question) : s.fr}
            </button>
          ))}
        </div>
      )}

      {answer && (
        <div className="rounded-2xl bg-white border border-[#DECAB3] p-4 space-y-3 shadow-xs" data-testid="fellah-reponse" data-question={answer.question}>
          {answer.phrases.map((groupe, k) => (
            <div key={k} className="space-y-1">
              <div className="text-xl font-semibold leading-relaxed text-[#1E331A]">
                {groupe.map((p) => p.darija).join(' ')}
              </div>
              <div className="text-xs text-[#7A6B53]">
                {groupe.map((p) => p.fr).join(' ')}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={play}
            disabled={isAr && clips.length === 0}
            className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isAr && clips.length === 0 ? 'bg-[#EFE9DC] text-[#1E331A] opacity-50 cursor-not-allowed' : playing ? 'bg-[#8C3A27] text-white animate-pulse' : 'bg-[#2D4A27] hover:bg-[#1E331A] text-white shadow-md'
            }`}
          >
            {isAr && clips.length === 0 ? <VolumeX className="w-5 h-5" /> : playing ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span>{isAr && clips.length === 0 ? 'الصوت مازال ما تسجلش' : playing ? ui.stopVoice : ui.listenAnswer}</span>
          </button>
          {isAr && clips.length > 0 && (
            <div className="text-[10px] text-[#7A6B53] text-center" data-testid={synthese ? 'voix-synthese' : 'voix-enregistree'}>
              {synthese ? ui.aiVoice : ui.recordedVoice}
            </div>
          )}
          {!isAr && <div className="text-[10px] text-[#7A6B53] text-center">{ui.synthesizedVoice}</div>}

          <div className="text-[10px] text-[#7A6B53] flex justify-between" dir="ltr" data-testid="badge-source">
            <span>
              {answer.scenario === 'parcelle'
                ? `Votre parcelle — moteur du Membre 2, climat NASA (${parcelle?.data_status ?? 'inconnu'})`
                : setup?.badge}
            </span>
            <span>{answer.ms} ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
