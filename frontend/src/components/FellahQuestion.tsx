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
    recordedVoice: 'تسجيل استوديو',
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
    recordedVoice: 'Voix studio',
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
    recordedVoice: 'Studio Voice',
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
}

export default function FellahQuestion({ lang = 'ar' }: FellahQuestionProps) {
  const [setup, setSetup] = useState<FellahSetup | null>(null);
  const [scenario, setScenario] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<FellahAnswer | null>(null);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('');
  const [playing, setPlaying] = useState(false);
  const [testId, setTestId] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const ask = async (texte: string, voix?: { langue: string; t0: number }) => {
    const q = texte.trim();
    if (!q || !scenario) return;
    stopAudio();
    setQuestion(q);
    try {
      const r = await askFellah(q, scenario);
      setAnswer(r);
      setNotice('');
      if (voix) {
        logTry({
          langue: voix.langue, transcription: q, intention: r.intention, culture: r.culture,
          reponse: r.texte, erreur: null, ms: Math.round(performance.now() - voix.t0),
        });
      }
    } catch {
      setNotice(ui.cannotAnswer);
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

  const clips = (answer?.phrases.flat().map((p) => p.audio).filter(Boolean) as string[]) || [];

  const playWithTTS = () => {
    if (!('speechSynthesis' in window) || !answer) {
      stopAudio();
      return;
    }
    window.speechSynthesis.cancel();

    // Prepare text to speak depending on selected language
    let textToSpeak = '';
    let voiceLang = 'ar-MA';

    if (isAr) {
      textToSpeak = answer.phrases.map((g) => g.map((p) => p.darija).join(' ')).join('. ');
      voiceLang = 'ar-MA';
    } else if (isEn) {
      textToSpeak = answer.phrases.map((g) => g.map((p) => p.fr).join(' ')).join('. ');
      voiceLang = 'en-US';
    } else {
      textToSpeak = answer.phrases.map((g) => g.map((p) => p.fr).join(' ')).join('. ');
      voiceLang = 'fr-FR';
    }

    if (!textToSpeak.trim()) {
      textToSpeak = answer.texte;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const play = () => {
    if (playing) {
      stopAudio();
      return;
    }

    // If we have pre-recorded clips, play them sequentially
    if (clips.length > 0) {
      let i = 0;
      const next = () => {
        if (i >= clips.length) {
          stopAudio();
          return;
        }
        const a = new Audio(clips[i++]);
        audioRef.current = a;
        a.onended = next;
        a.onerror = () => playWithTTS();
        a.play().catch(() => playWithTTS());
      };
      setPlaying(true);
      next();
    } else {
      // Fallback cleanly to Browser Web Speech Synthesis!
      playWithTTS();
    }
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
        {setup && (
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
            disabled={clips.length === 0}
            className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              clips.length === 0 ? 'bg-[#EFE9DC] text-[#1E331A] opacity-50 cursor-not-allowed' : playing ? 'bg-[#8C3A27] text-white animate-pulse' : 'bg-[#EFE9DC] hover:bg-[#E2D8C6] text-[#1E331A]'
            }`}
          >
            {clips.length === 0 ? <VolumeX className="w-5 h-5" /> : playing ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span>{clips.length === 0 ? 'الصوت مازال ما تسجلش' : playing ? ui.stopVoice : ui.listenAnswer}</span>
            {clips.length > 0 && (
              <span className="text-[11px] font-normal opacity-70">
                ({ui.recordedVoice})
              </span>
            )}
          </button>

          {setup && (
            <div className="text-[10px] text-[#7A6B53] flex justify-between" dir="ltr">
              <span>{setup.badge}</span>
              <span>{answer.ms} ms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
