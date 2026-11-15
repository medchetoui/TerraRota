// Questions du fellah en darija : 🎤 (reconnaissance vocale du navigateur, ar-MA puis ar) ou texte tapé,
// réponse du modèle darija (Membre 3, sur le moteur du Membre 2) en phrases enregistrées, 🔊 voix humaine.
import { useEffect, useRef, useState } from 'react';
import { Mic, Volume2, VolumeX, Send } from 'lucide-react';
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

const MESSAGES: Record<string, string> = {
  'not-allowed': 'الميكرو ما خدامش. اكتب سؤالك.',
  'service-not-allowed': 'الميكرو ما خدامش. اكتب سؤالك.',
  'no-speech': 'ما سمعتش. عاود أو اكتب سؤالك.',
  'audio-capture': 'ما لقيتش الميكرو. اكتب سؤالك.',
  network: 'خاص الأنترنيت باش نسمعك. اكتب سؤالك.',
};

export default function FellahQuestion() {
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

  useEffect(() => {
    getFellahSetup()
      .then((s) => {
        setSetup(s);
        setScenario(s.defaut);
        setTestId(s.questions_test[0]?.id || '');
      })
      .catch(() => setNotice('الخدمة ما خدامةش دابا.'));
  }, []);

  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
  };

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
      setNotice('ما قدرتش نجاوب دابا. عاود من بعد.');
    }
  };

  const listen = (langue = 'ar-MA') => {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      setNotice('هاد المتصفح ما كيسمعش. اكتب سؤالك.');
      return;
    }
    stopAudio();
    const rec = new Ctor();
    const t0 = performance.now();
    rec.lang = langue;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => ask(e.results[0][0].transcript, { langue, t0 });
    rec.onerror = (e) => {
      if (e.error === 'language-not-supported' && langue !== 'ar') {
        listen('ar');
        return;
      }
      setNotice(MESSAGES[e.error] || 'ما فهمتش. اكتب سؤالك.');
      if (e.error !== 'aborted') {
        logTry({ langue, transcription: '', intention: null, culture: null, reponse: null, erreur: e.error,
                 ms: Math.round(performance.now() - t0) });
      }
    };
    rec.onend = () => setListening(false);
    setNotice('');
    setListening(true);
    rec.start();
  };

  const clips = (answer?.phrases.flat().map((p) => p.audio).filter(Boolean) as string[]) || [];

  const play = () => {
    if (playing) {
      stopAudio();
      return;
    }
    let i = 0;
    const next = () => {
      if (i >= clips.length) {
        stopAudio();
        return;
      }
      const a = new Audio(clips[i++]);
      audioRef.current = a;
      a.onended = next;
      a.onerror = next;
      a.play().catch(next);
    };
    setPlaying(true);
    next();
  };

  return (
    <div className="bg-[#FAF7F2] p-6 rounded-3xl border border-[#DECAB3] shadow-sm max-w-2xl mx-auto space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h4 className="text-xl font-bold text-[#1E331A]">سول بالدارجة</h4>
        {setup && (
          <select
            aria-label="البلان"
            value={scenario}
            onChange={(e) => { setScenario(e.target.value); setAnswer(null); }}
            className="text-sm rounded-xl border border-[#DECAB3] bg-white px-3 py-2 text-[#1E331A]"
          >
            {setup.scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.darija} — {s.fr}</option>
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
          className="w-full text-sm rounded-xl border border-dashed border-[#8C3A27] bg-white px-3 py-2"
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
          aria-label="سجل سؤالك"
          className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-md text-white transition-all ${
            listening ? 'bg-[#8C3A27] animate-pulse' : 'bg-[#2D4A27] hover:bg-[#1E331A] cursor-pointer'
          }`}
        >
          <Mic className="w-7 h-7" />
          <span>{listening ? 'كنسمعك… تكلم دابا' : 'ضغط و سول بصوتك'}</span>
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
          placeholder="اكتب سؤالك"
          className="flex-1 rounded-2xl border border-[#DECAB3] bg-white px-4 py-3 text-lg"
        />
        <button type="submit" aria-label="صيفط" className="px-4 rounded-2xl bg-[#2D4A27] text-white cursor-pointer">
          <Send className="w-5 h-5" />
        </button>
      </form>

      {notice && <div className="text-sm font-semibold text-[#8C3A27]" role="status">{notice}</div>}

      {setup && (
        <div className="flex flex-wrap gap-2">
          {setup.suggestions.map((s) => (
            <button
              key={s.question}
              type="button"
              title={s.fr}
              data-testid="fellah-suggestion"
              onClick={() => ask(s.question)}
              className="text-sm rounded-full bg-[#EFE9DC] border border-[#DECAB3] px-3 py-1.5 text-[#1E331A] cursor-pointer hover:bg-[#E5DDCF]"
            >
              {s.question}
            </button>
          ))}
        </div>
      )}

      {answer && (
        <div className="rounded-2xl bg-white border border-[#DECAB3] p-4 space-y-3" data-testid="fellah-reponse" data-question={answer.question}>
          {answer.phrases.map((groupe, k) => (
            <div key={k}>
              <div className="text-xl leading-relaxed text-[#1E331A]">{groupe.map((p) => p.darija).join(' ')}</div>
              <div className="text-xs text-[#7A6B53]" dir="ltr">{groupe.map((p) => p.fr).join(' ')}</div>
            </div>
          ))}
          <button
            type="button"
            onClick={play}
            disabled={clips.length === 0}
            className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 bg-[#EFE9DC] text-[#1E331A] disabled:opacity-50 cursor-pointer"
          >
            {clips.length === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span>{clips.length === 0 ? 'الصوت مازال ما تسجلش' : playing ? 'وقف' : 'سمع الجواب'}</span>
          </button>
          {setup && <div className="text-[10px] text-[#7A6B53]" dir="ltr">{setup.badge}</div>}
        </div>
      )}
    </div>
  );
}
