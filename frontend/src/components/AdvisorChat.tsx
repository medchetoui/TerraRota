import React, { useState } from 'react';
import { Send, Sparkles, Volume2, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import type { AdvisorChatResult, AdvisorMessageItem } from '../types/api';

interface AdvisorChatProps {
  lang: 'ar' | 'fr' | 'en';
  messages: AdvisorMessageItem[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onProposePlan?: (cropId: string, reason: string) => void;
  onCompareCrops?: (cropA: string, cropB: string) => void;
}

export const AdvisorChat: React.FC<AdvisorChatProps> = ({
  lang,
  messages,
  onSendMessage,
  isLoading,
  onProposePlan,
  onCompareCrops,
}) => {
  const [inputText, setInputText] = useState('');
  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const msg = inputText.trim();
    setInputText('');
    onSendMessage(msg);
  };

  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const speakText = async (text: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      // 1. Try human neural voice from backend
      const resp = await fetch('/api/v1/advisor/voice/speak/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }),
      });
      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        audio.onended = () => URL.revokeObjectURL(url);
        await audio.play();
        return;
      }
    } catch {
      // fallback
    }

    // 2. Fallback
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = isAr ? 'ar' : isEn ? 'en' : 'fr';
    utterance.lang = isAr ? 'ar-XA' : isEn ? 'en-US' : 'fr-FR';

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const matching = voices.filter((v) => v.lang.toLowerCase().startsWith(targetLang));
      const natural = matching.find((v) => /natural|neural|google|premium|enhanced/i.test(v.name)) || matching[0];
      if (natural) {
        utterance.voice = natural;
        utterance.lang = natural.lang;
      }
    }
    utterance.rate = isAr ? 0.92 : 0.96;
    utterance.pitch = 0.95;
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-[520px] bg-white rounded-3xl border border-[#DECAB3] shadow-sm overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#7A6B53] space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#DECAB3] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#2D4A27]" />
            </div>
            <div className="text-sm font-bold text-[#1E331A]">
              {isAr ? 'عمي أحمد جاهز للإجابة على تساؤلاتك' : isEn ? 'Ami Ahmed is ready to advise you' : 'Ami Ahmed est prêt à répondre'}
            </div>
            <p className="text-xs max-w-sm">
              {isAr
                ? 'اطرح سؤالك حول أفضل محصول، أسباب التوصية، تأثير المطر، أو قارن بين محصولين.'
                : isEn
                ? 'Ask about optimal crops, recommendation evidence, rainfall effects, or crop comparisons.'
                : 'Posez vos questions sur la culture idéale, les raisons agronomiques, ou la pluie.'}
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id || Math.random()}
              className={`flex flex-col ${m.role === 'user' ? (isAr ? 'items-start' : 'items-end') : (isAr ? 'items-end' : 'items-start')}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-xs space-y-2 ${
                  m.role === 'user'
                    ? 'bg-[#2D4A27] text-white rounded-br-none'
                    : 'bg-[#FAF7F2] text-[#1E331A] border border-[#DECAB3] rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-3 text-xs opacity-75">
                  <span className="font-bold">
                    {m.role === 'user'
                      ? (isAr ? 'أنت' : isEn ? 'You' : 'Vous')
                      : (isAr ? 'عمي أحمد (مستشار ناسا)' : isEn ? 'Ami Ahmed (NASA Advisor)' : 'Ami Ahmed')}
                  </span>
                  {m.role === 'ai' && (
                    <button
                      onClick={() => speakText(m.content)}
                      className="hover:text-[#2D4A27] cursor-pointer"
                      title={isAr ? 'استمع' : 'Écouter'}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>

                {/* AI Structured Evidence Badge */}
                {m.ai_response?.top_crop && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-[#DECAB3] text-xs text-[#1E331A] space-y-1.5">
                    <div className="font-bold flex items-center justify-between text-[#2D4A27]">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">{m.ai_response.top_crop.emoji}</span>
                        <span>{isAr ? m.ai_response.top_crop.name_ar : isEn ? m.ai_response.top_crop.name_en : m.ai_response.top_crop.name_fr}</span>
                      </span>
                      <span className="bg-[#EFE9DC] px-2 py-0.5 rounded-full font-mono text-[11px]">
                        {m.ai_response.top_crop.score} pts
                      </span>
                    </div>

                    {/* Scientific Evidence from INRA / NASA */}
                    {m.ai_response.evidence && m.ai_response.evidence.length > 0 && (
                      <div className="text-[11px] text-[#7A6B53] border-t border-[#DECAB3] pt-1.5">
                        <span className="font-bold">{isAr ? 'سند علمي: ' : 'Preuve scientifique: '}</span>
                        <span>{m.ai_response.evidence[0].source}</span>
                      </div>
                    )}

                    {/* Action button to propose to plan */}
                    {onProposePlan && (
                      <button
                        onClick={() => onProposePlan(m.ai_response!.top_crop!.crop_id, m.ai_response!.answer_text)}
                        className="w-full mt-2 py-1.5 px-3 bg-[#EFE9DC] hover:bg-[#E5DDCF] text-[#2D4A27] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {isAr ? 'اقتراح إضافة هذا المحصول إلى خطة أرضي' : isEn ? 'Propose this crop for my Farm Plan' : 'Proposer pour mon plan'}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Followup suggestions */}
                {m.ai_response?.followup_suggestions && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {m.ai_response.followup_suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSendMessage(s)}
                        className="text-[11px] bg-white/80 hover:bg-white text-[#2D4A27] px-2.5 py-1 rounded-full border border-[#DECAB3] transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className={`flex ${isAr ? 'justify-start' : 'justify-end'}`}>
            <div className="bg-[#FAF7F2] border border-[#DECAB3] rounded-2xl p-3 flex items-center gap-2 text-xs text-[#7A6B53]">
              <span className="w-2 h-2 rounded-full bg-[#2D4A27] animate-ping"></span>
              <span>{isAr ? 'عمي أحمد كيفكّر...' : isEn ? 'Ami Ahmed is reasoning...' : 'Ami Ahmed analyse...'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#FAF7F2] border-t border-[#DECAB3] flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isAr
              ? 'اكتب سؤالك هنا (مثلاً: واش القمح مناسب لأرضي؟)'
              : isEn
              ? 'Type your question (e.g. Is wheat good for my soil?)'
              : 'Tapez votre question (ex: Le blé convient-il à mon sol ?)'
          }
          className="flex-1 bg-white border border-[#DECAB3] rounded-2xl px-4 py-2.5 text-xs text-[#1E331A] focus:outline-[#2D4A27]"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-4 py-2.5 bg-[#2D4A27] hover:bg-[#1E331A] text-white rounded-2xl transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center shadow-xs"
        >
          <Send className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
        </button>
      </form>
    </div>
  );
};
