import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import type { AdvisorChatResult } from '../types/api';

interface VoiceCallScreenProps {
  lang: 'ar' | 'fr' | 'en';
  farmerName: string;
  persona: 'ami_ahmed' | 'mi_fatima';
  onPersonaChange?: (p: 'ami_ahmed' | 'mi_fatima') => void;
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
  persona,
  onPersonaChange,
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
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const callStateRef = useRef<CallState>('connecting');

  // Keep state ref in sync for event callbacks
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const isAr = lang === 'ar';
  const isEn = lang === 'en';
  const isFatima = persona === 'mi_fatima';

  const advisorName = isFatima
    ? (isAr ? 'مي فاطمة' : isEn ? 'Mi Fatima' : 'Mi Fatima')
    : (isAr ? 'عمي أحمد' : isEn ? 'Ami Ahmed' : 'Ami Ahmed');

  const advisorTitle = isFatima
    ? (isAr ? 'مستشارتك الفلاحية' : isEn ? 'Your Agricultural Advisor' : 'Votre Conseillère Agricole')
    : (isAr ? 'مستشارك الفلاحي' : isEn ? 'Your Agricultural Advisor' : 'Votre Conseiller Agricole');

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

  // Welcome speech when call connects or persona changes
  useEffect(() => {
    isCallActiveRef.current = true;
    const welcomeTimer = setTimeout(() => {
      const welcomeText = isAr
        ? (isFatima
            ? `السلام عليكم أ سي ${farmerName}! أنا مي فاطمة، مستشارتك الفلاحية الذكية. تفضل، سولني على أرضك ومحاصيلك وأنا كنسَمْعك.`
            : `السلام عليكم أ سي ${farmerName}! أنا عمي أحمد، المستشار الفلاحي الذكي ديالك. تفضل، سولني على أرضك ومحاصيلك وأنا كنسَمْعك.`)
        : isEn
        ? (isFatima
            ? `Hello ${farmerName}! I am Mi Fatima, your smart agricultural advisor. Please, ask me about your field, soil or crop rotations, I am listening.`
            : `Hello ${farmerName}! I am Ami Ahmed, your smart agricultural advisor. Please, ask me about your field, soil or crop rotations, I am listening.`)
        : (isFatima
            ? `Bonjour ${farmerName} ! Je suis Mi Fatima, votre conseillère agricole intelligente. Posez-moi vos questions sur votre parcelle, je vous écoute.`
            : `Bonjour ${farmerName} ! Je suis Ami Ahmed, votre conseiller agricole intelligent. Posez-moi vos questions sur votre parcelle, je vous écoute.`);

      speakText(welcomeText, () => {
        if (isCallActiveRef.current && !isMuted) {
          startListening();
        }
      });
    }, 800);

    return () => {
      clearTimeout(welcomeTimer);
      stopSpeaking();
      stopListening();
    };
  }, [persona]);

  // Play high-definition human voice from backend neural TTS (Edge-TTS) with fallback to browser
  const speakText = async (text: string, onEnd?: () => void) => {
    stopListening();
    isSpeakingRef.current = true;
    setCallState('speaking');
    setCurrentAiSpeech(text);

    // Stop previous audio if any
    if (audioPlayerRef.current) {
      try { audioPlayerRef.current.pause(); } catch {}
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      // 1. Primary: Server-side Human Neural Voice (/api/v1/advisor/voice/speak/) with Edge-TTS
      const response = await fetch('/api/v1/advisor/voice/speak/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang, persona }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;

        audio.onended = () => {
          isSpeakingRef.current = false;
          URL.revokeObjectURL(audioUrl);
          if (isCallActiveRef.current) {
            if (onEnd) onEnd();
            else startListening();
          }
        };

        audio.onerror = () => {
          fallbackWebSpeech(text, onEnd);
        };

        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('Backend neural voice error, using fallback:', err);
    }

    // 2. Fallback: Browser Web Speech API
    fallbackWebSpeech(text, onEnd);
  };

  const fallbackWebSpeech = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      isSpeakingRef.current = false;
      if (onEnd) onEnd();
      else startListening();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = isAr ? 'ar' : isEn ? 'en' : 'fr';
    utterance.lang = isAr ? 'ar-MA' : isEn ? 'en-US' : 'fr-FR';

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const matchingVoices = voices.filter((v) =>
        v.lang.toLowerCase().startsWith(targetLang)
      );
      const genderPattern = isFatima ? /female|woman|fém/i : /male|man|masc/i;
      const matchedGender = matchingVoices.find((v) => genderPattern.test(v.name));
      const naturalVoice = matchedGender || matchingVoices[0];

      if (naturalVoice) {
        utterance.voice = naturalVoice;
        utterance.lang = naturalVoice.lang;
      }
    }

