import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, Sparkles, Scale, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { FarmerContextPanel } from '../components/FarmerContextPanel';
import { VoiceCallScreen } from '../components/VoiceCallScreen';
import { AdvisorChat } from '../components/AdvisorChat';
import FellahQuestion from '../components/FellahQuestion';
import type { FellahParcelle } from '../api/client';
import {
  getAdvisorContext,
  askAdvisor,
  compareCropsAdvisor,
  proposePlanChange,
  approvePlanProposal,
} from '../api/client';
import type {
  AdvisorContextData,
  AdvisorChatResult,
  AdvisorMessageItem,
  AdvisorCompareResponse,
  PlanProposalResponse,
} from '../types/api';

interface AdvisorPageProps {
  lang: 'ar' | 'fr' | 'en';
  parcelle?: FellahParcelle | null;
  regionName?: string;
}

export const AdvisorPage: React.FC<AdvisorPageProps> = ({ lang, parcelle = null, regionName = '' }) => {
  const [persona, setPersona] = useState<'ami_ahmed' | 'mi_fatima'>('ami_ahmed');
  const [context, setContext] = useState<AdvisorContextData | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [messages, setMessages] = useState<AdvisorMessageItem[]>([]);
  const [activeResult, setActiveResult] = useState<AdvisorChatResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Crop Comparison modal state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [cropA, setCropA] = useState('wheat_hard');
  const [cropB, setCropB] = useState('chickpea');
  const [compareResult, setCompareResult] = useState<AdvisorCompareResponse['comparison'] | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Plan proposal confirmation banner state
  const [pendingProposal, setPendingProposal] = useState<PlanProposalResponse | null>(null);
  const [proposalFeedback, setProposalFeedback] = useState<string | null>(null);

  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  // Load farmer context on mount or parcel change
  const loadContext = async (parcelId?: number) => {
    try {
      const resp = await getAdvisorContext(parcelId);
      if (resp.status === 'ok') {
        setContext(resp.context);
      }
    } catch (err) {
      console.warn('Failed to load advisor context:', err);
    }
  };

  useEffect(() => {
    loadContext();
  }, []);

  // Handle asking question (via voice or text)
  const handleAsk = async (questionText: string): Promise<AdvisorChatResult | null> => {
    setIsLoading(true);

    // Optimistically add user message
    const userMsg: AdvisorMessageItem = {
      id: Date.now(),
      role: 'user',
      content: questionText,
      intent: '',
      ai_response: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const resp = await askAdvisor(
        questionText,
        lang,
        sessionId,
        context?.active_parcel?.id || null,
        undefined,
        persona
      );

      if (resp.status === 'ok') {
        setSessionId(resp.session_id);
        setActiveResult(resp.result);

        const aiMsg: AdvisorMessageItem = {
          id: Date.now() + 1,
          role: 'ai',
          content: resp.result.answer_text,
          intent: resp.result.intent,
          ai_response: resp.result,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        return resp.result;
      }
      return null;
    } catch (err) {
      console.error('Advisor ask error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Compare 2 crops
  const handleCompare = async () => {
    setIsComparing(true);
    try {
      const resp = await compareCropsAdvisor(cropA, cropB, lang, context?.active_parcel?.id || null);
      if (resp.status === 'ok') {
        setCompareResult(resp.comparison);
      }
    } catch (err) {
      console.error('Crop comparison error:', err);
    } finally {
      setIsComparing(false);
    }
  };

  // Actionable Plan Proposal workflow (propose -> farmer confirms)
  const handleProposePlan = async (cropId: string, reason: string) => {
    try {
      const resp = await proposePlanChange(
        cropId,
        reason,
        lang,
        context?.active_parcel?.id || null,
        sessionId
      );
      if (resp.status === 'ok') {
        setPendingProposal(resp);
      }
    } catch (err) {
      console.error('Plan proposal error:', err);
    }
  };

  const handleApproveProposal = async (action: 'approve' | 'reject') => {
    if (!pendingProposal) return;
    try {
      const resp = await approvePlanProposal(pendingProposal.proposal_id, action);
      if (resp.status === 'ok') {
        setProposalFeedback(
          action === 'approve'
            ? (isAr ? 'تمت إضافة المحصول بنجاح إلى خطتك الزراعية!' : isEn ? 'Crop successfully added to your Farm Plan!' : 'Culture ajoutée à votre plan avec succès !')
            : (isAr ? 'تم رفض الاقتراح. لم يتم تعديل خطتك.' : isEn ? 'Proposal rejected. No changes made.' : 'Proposition rejetée.')
        );
        setPendingProposal(null);
        setTimeout(() => setProposalFeedback(null), 5000);
      }
    } catch (err) {
      console.error('Approve proposal error:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Page Title & Mission Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#8C3A27] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'المستشار الفلاحي الذكي' : isEn ? 'Intelligent Agricultural Advisor' : 'Conseiller Agricole Intelligent'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1E331A]">
            {isAr
              ? (persona === 'mi_fatima' ? 'استشارة مباشرة مع مي فاطمة' : 'استشارة مباشرة مع عمي أحمد')
              : isEn
              ? (persona === 'mi_fatima' ? 'Live Consultation with Mi Fatima' : 'Live Consultation with Ami Ahmed')
              : (persona === 'mi_fatima' ? 'Consultation avec Mi Fatima' : 'Consultation avec Ami Ahmed')}
          </h2>
          <p className="text-xs text-[#7A6B53] mt-1 max-w-xl">
            {isAr
              ? `تحدث بصوتك أو اكتب أسئلتك. ${persona === 'mi_fatima' ? 'مي فاطمة' : 'عمي أحمد'} يفهم لهجتك ويربط النصائح مباشرة بمعطيات أرضك والطقس من أقمار ناسا.`
              : isEn
              ? `Speak naturally or type your questions. ${persona === 'mi_fatima' ? 'Mi Fatima' : 'Ami Ahmed'} analyzes your real parcel context and NASA Earth observations in real-time.`
              : `Parlez à voix haute ou écrivez. ${persona === 'mi_fatima' ? 'Mi Fatima' : 'Ami Ahmed'} analyse votre parcelle et les observations satellites NASA en temps réel.`}
          </p>
        </div>

        {/* Start Voice Call / Quick Actions */}
        <div className="flex items-center gap-2.5">
          {!isCallActive ? (
            <button
              onClick={() => setIsCallActive(true)}
              className="px-5 py-3 rounded-2xl bg-[#2D4A27] hover:bg-[#1E331A] text-white font-bold text-xs flex items-center gap-2.5 shadow-md transition-all hover:scale-102 cursor-pointer"
            >
              <Phone className="w-4 h-4 animate-bounce" />
              <span>{isAr ? 'بدء مكالمة صوتية مباشرة' : isEn ? 'Start AI Voice Call' : 'Lancer l\'appel vocal'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCallActive(false)}
              className="px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <span>{isAr ? 'إغلاق شاشة المكالمة' : isEn ? 'Close Call Screen' : 'Fermer l\'appel'}</span>
            </button>
          )}

          <button
            onClick={() => setIsCompareOpen(!isCompareOpen)}
            className="px-4 py-3 rounded-2xl bg-[#EFE9DC] hover:bg-[#E5DDCF] text-[#1E331A] font-bold text-xs flex items-center gap-2 border border-[#DECAB3] transition-colors cursor-pointer"
          >
            <Scale className="w-4 h-4 text-[#8C3A27]" />
            <span>{isAr ? 'مقارنة محصولين' : isEn ? 'Compare Crops' : 'Comparer'}</span>
          </button>
        </div>
      </div>

      {/* Assistant Persona Switcher (Ami Ahmed - Man / Mi Fatima - Woman) */}
      <div className="bg-[#FAF7F2] border border-[#DECAB3] rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2D4A27] text-white flex items-center justify-center font-bold text-lg">
            {persona === 'mi_fatima' ? '👩‍🌾' : '👨‍🌾'}
          </div>
          <div>
            <div className="text-xs font-bold text-[#1E331A]">
              {isAr ? 'اختر المستشار المفضل لديك' : isEn ? 'Choose Your Agricultural Advisor' : 'Choisissez Votre Conseiller'}
            </div>
            <div className="text-[11px] text-[#7A6B53]">
              {isAr
                ? 'استمتع باستشارة صوتية بالدارجة المغربية بصوت رجالي أو نسائي فائق الواقعية'
                : 'Experience ultra-realistic Moroccan voice consultation in male or female tone'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-[#DECAB3]">
          <button
            onClick={() => setPersona('ami_ahmed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              persona === 'ami_ahmed'
                ? 'bg-[#2D4A27] text-white shadow-sm'
                : 'text-[#7A6B53] hover:text-[#1E331A]'
            }`}
          >
            <span>👨‍🌾</span>
            <span>{isAr ? 'عمي أحمد (صوت رجالي)' : 'Ami Ahmed (Male)'}</span>
          </button>
          <button
            onClick={() => setPersona('mi_fatima')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              persona === 'mi_fatima'
                ? 'bg-[#8C3A27] text-white shadow-sm'
                : 'text-[#7A6B53] hover:text-[#1E331A]'
            }`}
          >
            <span>👩‍🌾</span>
            <span>{isAr ? 'مي فاطمة (صوت نسائي)' : 'Mi Fatima (Female)'}</span>
          </button>
        </div>
      </div>

      {/* Pending Plan Proposal Confirmation Banner (Strict Human-in-the-Loop) */}
      {pendingProposal && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-950">
                {isAr ? 'اقتراح تعديل على خطتك الزراعية' : isEn ? 'Proposed Farm Plan Modification' : 'Proposition de modification de plan'}
              </div>
              <p className="text-xs text-amber-800 mt-0.5">{pendingProposal.explanation}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleApproveProposal('approve')}
              className="px-4 py-2 bg-[#2D4A27] hover:bg-[#1E331A] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              {isAr ? 'موافق، اعتمد الخطة' : isEn ? 'Approve & Save' : 'Approuver'}
            </button>
            <button
              onClick={() => handleApproveProposal('reject')}
              className="px-3 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              {isAr ? 'رفض' : isEn ? 'Reject' : 'Rejeter'}
            </button>
          </div>
        </div>
      )}

      {proposalFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-700" />
          <span>{proposalFeedback}</span>
        </div>
      )}

      {/* Real Farmer Connected Context Banner */}
      <FarmerContextPanel
        context={context}
        lang={lang}
        onSelectParcel={(id) => loadContext(id)}
      />

      {/* Classic Darija Quick Question Box (Member 3 component & test harness compatibility) */}
      <FellahQuestion lang={lang} persona={persona} parcelle={parcelle} regionName={regionName} />

      {/* Interactive AI Voice Call Screen (if active) */}
      {isCallActive && (
        <div className="animate-in zoom-in-95 duration-300">
          <VoiceCallScreen
            lang={lang}
            farmerName={context?.farmer?.first_name || 'Agriculteur'}
            persona={persona}
            onPersonaChange={setPersona}
            onCallEnd={() => setIsCallActive(false)}
            onQuestionAsked={handleAsk}
            activeResult={activeResult}
          />
        </div>
      )}

      {/* Text Consultation & Conversation Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1E331A] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#2D4A27]" />
              <span>{isAr ? 'المحادثة والاستشارة المكتوبة' : isEn ? 'Consultation & Conversation Log' : 'Conversation Écrite'}</span>
            </h3>
            <span className="text-[11px] text-[#7A6B53]">
              {messages.length} {isAr ? 'رسائل' : 'messages'}
            </span>
          </div>

          <AdvisorChat
            lang={lang}
            messages={messages}
            onSendMessage={async (txt) => { await handleAsk(txt); }}
            isLoading={isLoading}
            onProposePlan={handleProposePlan}
            persona={persona}
          />
        </div>

        {/* Right Sidebar: Quick Questions & Crop Comparison tool */}
        <div className="space-y-4">
          {/* Quick Questions Starter */}
          <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#DECAB3] space-y-3">
            <div className="text-xs font-bold text-[#1E331A]">
              {isAr ? 'أسئلة شائعة يمكنك طرحها' : isEn ? 'Frequent Questions' : 'Questions Fréquentes'}
            </div>
            <div className="space-y-1.5">
              {(isAr
                ? [
                    'شنو نزرع هاد الموسم فالأرض ديالي؟',
                    'علاش نصحتيني بهاد المحصول؟',
                    'واش التساقطات ديال ناسا كافية للقمح؟',
                    'واش نوعية التربة ديالي مزيانة؟',
                    'شنو أحسن دورة زراعية بعد الحمص؟',
                  ]
                : isEn
                ? [
                    'What should I plant this season?',
                    'Why do you recommend this crop?',
                    'Is NASA rainfall sufficient for wheat?',
                    'Is my soil condition suitable?',
                    'Best crop rotation after chickpea?',
                  ]
                : [
                    'Que planter cette saison sur ma parcelle ?',
                    'Pourquoi recommandez-vous cette culture ?',
                    'La pluviométrie NASA est-elle suffisante ?',
                    'Mon sol est-il adapté ?',
                    'Quelle rotation après du pois chiche ?',
                  ]
              ).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(q)}
                  className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-[#EFE9DC] text-xs text-[#1E331A] border border-[#DECAB3] transition-colors cursor-pointer text-start truncate"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Crop Comparison Drawer/Card */}
          <div className="bg-[#FAF7F2] p-5 rounded-3xl border border-[#DECAB3] space-y-3">
            <div className="text-xs font-bold text-[#1E331A] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#8C3A27]" />
                <span>{isAr ? 'مقارنة مباشرة بين محصولين' : isEn ? 'Compare Two Crops' : 'Comparer Deux Cultures'}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-[#7A6B53]">{isAr ? 'المحصول الأول' : 'Culture A'}</label>
                <select
                  value={cropA}
                  onChange={(e) => setCropA(e.target.value)}
                  className="w-full bg-white border border-[#DECAB3] rounded-xl px-2 py-1.5 text-xs text-[#1E331A]"
                >
                  <option value="wheat_hard">{isAr ? 'القمح الصلب' : 'Blé dur'}</option>
                  <option value="wheat_soft">{isAr ? 'القمح الطري' : 'Blé tendre'}</option>
                  <option value="barley">{isAr ? 'الشعير' : 'Orge'}</option>
                  <option value="chickpea">{isAr ? 'الحمص' : 'Pois chiche'}</option>
                  <option value="lentil">{isAr ? 'العدس' : 'Lentille'}</option>
                  <option value="olive">{isAr ? 'الزيتون' : 'Olivier'}</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#7A6B53]">{isAr ? 'المحصول الثاني' : 'Culture B'}</label>
                <select
                  value={cropB}
                  onChange={(e) => setCropB(e.target.value)}
                  className="w-full bg-white border border-[#DECAB3] rounded-xl px-2 py-1.5 text-xs text-[#1E331A]"
                >
                  <option value="chickpea">{isAr ? 'الحمص' : 'Pois chiche'}</option>
                  <option value="lentil">{isAr ? 'العدس' : 'Lentille'}</option>
                  <option value="barley">{isAr ? 'الشعير' : 'Orge'}</option>
                  <option value="wheat_hard">{isAr ? 'القمح الصلب' : 'Blé dur'}</option>
                  <option value="tomato">{isAr ? 'الطماطم' : 'Tomate'}</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCompare}
              disabled={isComparing}
              className="w-full py-2 bg-[#2D4A27] hover:bg-[#1E331A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isComparing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>{isAr ? 'قارن بناءً على أرضي' : isEn ? 'Compare on My Land' : 'Comparer selon ma parcelle'}</span>
              )}
            </button>

            {compareResult && (
              <div className="mt-3 p-3 bg-white rounded-2xl border border-[#DECAB3] text-xs space-y-2">
                <div className="font-bold text-[#8C3A27]">{compareResult.verdict}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-[#DECAB3] pt-2">
                  <div>
                    <div className="font-bold text-[#1E331A] flex items-center gap-1">
                      <span>{compareResult.crop_a.emoji}</span>
                      <span>{compareResult.crop_a.name}</span>
                    </div>
                    <div className="text-[#7A6B53]">Score: {compareResult.crop_a.score || '-'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#1E331A] flex items-center gap-1">
                      <span>{compareResult.crop_b.emoji}</span>
                      <span>{compareResult.crop_b.name}</span>
                    </div>
                    <div className="text-[#7A6B53]">Score: {compareResult.crop_b.score || '-'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
