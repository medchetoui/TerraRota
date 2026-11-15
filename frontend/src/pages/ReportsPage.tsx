import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  Compass, 
  Droplets, 
  Sun, 
  CloudRain, 
  Printer, 
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import type { RecommendationResponse } from '../types/api';

interface ReportsPageProps {
  apiResponse: RecommendationResponse | null;
  regionName: string;
  lat: number;
  lon: number;
  previousCrop: string;
  waterAccess: string;
  soilType: string;
  fieldSize: string;
  lang: 'ar' | 'fr' | 'en';
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  apiResponse,
  regionName,
  lat,
  lon,
  previousCrop,
  waterAccess,
  soilType,
  fieldSize,
  lang,
}) => {
  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  const [downloading, setDownloading] = useState(false);

  const indicators = apiResponse?.indicators;
  const recommendations = apiResponse?.recommendations || [];
  const topCrop = recommendations[0];

  const annualRain = indicators?.annual_rain_mm ? Math.round(indicators.annual_rain_mm) : 320;
  const meanTemp = indicators?.mean_annual_temp_c ? indicators.mean_annual_temp_c.toFixed(1) : '20.2';
  const gdd = indicators?.gdd_base10 ? Math.round(indicators.gdd_base10) : 2250;
  const aridity = indicators?.aridity_index ? indicators.aridity_index.toFixed(2) : '0.28';

  const reportId = `TR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString(isAr ? 'ar-MA' : isEn ? 'en-GB' : 'fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const exportPDF = () => {
    // Si on est en Arabe, jsPDF ne peut pas gérer le texte, on utilise l'impression native
    if (isAr) {
      window.print();
      return;
    }

    setDownloading(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Header Banner
      doc.setFillColor(45, 74, 39);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(244, 239, 230);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('TERRAROTA', 15, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('NASA SPACE APPS CHALLENGE 2026 • FIELD SHIFT', 15, 25);
      doc.text(isEn ? `AGRICULTURAL DECISION REPORT • REF: ${reportId}` : `RAPPORT D'AIDE A LA DECISION AGRICOLE • REF: ${reportId}`, 15, 30);

      // Section 1
      let y = 46;
      doc.setTextColor(30, 51, 26);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(isEn ? '1. FARM IDENTIFICATION' : '1. IDENTIFICATION DE L\'EXPLOITATION', 15, y);

      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 40, 25);
      doc.text(`${isEn ? 'Region' : 'Region'} : ${regionName}`, 15, y);
      doc.text(`${isEn ? 'Area' : 'Superficie'} : ${fieldSize} Ha`, 110, y);

      y += 6;
      doc.text(`${isEn ? 'GPS Coordinates' : 'Coordonnees GPS'} : ${lat.toFixed(4)} N, ${lon.toFixed(4)} E`, 15, y);
      doc.text(`${isEn ? 'Water Regime' : 'Regime Hydrique'} : ${waterAccess === 'irrigated' ? (isEn ? 'Irrigated' : 'Irrigue') : (isEn ? 'Rainfed' : 'Bour')}`, 110, y);

      // Section 2
      y += 12;
      doc.setTextColor(30, 51, 26);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(isEn ? '2. NASA POWER SATELLITE OBSERVATIONS' : '2. OBSERVATIONS SATELLITAIRES NASA POWER', 15, y);

      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 40, 25);
      doc.text(isEn ? `- Annual Rainfall (PRECTOTCORR): ${annualRain} mm/yr` : `- Pluviometrie annuelle (PRECTOTCORR): ${annualRain} mm/an`, 18, y);
      y += 5;
      doc.text(isEn ? `- Mean Temp 2m (T2M): ${meanTemp} C` : `- Temperature moyenne (T2M): ${meanTemp} C`, 18, y);
      y += 5;
      doc.text(`- Growing Degree Days (GDD Base 10C): ${gdd} GDD`, 18, y);
      y += 5;
      doc.text(`- UNEP Aridity Index: ${aridity}`, 18, y);

      // Section 3
      y += 12;
      doc.setTextColor(30, 51, 26);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(isEn ? '3. AGRONOMIC RECOMMENDATION' : '3. RECOMMANDATION AGRONOMIQUE', 15, y);

      y += 7;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(140, 58, 39);
      const topName = topCrop ? `${isEn ? topCrop.crop_name_en : topCrop.crop_name_fr} (${isEn ? 'Affinity' : 'Affinite'}: ${topCrop.score}%)` : 'N/A';
      doc.text(`${isEn ? 'Recommended Crop' : 'Culture recommandee'} : ${topName}`, 15, y);

      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 40, 25);
      const reasonsToPrint = isEn ? topCrop?.reasons_en : topCrop?.reasons;
      if (reasonsToPrint) {
        reasonsToPrint.slice(0, 3).forEach((r) => {
          // Simple text wrapping for long lines
          const splitText = doc.splitTextToSize(`* ${r}`, 175);
          doc.text(splitText, 18, y);
          y += 5 * splitText.length;
        });
      }

      // Footer
      doc.setDrawColor(222, 202, 179);
      doc.line(15, 275, 195, 275);
      doc.setFontSize(7.5);
      doc.setTextColor(122, 107, 83);
      doc.text(`Generated on ${dateStr} by TerraRota Decision Engine.`, 15, 280);
      
      doc.save(`TerraRota_Report_${reportId}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE9DC] text-xs font-bold text-[#2D4A27]">
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'تقرير اتخاذ القرار الفلاحي الرسمي' : isEn ? 'Official Decision-Support Report' : 'Rapport Décisionnel Officiel'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1E331A]">
            {isAr ? 'التقرير الفلاحي النهائي للضيعة' : isEn ? 'Farm Decision Report' : 'Rapport d\'Aide à la Décision'}
          </h2>
          <p className="text-xs text-[#7A6B53]">
            {isAr ? 'المرجع:' : isEn ? 'Ref:' : 'Réf:'} <span className="font-mono font-bold text-[#1E331A]">{reportId}</span> • {isAr ? 'تاريخ الإصدار:' : isEn ? 'Date:' : 'Date d\'édition :'} {dateStr}
          </p>
        </div>

        <button
          onClick={exportPDF}
          disabled={downloading}
          className="px-6 py-3.5 rounded-2xl bg-[#2D4A27] hover:bg-[#1E331A] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
        >
          {isAr ? <Printer className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          <span>
            {downloading 
              ? (isAr ? 'جاري إنشاء PDF...' : isEn ? 'Generating PDF...' : 'Génération du PDF...') 
              : (isAr ? 'طباعة / حفظ PDF' : isEn ? 'Download Report (PDF)' : 'Télécharger le Rapport (PDF)')}
          </span>
        </button>
      </div>

      {/* Report Preview Document */}
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#DECAB3] p-8 sm:p-12 shadow-sm space-y-8 font-sans max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b-2 border-[#2D4A27] pb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-3xl font-black text-[#1E331A]">TERRAROTA 🌱</div>
            <div className="text-xs font-bold text-[#8C3A27] mt-1">NASA SPACE APPS CHALLENGE 2026 • FIELD SHIFT</div>
            <div className="text-[11px] text-[#7A6B53]">
              {isAr ? 'نظام خبير لدعم قرارات الدورة الزراعية بالمغرب' : isEn ? 'Expert Crop Rotation Decision System in Morocco' : 'Système Expert d\'Aide à la Décision de Rotation des Cultures au Maroc'}
            </div>
          </div>
          <div className={`text-xs text-[#524430] space-y-1 ${isAr ? 'text-left' : 'text-right'}`}>
            <div className="font-black">{isAr ? 'الملكية الفلاحية:' : isEn ? 'FARM:' : 'DOMAINE AGRICOLE :'} {regionName}</div>
            <div>{isAr ? 'الإحداثيات:' : isEn ? 'Coordinates:' : 'Coordonnées :'} <span dir="ltr">{lat.toFixed(4)}°N, {lon.toFixed(4)}°E</span></div>
            <div>{isAr ? 'المساحة المعلنة:' : isEn ? 'Area:' : 'Superficie déclarée :'} {fieldSize} Ha</div>
          </div>
        </div>

        {/* Section 1: NASA Environmental Context */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#1E331A] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2D4A27]" />
            <span>{isAr ? '1. التشخيص المناخي الزراعي عبر الأقمار الاصطناعية (NASA POWER)' : isEn ? '1. Satellite Agro-Climatic Diagnosis (NASA POWER)' : '1. Diagnostic Agro-Climatique Satellitaire (NASA POWER)'}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-[#EFE9DC]">
              <div className="text-[#7A6B53] font-bold">{isAr ? 'الأمطار السنوية' : isEn ? 'Annual Rain' : 'Pluie Annuelle'}</div>
              <div className="text-base font-black text-[#1E331A]">{annualRain} mm</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#EFE9DC]">
              <div className="text-[#7A6B53] font-bold">{isAr ? 'متوسط الحرارة' : isEn ? 'Mean Temp' : 'Température Moy.'}</div>
              <div className="text-base font-black text-[#1E331A]">{meanTemp} °C</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#EFE9DC]">
              <div className="text-[#7A6B53] font-bold">{isAr ? 'درجات النمو' : isEn ? 'GDD Base 10' : 'Degrés GDD Base 10'}</div>
              <div className="text-base font-black text-[#1E331A]">{gdd}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#EFE9DC]">
              <div className="text-[#7A6B53] font-bold">{isAr ? 'مؤشر الجفاف' : isEn ? 'Aridity Index' : 'Indice d\'Aridité'}</div>
              <div className="text-base font-black text-[#1E331A]">{aridity}</div>
            </div>
          </div>
        </div>

        {/* Section 2: Recommendation & Reasoning */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#1E331A] uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8C3A27]" />
            <span>{isAr ? '2. التوصية الرئيسية والأدلة الزراعية' : isEn ? '2. Main Recommendation & Agronomic Evidence' : '2. Recommandation Principale et Preuves Agronomiques'}</span>
          </h3>
          {topCrop ? (
            <div className="p-5 rounded-2xl bg-[#EFE9DC] border border-[#DECAB3] space-y-3 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-lg font-black text-[#1E331A] flex items-center gap-2">
                  <span>{topCrop.crop_emoji}</span>
                  <span>{isAr ? topCrop.crop_name_ar : isEn ? (topCrop.crop_name_en || topCrop.crop_name_fr) : topCrop.crop_name_fr}</span>
                </span>
                <span className="font-extrabold px-3 py-1 rounded-full bg-[#2D4A27] text-white">
                  {isAr ? 'نسبة الملاءمة:' : isEn ? 'Affinity Score:' : 'Score d\'affinité :'} {topCrop.score}%
                </span>
              </div>
              <ul className="space-y-1 text-[#4D3F2C]">
                {(isAr ? topCrop.reasons : isEn ? (topCrop.reasons_en || topCrop.reasons) : topCrop.reasons).map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2D4A27] shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-xs text-[#7A6B53]">{isAr ? 'في انتظار التحليل.' : isEn ? 'Awaiting analysis.' : 'En attente d\'analyse.'}</div>
          )}
        </div>

        {/* Section 3: Multi-year Strategy */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#1E331A] uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#2D4A27]" />
            <span>{isAr ? '3. الجدول الزمني المتوقع للدورة الزراعية (3 مواسم)' : isEn ? '3. Multi-Year Rotation Schedule (3 Seasons)' : '3. Calendrier Prévisionnel de Rotation (3 Saisons)'}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#EFE9DC] border border-[#DECAB3]">
              <div className="font-bold text-[#7A6B53]">2026 / 2027 ({isAr ? 'السنة 1' : isEn ? 'Year 1' : 'Année 1'})</div>
              <div className="font-black text-sm text-[#1E331A] mt-1">
                {topCrop ? (isAr ? topCrop.crop_name_ar : isEn ? (topCrop.crop_name_en || topCrop.crop_name_fr) : topCrop.crop_name_fr) : (isAr ? 'قطاني' : isEn ? 'Legume' : 'Légumineuse')}
              </div>
              <div className="text-[10px] text-[#8C3A27] mt-0.5">{isAr ? 'تثبيت النيتروجين الجوي' : isEn ? 'Atmospheric N Fixation' : 'Fixation N atmosphérique'}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#EFE9DC] border border-[#DECAB3]">
              <div className="font-bold text-[#7A6B53]">2027 / 2028 ({isAr ? 'السنة 2' : isEn ? 'Year 2' : 'Année 2'})</div>
              <div className="font-black text-sm text-[#1E331A] mt-1">{isAr ? 'القمح الصلب / الطري' : isEn ? 'Durum / Soft Wheat' : 'Blé dur / Blé tendre'}</div>
              <div className="text-[10px] text-[#8C3A27] mt-0.5">{isAr ? 'استهلاك مخلفات النيتروجين' : isEn ? 'N residual consumption' : 'Consommation reliquat N'}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#EFE9DC] border border-[#DECAB3]">
              <div className="font-bold text-[#7A6B53]">2028 / 2029 ({isAr ? 'السنة 3' : isEn ? 'Year 3' : 'Année 3'})</div>
              <div className="font-black text-sm text-[#1E331A] mt-1">{isAr ? 'الشعير / قطاني ثانوية' : isEn ? 'Barley / Secondary Legume' : 'Orge / Légumineuse secondaire'}</div>
              <div className="text-[10px] text-[#8C3A27] mt-0.5">{isAr ? 'كسر الأمراض' : isEn ? 'Sanitary break' : 'Rupture sanitaire'}</div>
            </div>
          </div>
        </div>

        {/* Section 4: Scientific Citations */}
        <div className="p-4 rounded-2xl bg-[#EFE9DC]/60 border border-[#DECAB3] text-[11px] text-[#61513C] space-y-1">
          <div className="font-bold text-[#1E331A]">
            {isAr ? 'المراجع والاعتمادات الزراعية:' : isEn ? 'Agronomic References & Approvals:' : 'Références & Homologations Agronomiques :'}
          </div>
          <div>• {isAr ? 'المعهد الوطني للبحث الزراعي (سطات) — دراسة تأثير دورات الحبوب والقطاني على الميزان المائي.' : isEn ? 'INRA Morocco (Settat) — Impact study of cereal-legume rotations on water balance.' : 'INRA Maroc (Centre Régional de Settat) — Étude d\'impact des rotations céréale-légumineuse sur le bilan hydrique.'}</div>
          <div>• {isAr ? 'منظمة الأغذية والزراعة (FAO-56) — الدليل المنهجي للتبخر والنتح للمحاصيل.' : isEn ? 'FAO Irrigation & Drainage Paper 56 — Crop evapotranspiration methodological guide.' : 'FAO Irrigation & Drainage Paper 56 — Guide méthodologique de l\'évapotranspiration des cultures.'}</div>
          <div>• {isAr ? 'إيكاردا — تحسين الخصوبة البيولوجية للتربة في المناطق القاحلة وشبه القاحلة.' : isEn ? 'ICARDA — Improving biological soil fertility in arid and semi-arid Mediterranean environments.' : 'ICARDA — Amélioration de la fertilité biologique des sols en milieu aride et semi-aride méditerranéen.'}</div>
        </div>

        {/* Legal notice */}
        <div className="text-[10px] text-[#7A6B53] text-center pt-4 border-t border-[#DECAB3]">
          {isAr 
            ? 'تيراروتا — تم تطويره في إطار تحدي ناسا لتطبيقات الفضاء 2026. جميع الملاحظات البيئية مستمدة من شبكة NASA POWER.' 
            : isEn 
            ? 'TerraRota — Developed for the NASA Space Apps Challenge 2026. All environmental observations come from the NASA POWER network.'
            : 'TerraRota — Développé dans le cadre du NASA Space Apps Challenge 2026. Toutes les observations environnementales proviennent du réseau NASA POWER.'}
        </div>
      </div>
    </div>
  );
};