    utterance.rate = isAr ? 0.94 : 0.98;
    utterance.pitch = isFatima ? 1.05 : 0.95;

    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (isCallActiveRef.current) {
        if (onEnd) onEnd();
        else startListening();
      }
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      if (isCallActiveRef.current) {
        if (onEnd) onEnd();
        else startListening();
      }
    };

    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (audioPlayerRef.current) {
      try { audioPlayerRef.current.pause(); } catch {}
      audioPlayerRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
  };

  // Web Speech Recognition (STT) with auto-reconnection
  const startListening = () => {
    if (isMuted || !isCallActiveRef.current || isSpeakingRef.current) return;

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
        recognitionRef.current = null;
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
        // Harmless speech timeout or silence -> automatically restart listening loop
        if (e.error === 'no-speech' || e.error === 'network') {
          if (isCallActiveRef.current && !isSpeakingRef.current && !isMuted) {
            setTimeout(() => {
              if (isCallActiveRef.current && !isSpeakingRef.current && !isMuted) {
                startListening();
              }
            }, 600);
            return;
          }
        } else if (e.error === 'not-allowed') {
          setErrorNotice(isAr ? 'تم رفض إذن الميكروفون' : 'Microphone permission denied');
          setCallState('idle');
        } else if (e.error !== 'aborted') {
          // Keep listening ready instead of completely locking into paused state
          setTimeout(() => {
            if (isCallActiveRef.current && !isSpeakingRef.current && !isMuted) {
              startListening();
            }
          }, 800);
        }
      };

      rec.onend = () => {
        // When speech recognition ends naturally, if the call is still active and AI is not speaking, keep listening active!
        if (isCallActiveRef.current && !isSpeakingRef.current && !isMuted && callStateRef.current !== 'processing') {
          setTimeout(() => {
            if (isCallActiveRef.current && !isSpeakingRef.current && !isMuted && callStateRef.current !== 'processing') {
              startListening();
            }
          }, 400);
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
          if (isCallActiveRef.current && !isMuted) {
            startListening();
          }
        });
      } else {
        if (isCallActiveRef.current && !isMuted) {
          startListening();
        } else {
          setCallState('idle');
        }
      }
    } catch {
      if (isCallActiveRef.current && !isMuted) {
        startListening();
      } else {
        setCallState('idle');
      }
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

  const handleTapCenter = () => {
    if (callState === 'speaking') {
      stopSpeaking();
      startListening();
    } else if (callState === 'listening') {
      // already listening
    } else {
      setIsMuted(false);
      startListening();
    }
  };

  return (
    <div className="bg-[#1E331A] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#2D4A27] relative overflow-hidden flex flex-col items-center justify-between min-h-[490px]">
      {/* Background ambient pulse effects */}
      <div className="absolute inset-0 bg-radial from-[#2D4A27]/40 via-transparent to-transparent pointer-events-none"></div>

      {/* Top Header: Advisor Name, Persona Switcher, Call Timer, Detected Language */}
      <div className="w-full flex items-center justify-between text-xs text-[#E5DDCF] z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-bold text-white text-sm">
            {advisorName} — {advisorTitle}
          </span>
        </div>

        {/* Persona quick switch buttons */}
        {onPersonaChange && (
          <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/10 text-[11px]">
            <button
              onClick={() => onPersonaChange('ami_ahmed')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1 ${
                !isFatima ? 'bg-emerald-600 text-white shadow-xs' : 'text-white/60 hover:text-white'
              }`}
            >
              <span>👨‍🌾</span>
              <span>{isAr ? 'عمي أحمد (رجل)' : 'Ami Ahmed'}</span>
            </button>
            <button
              onClick={() => onPersonaChange('mi_fatima')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isFatima ? 'bg-amber-600 text-white shadow-xs' : 'text-white/60 hover:text-white'
              }`}
            >
              <span>👩‍🌾</span>
              <span>{isAr ? 'مي فاطمة (امرأة)' : 'Mi Fatima'}</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full font-mono text-xs border border-white/10">
            {formatDuration(callDuration)}
          </div>
          <div className="bg-white/10 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
            {lang}
          </div>
        </div>
      </div>

      {/* Central Visual: Animated Call Waveform & Interactive Avatar */}
      <div className="flex flex-col items-center justify-center my-6 z-10 space-y-4">
        {/* Animated Avatar / Radar */}
        <div
          onClick={handleTapCenter}
          className="relative flex items-center justify-center cursor-pointer group"
          title={isAr ? 'اضغط للتكلم أو إيقاف الصوت' : 'Click to talk or interrupt'}
        >
          {callState === 'speaking' && (
            <div className="absolute w-44 h-44 rounded-full bg-emerald-500/20 animate-ping duration-1000"></div>
          )}
          {callState === 'listening' && (
            <div className="absolute w-44 h-44 rounded-full bg-amber-500/20 animate-pulse duration-700"></div>
          )}
          {callState === 'processing' && (
            <div className="absolute w-44 h-44 rounded-full bg-sky-500/20 animate-spin"></div>
          )}

          <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-xl border-4 transition-all duration-500 group-hover:scale-105 ${
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
              <Mic className="w-12 h-12 text-white" />
            )}
          </div>
        </div>

        {/* Current Call State Label */}
        <div className="text-center space-y-1">
          <div className="text-base font-bold text-white tracking-wide">
            {callState === 'connecting'
              ? (isAr ? `جاري الاتصال بـ ${advisorName}...` : isEn ? `Connecting to ${advisorName}...` : `Connexion avec ${advisorName}...`)
              : callState === 'listening'
              ? (isAr ? `${advisorName} كيتصنت ليك... تكلم دابا` : isEn ? `${advisorName} is listening... Speak now` : `${advisorName} vous écoute... Parlez`)
              : callState === 'processing'
              ? (isAr ? 'جاري تحليل معطيات ناسا والتربة...' : isEn ? 'Analyzing NASA climate & soil data...' : 'Analyse des données NASA & sol...')
              : callState === 'speaking'
              ? (isAr ? `${advisorName} كيشرح لك النصيحة...` : isEn ? `${advisorName} is speaking...` : `${advisorName} vous répond...`)
              : (isAr ? 'اضغط على الميكروفون للتكلم' : isEn ? 'Tap microphone to speak' : 'Cliquez sur le micro pour parler')}
          </div>
          <div className="text-xs text-[#DECAB3] opacity-80">
            {isAr
              ? 'استشارة صوتية طبيعية مباشرة مبنية على بيانات ناسا الحقيقية'
              : isEn
              ? 'Ultra-realistic neural voice grounded in real NASA observations'
              : 'Voix neuronale réaliste basée sur les observations NASA'}
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

      {/* Call Controls: Mute, Resume/Start listening, End Call */}
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
