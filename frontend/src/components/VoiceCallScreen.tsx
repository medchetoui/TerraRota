import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import type { AdvisorChatResult } from '../types/api';

interface VoiceCallScreenProps {
  lang: 'ar' | 'fr' | 'en';
  farmerName: string;
  onCallEnd: () => void;
  onQuestionAsked: (question: string) => Promise<AdvisorChatResult | null>;
  activeResult: AdvisorChatResult | null;
}

type CallState =
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'idle';

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: () => void;
  onresult: (e: any) => void;
  onerror: (e: any) => void;
  onend: () => void;
}

export const VoiceCallScreen: React.FC<VoiceCallScreenProps> = ({
  lang,
  farmerName,
  onCallEnd,
  onQuestionAsked,
  activeResult,
}) => {
  const [callState, setCallState] = useState<CallState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [currentAiSpeech, setCurrentAiSpeech] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isSpeakingRef = useRef(false);
  const isCallActiveRef = useRef(true);

  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  // Call duration counter
  useEffect(() => {
    isCallActiveRef.current = true;
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => {
      isCallActiveRef.current = false;
      clearInterval(timer);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Welcome speech when call connects
  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      setCallState('speaking');
      const welcomeText = isAr
        ? `السلام عليكم أ سي ${farmerName}! أنا عمي أحمد، المستشار الفلاحي الذكي ديالك. تفضل، سولني على أرضك ومحاصيلك وأنا كنسَمْعك.`
        : isEn
        ? `Hello ${farmerName}! I am Ami Ahmed, your smart agricultural advisor. Please, ask me about your field, soil or crop rotations, I am listening.`
        : `Bonjour ${farmerName} ! Je suis Ami Ahmed, votre conseiller agricole intelligent. Posez-moi vos questions sur votre parcelle, je vous écoute.`;

      speakText(welcomeText, () => {
        if (isCallActiveRef.current) {
          startListening();
        }
      });
    }, 1200);

    return () => {
      clearTimeout(welcomeTimer);
      stopSpeaking();
      stopListening();
    };
  }, []);

  // Web Speech Synthesis (TTS) - Enhanced with Natural Voices (Arabic/French/English)
  const speakText = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    isSpeakingRef.current = true;
    setCallState('speaking');
    setCurrentAiSpeech(text);

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = isAr ? 'ar' : isEn ? 'en' : 'fr';
    utterance.lang = isAr ? 'ar-XA' : isEn ? 'en-US' : 'fr-FR';

    // Pick the most natural human-like voice available in the user's OS / browser
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      // Prioritize natural Google / Microsoft Neural / Apple voices
      const matchingVoices = voices.filter((v) =>
        v.lang.toLowerCase().startsWith(targetLang)
      );

      const naturalVoice = matchingVoices.find((v) =>
        /natural|neural|google|premium|enhanced/i.test(v.name)
      ) || matchingVoices.find((v) => !/desktop/i.test(v.name)) || matchingVoices[0];

      if (naturalVoice) {
        utterance.voice = naturalVoice;
        utterance.lang = naturalVoice.lang;
      }
    }

    // Warm, respectful advisory pace & pitch
    utterance.rate = isAr ? 0.92 : 0.96;
    utterance.pitch = 0.95; // Slightly deeper, warm advisor tone

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (isCallActiveRef.current) {
        if (onEnd) onEnd();
        else startListening();
      }
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      isSpeakingRef.current = false;
      if (isCallActiveRef.current) {
        if (onEnd) onEnd();
        else startListening();
      }
    };

    // Chrome bug workaround: ensure resume before speak
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
  };

  // Web Speech Recognition (STT)
  const startListening = () => {
    if (isMuted || !isCallActiveRef.current) return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setErrorNotice(
        isAr
          ? 'المتصفح لا يدعم التعرف على الصوت. استعمل الكتابة أسفله.'
          : isEn
          ? 'Browser speech recognition not supported. Use text input below.'
          : 'Reconnaissance vocale non prise en charge. Utilisez le texte.'
      );
      setCallState('idle');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const rec: SpeechRecognitionInstance = new SpeechRec();
      rec.lang = isAr ? 'ar-MA' : isEn ? 'en-US' : 'fr-FR';
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => {
        setCallState('listening');
        setErrorNotice(null);
      };

      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = final || interim;
        setTranscript(text);

        if (final && final.trim().length > 1) {
          handleFarmerSpokenQuestion(final.trim());
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'no-speech') {
          // Restart listening after brief pause
          if (isCallActiveRef.current && !isSpeakingRef.current) {
            setTimeout(() => startListening(), 800);
          }
        } else if (e.error !== 'aborted') {
          setCallState('idle');
        }
      };

      rec.onend = () => {
        if (isCallActiveRef.current && callState === 'listening' && !isSpeakingRef.current) {
          // Keep listening loop active
          setTimeout(() => startListening(), 600);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('Speech recognition error:', err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  const handleFarmerSpokenQuestion = async (userText: string) => {
    stopListening();
    setCallState('processing');

    try {
      const result = await onQuestionAsked(userText);
      if (result && isCallActiveRef.current) {
        // Voice speaks the personalized answer
        speakText(result.answer_text, () => {
          if (isCallActiveRef.current) {
            startListening();
          }
        });
      } else {
        setCallState('idle');
      }
    } catch {
      setCallState('idle');
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      stopListening();
      setCallState('idle');
    }
  };

  const handleHangUp = () => {
    isCallActiveRef.current = false;
    stopSpeaking();
    stopListening();
    onCallEnd();
  };

  return (
    <div className="bg-[#1E331A] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#2D4A27] relative overflow-hidden flex flex-col items-center justify-between min-h-[480px]">
      {/* Background ambient pulse effects */}
      <div className="absolute inset-0 bg-radial from-[#2D4A27]/40 via-transparent to-transparent pointer-events-none"></div>

      {/* Top Header: Advisor Name, Call Timer, Detected Language */}
      <div className="w-full flex items-center justify-between text-xs text-[#E5DDCF] z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-bold text-white text-sm">
            {isAr ? 'عمي أحمد — مستشارك الفلاحي' : isEn ? 'Ami Ahmed — AI Agricultural Advisor' : 'Ami Ahmed — Conseiller Agricole'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full font-mono text-xs border border-white/10">
            {formatDuration(callDuration)}
          </div>
          <div className="bg-white/10 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
            {lang}
          </div>
        </div>
      </div>

      {/* Central Visual: Animated Call Waveform & Avatar */}
      <div className="flex flex-col items-center justify-center my-6 z-10 space-y-4">
        {/* Animated Avatar / Radar */}
        <div className="relative flex items-center justify-center">
          {callState === 'speaking' && (
            <div className="absolute w-44 h-44 rounded-full bg-emerald-500/20 animate-ping duration-1000"></div>
          )}
          {callState === 'listening' && (
            <div className="absolute w-44 h-44 rounded-full bg-amber-500/20 animate-pulse duration-700"></div>
          )}
          {callState === 'processing' && (
            <div className="absolute w-44 h-44 rounded-full bg-sky-500/20 animate-spin"></div>
          )}

          <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-500 ${
            callState === 'speaking'
              ? 'bg-emerald-700 border-emerald-400 scale-105'
              : callState === 'listening'
              ? 'bg-amber-700 border-amber-400 scale-100 animate-pulse'
              : callState === 'processing'
              ? 'bg-sky-800 border-sky-400'
              : 'bg-[#2D4A27] border-[#DECAB3]'
          }`}>
            {callState === 'speaking' ? (
              <Volume2 className="w-14 h-14 text-white animate-bounce" />
            ) : callState === 'listening' ? (
              <Mic className="w-14 h-14 text-white animate-pulse" />
            ) : callState === 'processing' ? (
              <Sparkles className="w-14 h-14 text-white animate-spin" />
            ) : (
              <Phone className="w-12 h-12 text-white" />
            )}
          </div>
        </div>

        {/* Current Call State Label */}
        <div className="text-center space-y-1">
          <div className="text-base font-bold text-white tracking-wide">
            {callState === 'connecting'
              ? (isAr ? 'جاري الاتصال بعمي أحمد...' : isEn ? 'Connecting to Ami Ahmed...' : 'Connexion en cours...')
              : callState === 'listening'
              ? (isAr ? 'عمي أحمد كيتصنت ليك... تكلم دابا' : isEn ? 'Ami Ahmed is listening... Speak now' : 'Ami Ahmed vous écoute... Parlez')
              : callState === 'processing'
              ? (isAr ? 'جاري تحليل معطيات ناسا والتربة...' : isEn ? 'Analyzing NASA climate & soil data...' : 'Analyse des données NASA & sol...')
              : callState === 'speaking'
              ? (isAr ? 'عمي أحمد كيشرح لك النصيحة...' : isEn ? 'Ami Ahmed is speaking...' : 'Ami Ahmed vous répond...')
              : (isAr ? 'المكالمة متوقفة مؤقتاً' : isEn ? 'Call paused' : 'En attente')}
          </div>
          <div className="text-xs text-[#DECAB3] opacity-80">
            {isAr
              ? 'استشارة صوتية مباشرة مبنية على بيانات ناسا الحقيقية'
              : isEn
              ? 'Live voice consultation grounded in real NASA observations'
              : 'Consultation vocale directe basée sur les observations NASA'}
          </div>
        </div>
      </div>

      {/* Live Transcript / Subtitles */}
      <div className="w-full max-w-xl bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center z-10 min-h-[70px] flex items-center justify-center">
        {callState === 'speaking' && currentAiSpeech ? (
          <p className="text-sm text-emerald-300 font-medium leading-relaxed italic line-clamp-3">
            "{currentAiSpeech}"
          </p>
        ) : transcript ? (
          <p className="text-sm text-amber-300 font-medium leading-relaxed line-clamp-2">
            "{transcript}"
          </p>
        ) : (
          <p className="text-xs text-white/50">
            {isAr
              ? 'تكلم بالدارجة، العربية، الفرنسية أو الإنجليزية...'
              : isEn
              ? 'Speak in Darija, Arabic, French, or English...'
              : 'Parlez en darija, arabe, français ou anglais...'}
          </p>
        )}
      </div>

      {errorNotice && (
        <div className="mt-2 text-xs text-amber-300 flex items-center gap-1.5 z-10">
          <AlertCircle className="w-4 h-4" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Call Controls: Mute, End Call */}
      <div className="w-full flex items-center justify-center gap-6 mt-6 z-10">
        {/* Mute button */}
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all cursor-pointer shadow-lg ${
            isMuted ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* End Call button */}
        <button
          onClick={handleHangUp}
          className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-xl hover:scale-105 flex items-center justify-center"
          title={isAr ? 'إنهاء المكالمة' : isEn ? 'End Call' : 'Terminer l\'appel'}
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
