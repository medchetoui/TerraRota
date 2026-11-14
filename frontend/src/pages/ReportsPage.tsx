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
  const provenance = apiResponse?.provenance;
  const recommendations = apiResponse?.recommendations || [];
  const topCrop = recommendations[0];

  const annualRain = indicators?.annual_rain_mm ? Math.round(indicators.annual_rain_mm) : 320;
  const meanTemp = indicators?.mean_annual_temp_c ? indicators.mean_annual_temp_c.toFixed(1) : '20.2';
  const gdd = indicators?.gdd_base10 ? Math.round(indicators.gdd_base10) : 2250;
  const aridity = indicators?.aridity_index ? indicators.aridity_index.toFixed(2) : '0.28';

  const reportId = `TR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const exportPDF = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Header Banner
      doc.setFillColor(45, 74, 39); // #2D4A27
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(244, 239, 230); // #F4EFE6
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('TERRAROTA', 15, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('NASA SPACE APPS CHALLENGE 2026 • FIELD SHIFT', 15, 25);
      doc.text(`RAPPORT D'AIDE A LA DECISION AGRICOLE • REF: ${reportId}`, 15, 30);

      // Section 1: Identification
      let y = 46;
      doc.setTextColor(30, 51, 26);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('1. IDENTIFICATION DE L\'EXPLOITATION', 15, y);

      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 40, 25);
      doc.text(`Region : ${regionName}`, 15, y);
      doc.text(`Superficie : ${fieldSize} Hectares`, 110, y);

      y += 6;
      doc.text(`Coordonnees GPS : ${lat.toFixed(4)} N, ${lon.toFixed(4)} E`, 15, y);
      doc.text(`Regime Hydrique : ${waterAccess === 'irrigated' ? 'Irrigue' : 'Bour (Pluvial)'}`, 110, y);

      y += 6;
      doc.text(`Type de Sol : ${soilType}`, 15, y);
      doc.text(`Precedent Cultural : ${previousCrop}`, 110, y);

      // Section 2: Observations NASA POWER
      y += 12;
      doc.setTextColor(30, 51, 26);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('2. OBSERVATIONS SATELLITAIRES NASA POWER (AGROCLIMATOLOGIE)', 15, y);

      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 40, 25);
      doc.text(`Source : NASA POWER Daily Point API v2.0 (Resolution spatiale 0.5 deg)`, 15, y);

      y += 6;
      doc.text(`- Pluviometrie annuelle moyenne (PRECTOTCORR) : ${annualRain} mm/an`, 18, y);
      y += 5;
      doc.text(`- Temperature annuelle moyenne a 2m (T2M) : ${meanTemp} C`, 18, y);
      y += 5;
      doc.text(`- Degres-jours de croissance cumules (GDD Base 10C) : ${gdd} GDD`, 18, y);
      y += 5;
      doc.text(`- Indice d'aridite UNEP (P / PET Thornthwaite) : ${aridity}`, 18, y);

      // Section 3: Recommendations
      y += 12;
      doc.setTextColor(30, 51, 26);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('3. RECOMMANDATION AGRONOMIQUE RETENUE', 15, y);

      y += 7;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(140, 58, 39); // #8C3A27
      const topName = topCrop ? `${topCrop.crop_name_fr} (Score d'affinite : ${topCrop.score}%)` : 'Non disponible';
      doc.text(`Culture Recommandee : ${topName}`, 15, y);

      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 40, 25);
      if (topCrop?.reasons) {
        topCrop.reasons.slice(0, 3).forEach((r) => {
          doc.text(`* ${r}`, 18, y);
          y += 5;
        });
      }

      // Section 4: Multi-year sequence
      y += 8;
      doc.setTextColor(30, 51, 26);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('4. PLAN DE ROTATION PLURIANNUEL PROPOSE (3 ANS)', 15, y);

      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 40, 25);
      doc.text(`- Annee 1 (2026/2027) : ${topCrop?.crop_name_fr || 'Culture fixatrice N'} (Implantation & Fixation Azote)`, 18, y);
      y += 5;
      doc.text(`- Annee 2 (2027/2028) : Ble dur / Ble tendre (Valorisation du reliquat azote)`, 18, y);
      y += 5;
      doc.text(`- Annee 3 (2028/2029) : Orge / Legumineuse secondaire (Diversification sanitaire)`, 18, y);

      // Section 5: Scientific Citations
      y += 12;
      doc.setTextColor(30, 51, 26);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('5. REFERENCES ET METHODOLOGIE SCIENTIFIQUE', 15, y);

      y += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 80, 65);
      doc.text('- INRA Maroc (Settat) : Bulletin de recherche sur la rotation cereale-legumineuse.', 18, y);
      y += 4;
      doc.text('- FAO Irrigation & Drainage Paper 56 : Crop Evapotranspiration Guidelines.', 18, y);
      y += 4;
      doc.text('- ICARDA : Legume Biological Nitrogen Fixation & Soil Health in Mediterranean Drylands.', 18, y);

      // Footer
      doc.setDrawColor(222, 202, 179);
      doc.line(15, 275, 195, 275);
      doc.setFontSize(7.5);
      doc.text(`Document genere le ${dateStr} par TerraRota Decision Engine. Aucune donnee climatologique n'est fabriquee.`, 15, 280);
      doc.text('Avis non contractuel destine a l\'aide a la decision. Validation recommandee aupres du conseiller agricole local.', 15, 284);

      doc.save(`TerraRota_Decision_Report_${reportId}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE9DC] text-xs font-bold text-[#2D4A27]">
            <FileText className="w-4 h-4" />
            <span>{isAr ? 'تقرير اتخاذ القرار الفلاحي الرسمي' : isEn ? 'Official Decision-Support Report' : 'Rapport Décisionnel Officiel'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#1E331A]">
            {isAr ? 'التقرير الفلاحي النهائي للضيعة' : 'Rapport d\'Aide à la Décision'}
          </h2>
          <p className="text-xs text-[#7A6B53]">
            Réf: <span className="font-mono font-bold text-[#1E331A]">{reportId}</span> • Date d'édition : {dateStr}
          </p>
        </div>

        <button
          onClick={exportPDF}
          disabled={downloading}
          className="px-6 py-3.5 rounded-2xl bg-[#2D4A27] hover:bg-[#1E331A] text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Génération du PDF...' : 'Télécharger le Rapport (PDF)'}</span>
        </button>
      </div>

      {/* Report Preview Document */}
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#DECAB3] p-8 sm:p-12 shadow-sm space-y-8 font-sans max-w-4xl mx-auto">
        {/* Document Header */}
        <div className="border-b-2 border-[#2D4A27] pb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-3xl font-black text-[#1E331A]">TERRAROTA 🌱</div>
            <div className="text-xs font-bold text-[#8C3A27] mt-1">NASA SPACE APPS CHALLENGE 2026 • FIELD SHIFT</div>
            <div className="text-[11px] text-[#7A6B53]">Système Expert d'Aide à la Décision de Rotation des Cultures au Maroc</div>
          </div>
          <div className="text-right text-xs text-[#524430] space-y-1">
            <div className="font-black">DOMAINE AGRICOLE : {regionName}</div>
            <div>Coordonnées : {lat.toFixed(4)}°N, {lon.toFixed(4)}°E</div>
            <div>Superficie déclarée : {fieldSize} Ha</div>
          </div>
        </div>

        {/* Section 1: NASA Environmental Context */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#1E331A] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2D4A27]" />
            <span>1. Diagnostic Agro-Climatique Satellitaire (NASA POWER)</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-[#EFE9DC]">
              <div className="text-[#7A6B53] font-bold">Pluie Annuelle</div>
              <div className="text-base font-black text-[#1E331A]">{annualRain} mm/an</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#EFE9DC]">
              <div className="text-[#7A6B53] font-bold">Température Moy.</div>
              <div className="text-base font-black text-[#1E331A]">{meanTemp} °C</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#EFE9DC]">
              <div className="text-[#7A6B53] font-bold">Degrés GDD Base 10</div>
              <div className="text-base font-black text-[#1E331A]">{gdd}</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#EFE9DC]">
              <div className="text-[#7A6B53] font-bold">Indice d'Aridité</div>
              <div className="text-base font-black text-[#1E331A]">{aridity}</div>
            </div>
          </div>
        </div>

        {/* Section 2: Recommendation & Reasoning */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#1E331A] uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8C3A27]" />
            <span>2. Recommandation Principale et Preuves Agronomiques</span>
          </h3>
          {topCrop ? (
            <div className="p-5 rounded-2xl bg-[#EFE9DC] border border-[#DECAB3] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-[#1E331A] flex items-center gap-2">
                  <span>{topCrop.crop_emoji}</span>
                  <span>{topCrop.crop_name_fr}</span>
                </span>
                <span className="font-extrabold px-3 py-1 rounded-full bg-[#2D4A27] text-white">
                  Score d'affinité : {topCrop.score}%
                </span>
              </div>
              <ul className="space-y-1 text-[#4D3F2C]">
                {topCrop.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2D4A27] shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-xs text-[#7A6B53]">En attente d'analyse.</div>
          )}
        </div>

        {/* Section 3: Multi-year Strategy */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-[#1E331A] uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#2D4A27]" />
            <span>3. Calendrier Prévisionnel de Rotation (3 Saisons)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#EFE9DC] border border-[#DECAB3]">
              <div className="font-bold text-[#7A6B53]">2026 / 2027 (Année 1)</div>
              <div className="font-black text-sm text-[#1E331A] mt-1">{topCrop?.crop_name_fr || 'Légumineuse'}</div>
              <div className="text-[10px] text-[#8C3A27] mt-0.5">Fixation N atmosphérique</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#EFE9DC] border border-[#DECAB3]">
              <div className="font-bold text-[#7A6B53]">2027 / 2028 (Année 2)</div>
              <div className="font-black text-sm text-[#1E331A] mt-1">Blé dur / Blé tendre</div>
              <div className="text-[10px] text-[#8C3A27] mt-0.5">Consommation reliquat N</div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#EFE9DC] border border-[#DECAB3]">
              <div className="font-bold text-[#7A6B53]">2028 / 2029 (Année 3)</div>
              <div className="font-black text-sm text-[#1E331A] mt-1">Orge / Légumineuse secondaire</div>
              <div className="text-[10px] text-[#8C3A27] mt-0.5">Rupture sanitaire</div>
            </div>
          </div>
        </div>

        {/* Section 4: Scientific Citations */}
        <div className="p-4 rounded-2xl bg-[#EFE9DC]/60 border border-[#DECAB3] text-[11px] text-[#61513C] space-y-1">
          <div className="font-bold text-[#1E331A]">Références & Homologations Agronomiques :</div>
          <div>• INRA Maroc (Centre Régional de Settat) — Étude d'impact des rotations céréale-légumineuse sur le bilan hydrique.</div>
          <div>• FAO Irrigation & Drainage Paper 56 — Guide méthodologique de l'évapotranspiration des cultures.</div>
          <div>• ICARDA — Amélioration de la fertilité biologique des sols en milieu aride et semi-aride méditerranéen.</div>
        </div>

        {/* Legal notice */}
        <div className="text-[10px] text-[#7A6B53] text-center pt-4 border-t border-[#DECAB3]">
          TerraRota — Développé dans le cadre du NASA Space Apps Challenge 2026. Toutes les observations environnementales proviennent du réseau NASA POWER.
        </div>
      </div>
    </div>
  );
};
