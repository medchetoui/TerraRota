import React from 'react';
import { 
  Layers, 
  Droplets, 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Compass,
  Sprout
} from 'lucide-react';

interface SoilPageProps {
  currentSoil: string;
  regionName: string;
  lang: 'ar' | 'fr' | 'en';
}

// Typage propre des sols pour éviter les erreurs de compilation avec "as any"
interface SoilData {
  id: string;
  name_fr: string;
  name_ar: string;
  name_en: string;
  regions_fr: string;
  regions_ar: string;
  regions_en: string;
  texture: string;
  water_retention_fr: string;
  water_retention_en: string;
  water_retention_ar: string;
  ph_range: string;
  organic_matter: string;
  depth_fr: string;
  depth_en: string;
  depth_ar: string;
  suitability_fr: string;
  suitability_en: string;
  suitability_ar: string;
  risks_fr: string;
  risks_en: string;
  risks_ar: string;
}

const MOROCCAN_SOILS: SoilData[] = [
  {
    id: 'tirs',
    name_fr: 'Tirs (Vertisols Argileux Noirs)',
    name_ar: 'أراضي التيرس (التربة الطينية الثقيلة)',
    name_en: 'Tirs (Deep Vertic Clay Soils)',
    regions_fr: 'Chaouia, Saïss (Fès-Meknès), Gharb',
    regions_ar: 'الشاوية، سايس (فاس-مكناس)، الغرب',
    regions_en: 'Chaouia, Saïss (Fes-Meknes), Gharb',
    texture: 'Argile lourde (>45% argile), gonflante',
    water_retention_fr: 'Très élevée (> 180 mm/m)',
    water_retention_en: 'Very High (> 180 mm/m)',
    water_retention_ar: 'مرتفعة جداً (> 180 مم/م)',
    ph_range: '7.5 – 8.4',
    organic_matter: '1.8 – 2.8 %',
    depth_fr: '> 90 cm (très profond)',
    depth_en: '> 90 cm (very deep)',
    depth_ar: 'أكثر من 90 سم (عميق جداً)',
    suitability_fr: 'Idéal pour Blé dur, Féverole, Pois chiche.',
    suitability_en: 'Ideal for Durum Wheat, Faba Bean, Chickpea.',
    suitability_ar: 'مثالي للقمح الصلب، الفول، والحمص.',
    risks_fr: 'Fissuration estivale en sécheresse; asphyxie racinaire en cas d\'excès d\'eau hivernal.',
    risks_en: 'Summer soil cracking under drought; root waterlogging risks during heavy winter rains.',
    risks_ar: 'تشقق صيفي في حالة الجفاف؛ اختناق الجذور في حالة الإفراط في مياه الشتاء.',
  },
  {
    id: 'hamri',
    name_fr: 'Hamri (Sols Rouges Fersiallitiques)',
    name_ar: 'أراضي الحمري (التربة الحمراء المتوسطة)',
    name_en: 'Hamri (Red Mediterranean Soils)',
    regions_fr: 'Tadla, Haouz (Marrakech), Souss',
    regions_ar: 'تادلة، الحوز (مراكش)، سوس',
    regions_en: 'Tadla, Haouz (Marrakech), Souss',
    texture: 'Argilo-limoneuse à limono-sableuse',
    water_retention_fr: 'Moyenne (120 – 150 mm/m)',
    water_retention_en: 'Moderate (120 – 150 mm/m)',
    water_retention_ar: 'متوسطة (120 – 150 مم/م)',
    ph_range: '7.0 – 8.0',
    organic_matter: '1.2 – 1.8 %',
    depth_fr: '50 – 80 cm',
    depth_en: '50 – 80 cm (medium)',
    depth_ar: '50 – 80 سم (متوسط)',
    suitability_fr: 'Excellente pour Olivier, Amandier, Orge, Maraîchage sous goutte-à-goutte.',
    suitability_en: 'Excellent for Olive Tree, Almond Tree, Barley, Drip-irrigated market crops.',
    suitability_ar: 'ممتاز للزيتون، اللوز، الشعير، والزراعات البورية.',
    risks_fr: 'Sensible à la battance et à l\'encroûtement de surface après fortes pluies.',
    risks_en: 'Prone to surface crusting and compaction after intense rain events.',
    risks_ar: 'حساسية لتصلب السطح وتشكل القشرة بعد الأمطار الغزيرة.',
  },
  {
    id: 'rmel',
    name_fr: 'Rmel (Sols Sableux et Alluviaux)',
    name_ar: 'أراضي الرمل والغرين (التربة الرملية الخفيفة)',
    name_en: 'Rmel (Arenosols & Sandy Alluvials)',
    regions_fr: 'Bassin du Loukkos, Côtier Gharb, Chtouka Aït Baha',
    regions_ar: 'حوض اللوكوس، ساحل الغرب، شتوكة آيت باها',
    regions_en: 'Loukkos Basin, Coastal Gharb, Chtouka Ait Baha',
    texture: 'Sableuse à sablo-limoneuse',
    water_retention_fr: 'Faible (60 – 90 mm/m)',
    water_retention_en: 'Low (60 – 90 mm/m)',
    water_retention_ar: 'ضعيفة (60 – 90 مم/م)',
    ph_range: '6.2 – 7.5',
    organic_matter: '0.6 – 1.1 %',
    depth_fr: 'Variable (drainage rapide)',
    depth_en: 'Variable (rapid drainage)',
    depth_ar: 'متغير (تصريف سريع)',
    suitability_fr: 'Primeurs, Pomme de terre, Tomates sous serre avec fertigation pilotée.',
    suitability_en: 'Early season crops, Potatoes, Greenhouse Tomatoes with controlled fertigation.',
    suitability_ar: 'البواكر، البطاطس، والطماطم تحت البيوت البلاستيكية.',
    risks_fr: 'Lessivage rapide des nitrates; nécessite des irrigations fractionnées fréquentes.',
    risks_en: 'Rapid nitrate leaching; requires frequent, small-dose irrigation cycles.',
    risks_ar: 'غسل سريع للنترات؛ يتطلب رياً مقسماً ومتكرراً.',
  },
  {
    id: 'dahra',
    name_fr: 'Dahra & Calcisols (Sols Squelettiques Calcaires)',
    name_ar: 'أراضي الظهرة والكلسية (المناطق الجافة)',
    name_en: 'Dahra (Calcisols & Shallow Soils)',
    regions_fr: 'Oriental, Plateaux semi-arides, Haouz oriental',
    regions_ar: 'الشرق، الهضاب شبه الجافة، الحوز الشرقي',
    regions_en: 'Oriental, Semi-arid Plateaus, Eastern Haouz',
    texture: 'Limoneuse caillouteuse sur encroûtement calcaire',
    water_retention_fr: 'Très faible (< 70 mm/m)',
    water_retention_en: 'Very Low (< 70 mm/m)',
    water_retention_ar: 'ضعيفة جداً (< 70 مم/م)',
    ph_range: '8.0 – 8.6',
    organic_matter: '< 1.0 %',
    depth_fr: '20 – 40 cm (faible)',
    depth_en: '20 – 40 cm (shallow)',
    depth_ar: '20 – 40 سم (ضحل)',
    suitability_fr: 'Orge, Figuier de Barbarie (Cactus), Arganier, parcours pastoraux.',
    suitability_en: 'Barley, Cactus Pear, Argan Tree, pastoral grazing rangelands.',
    suitability_ar: 'الشعير، الصبار (الهندية)، الأركان، والمراعي.',
    risks_fr: 'Forte sensibilité à la sécheresse; réserve utile très réduite.',
    risks_en: 'Extreme drought sensitivity; very limited available soil water storage.',
    risks_ar: 'حساسية شديدة للجفاف؛ احتياطي مائي ضعيف جداً.',
  },
];

export const SoilPage: React.FC<SoilPageProps> = ({ currentSoil, regionName, lang }) => {
  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3] shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE9DC] text-xs font-bold text-[#8C3A27]">
          <Layers className="w-4 h-4" />
          <span>{isAr ? 'مرصد التربة والخصوبة المغربية' : isEn ? 'Moroccan Soil Intelligence' : 'Observatoire Pédologique du Maroc'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1E331A]">
          {isAr ? `خصائص التربة والقدرة الحقلية : ${regionName}` : isEn ? `Agricultural Soil Typology: ${regionName}` : `Typologie des Sols Agricoles : ${regionName}`}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A6B53] max-w-3xl leading-relaxed">
          {isAr
            ? 'تجمع تيراروتا بين التصنيف التراثي المغربي للتربة (تيرس، حمري، رمل، ظهرة) والخرائط الرقمية العالمية لـ SoilGrids لتقدير قدرة التربة على حفظ الماء وتبادل العناصر المغذية.'
            : isEn
            ? 'TerraRota combines Morocco\'s traditional pedological classifications (Tirs, Hamri, Rmel, Dahra) with global SoilGrids 250m digital maps to estimate water retention capacity and chemical fertility.'
            : 'TerraRota intègre les classes pédologiques marocaines homologuées (Tirs, Hamri, Rmel, Dahra) et les profils numériques SoilGrids (ISRIC / FAO) pour évaluer la capacité de rétention hydrique et la fertilité chimique.'}
        </p>

        {/* Scientific SoilGrids note */}
        <div className="p-3.5 rounded-2xl bg-[#EFE9DC] border border-[#DECAB3] text-xs text-[#524430] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#8C3A27] shrink-0" />
          <span>
            {isAr
              ? 'المصدر المرجعي: خريطة التربة بالمغرب (INRA / وزارة الفلاحة) و SoilGrids 250m ISRIC. تعكس البيانات الرقمية تقديراً إقليمياً ولا تعوض التحليل المخبري الدقيق.'
              : isEn
              ? 'Reference Source: Soil Map of Morocco (INRA / Ministry of Agriculture) & SoilGrids 250m ISRIC. Digital layers provide regional agroclimatological estimates and do not replace a laboratory chemical test.'
              : 'Source de référence : Carte des Sols du Maroc (INRA / Ministère de l\'Agriculture) & SoilGrids 250m ISRIC. Les données numériques reflètent une estimation régionale et ne remplacent pas une analyse chimique de laboratoire.'}
          </span>
        </div>
      </div>

      {/* Moroccan Soils 4-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOROCCAN_SOILS.map((soil) => (
          <div 
            key={soil.id}
            className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3] shadow-xs space-y-4"
          >
            <div>
              <span className="text-xs font-extrabold px-3 py-1 bg-[#8C3A27] text-white rounded-full">
                {isAr ? soil.regions_ar : isEn ? soil.regions_en : soil.regions_fr}
              </span>
              <h3 className="text-xl font-black text-[#1E331A] mt-2">
                {isAr ? soil.name_ar : isEn ? soil.name_en : soil.name_fr}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#EFE9DC]">
                <span className="text-[#7A6B53] font-bold block">{isAr ? 'القدرة على حفظ الماء:' : isEn ? 'Water Retention:' : 'Capacité Rétention :'}</span>
                <span className="font-extrabold text-[#1E331A]">
                  {isAr ? soil.water_retention_ar : isEn ? soil.water_retention_en : soil.water_retention_fr}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#EFE9DC]">
                <span className="text-[#7A6B53] font-bold block">{isAr ? 'الحموضة (pH):' : isEn ? 'Average pH:' : 'pH Moyen :'}</span>
                <span className="font-extrabold text-[#1E331A]">{soil.ph_range}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#EFE9DC]">
                <span className="text-[#7A6B53] font-bold block">{isAr ? 'المادة العضوية:' : isEn ? 'Organic Matter:' : 'Matière Organique :'}</span>
                <span className="font-extrabold text-[#1E331A]">{soil.organic_matter}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#EFE9DC]">
                <span className="text-[#7A6B53] font-bold block">{isAr ? 'العمق الصالح للجذور:' : isEn ? 'Root Depth:' : 'Profondeur Utile :'}</span>
                <span className="font-extrabold text-[#1E331A]">
                  {isAr ? soil.depth_ar : isEn ? soil.depth_en : soil.depth_fr}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2 text-[#2D4A27]">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>{isAr ? 'الملاءمة:' : isEn ? 'Suitability:' : 'Aptitude :'}</strong>{' '}
                  {isAr ? soil.suitability_ar : isEn ? soil.suitability_en : soil.suitability_fr}
                </span>
              </div>
              <div className="flex items-start gap-2 text-[#8C3A27]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>{isAr ? 'الإكراهات والمخاطر:' : isEn ? 'Constraint:' : 'Contrainte :'}</strong>{' '}
                  {isAr ? soil.risks_ar : isEn ? soil.risks_en : soil.risks_fr}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sustainable Rotation & Soil Carbon Impact */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#2D4A27] text-white space-y-4 shadow-md">
        <h3 className="text-xl font-black">
          {isAr ? 'الأثر التراكمي للدورة الزراعية على كربون وخصوبة التربة' : isEn ? 'Agronomic Impact of Rotation on Soil Carbon' : 'Impact Agronomique de la Rotation sur le Carbone du Sol'}
        </h3>
        <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-3xl">
          {isAr 
            ? 'وفقاً لأبحاث المعهد الوطني للبحث الزراعي (INRA سطات) ومنظمة ICARDA في حوض البحر الأبيض المتوسط، فإن الإدماج المنتظم للبقوليات الغذائية (الحمص، الفول، العدس) كل سنتين إلى ثلاث سنوات في دورة زراعية مع الحبوب يساعد على إعادة هيكلة مسامية التربة، وزيادة الكربون العضوي ومقاومة التدهور السريع الناتج عن الحرارة المرتفعة.'
            : isEn
            ? 'According to research by INRA Settat and ICARDA in the Mediterranean basin, systematically integrating a food pulse crop (chickpea, faba bean, lentil) every 2 to 3 years into a cereal rotation restructures the soil, increases root porosity, and stabilizes soil organic matter against rapid mineralization induced by elevated temperatures.'
            : 'Selon les recherches de l\'INRA Settat et de l\'ICARDA dans le bassin méditerranéen, l\'intégration systématique d\'une légumineuse alimentaire (pois chiche, fève, lentille) tous les 2 à 3 ans dans une rotation céréalière permet de restructurer le sol, d\'augmenter la porosité racinaire et de stabiliser le taux de matière organique face à la minéralisation rapide induite par les températures élevées.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-white/10 text-xs">
            <div className="font-bold text-emerald-300">{isAr ? 'الأزوت الحيوي' : isEn ? 'Biological Nitrogen' : 'Azote Biologique'}</div>
            <div>{isAr ? 'تثبيت 40 إلى 100 كغ أزوت صافي/هكتار طبيعياً بدون انبعاثات كربونية.' : isEn ? '40 to 100 kg pure N/ha fixed naturally with zero greenhouse gas emissions.' : '40 à 100 kg N pur/ha fixés sans émission de gaz à effet de serre.'}</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 text-xs">
            <div className="font-bold text-emerald-300">{isAr ? 'كسر الأمراض الفطرية' : isEn ? 'Pathogen Interruption' : 'Rupture Sanitaire'}</div>
            <div>{isAr ? 'القضاء الطبيعي على ديدان النيماتودا وفطريات تعفن جذور القمح.' : isEn ? 'Natural interruption of nematodes and fungal root rot cycles of cereals.' : 'Élimination naturelle des nématodes et champignons du blé.'}</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/10 text-xs">
            <div className="font-bold text-emerald-300">{isAr ? 'اقتصاد الطاقة والوقود' : isEn ? 'Fuel & Energy Savings' : 'Économie d\'Énergie'}</div>
            <div>{isAr ? 'تخفيض 30% من استهلاك المحروقات لحراثة وتجهيز الأرض.' : isEn ? '30% reduction in tractor fuel requirements for subsequent soil tillage.' : 'Réduction de 30% des besoins en carburant pour le travail du sol.'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};