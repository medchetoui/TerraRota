// i18n — French, Arabic, English
// Source unique pour toutes les pages (FarmsPage, recommandations, rotation...).
// Les clés manquantes dans ar/en provoquent une erreur TypeScript (type Dict).

export type Lang = 'fr' | 'ar' | 'en';

const fr = {
  // App
  appName: 'TerraRota',
  tagline: 'Recommandations de cultures basées sur les données NASA',
  subtitle: 'Des données climatiques réelles pour des décisions agricoles éclairées',
  startBtn: 'Commencer',

  // Steps
  step1: 'Localisation',
  step2: 'Informations',
  step3: 'Vérification',
  step4: 'Résultats',

  // Form
  latitude: 'Latitude',
  longitude: 'Longitude',
  latitudeHelp: 'Ex: 31.52 (Marrakech)',
  longitudeHelp: 'Ex: -8.75 (Marrakech)',
  previousCrop: 'Culture précédente',
  waterAccess: "Accès à l'eau",
  soilType: 'Type de sol',
  fieldSize: 'Superficie (ha)',
  preferredCrops: 'Cultures préférées (optionnel)',
  notes: 'Notes (optionnel)',
  nextBtn: 'Suivant',
  backBtn: 'Retour',
  submitBtn: 'Obtenir les recommandations',
  reviseBtn: 'Modifier les données',

  // Water access options
  rainfed: 'Pluvial (Bour)',
  irrigated: 'Irrigué',
  partial: 'Partiellement irrigué (appoint)',

  // Soil types
  clay: 'Argileux',
  clay_loam: 'Argilo-limoneux (Tirs)',
  loam: 'Limoneux',
  sandy_loam: 'Sablo-limoneux (Hamri)',
  sandy: 'Sableux',
  unknown: 'Inconnu',

  // Crop names
  wheat_hard: 'Blé dur',
  wheat_soft: 'Blé tendre',
  barley: 'Orge',
  olive: 'Olivier',
  argan: 'Argan',
  tomato: 'Tomate',
  chickpea: 'Pois chiche',
  cactus_pear: 'Figuier de Barbarie',
  potato: 'Pomme de terre',
  almond: 'Amandier',
  lentil: 'Lentille',
  faba_bean: 'Fève',
  onion: 'Oignon',
  orange: 'Oranger',
  clementine: 'Clémentinier',
  capers: 'Câprier',
  fallow: 'Jachère',
  none: 'Aucune / Jachère',

  // Results
  recommendations: 'Recommandations',
  indicators: 'Indicateurs climatiques',
  annualRain: 'Précipitations annuelles',
  meanTemp: 'Température moyenne',
  gdd: 'Degrés-jours (GDD base 10)',
  frostDays: 'Jours de gel / an',
  aridityIndex: "Indice d'aridité (AI)",
  dryMonths: 'Mois secs / an',
  score: "Score d'adéquation",
  reasons: 'Facteurs favorables',
  cautions: 'Points de vigilance',
  rulesApplied: 'Règles appliquées',
  provisional: 'Notice agronomique',
  provisionalNote: "Modèle décisionnel en phase d'évaluation. À valider par un agronome local.",
  insufficientData: 'Données insuffisantes',
  noRecommendations: 'Aucune recommandation disponible pour ce lieu avec ces contraintes.',
  sampleDataWarning: "Mode hors-ligne : Données NASA de substitution. À titre d'illustration.",
  dataSource: 'Source satellitaire',
  period: 'Période analysée',
  resolution: 'Résolution spatiale',
  loading: 'Récupération des données NASA...',
  loadingDetail: 'Connexion à NASA POWER, calcul des indicateurs agro-climatiques...',
  errorTitle: 'Erreur de traitement',
  errorRetry: 'Réessayer',
  missingData: 'Données manquantes',
  rank: 'Rang',
  ineligible: 'Non éligible',
  ineligibleReason: 'Motif de rejet',
  reviewTitle: 'Vérifiez vos paramètres de parcelle',
  reviewCoords: 'Coordonnées géographiques',
  reviewConstraints: 'Contraintes pédoclimatiques',
  nasaLive: 'Données NASA en direct',
  nasaCached: 'Données NASA en cache local',
  nasaSample: 'Données de simulation',

  // Auth & Saved Parcels
  login: 'Connexion',
  register: 'Créer un compte',
  logout: 'Déconnexion',
  username: "Nom d'utilisateur",
  password: 'Mot de passe',
  email: 'Adresse email',
  saveParcel: 'Enregistrer cette parcelle',
  myParcels: 'Mes parcelles enregistrées',
  parcelName: 'Nom de la parcelle (ex: Ferme Haouz)',
  savedSuccess: 'Parcelle enregistrée avec succès !',
  noParcels: 'Aucune parcelle enregistrée pour le moment.',
  loadParcel: 'Charger cette parcelle',
  authRequired: 'Connectez-vous pour enregistrer vos parcelles.',

  // Validation
  requiredField: 'Ce champ est requis.',
  invalidLat: 'La latitude doit être entre -90 et 90.',
  invalidLon: 'La longitude doit être entre -180 et 180.',

  // About
  aboutTitle: 'À propos de TerraRota',
  aboutText:
    "TerraRota est une plateforme d'aide à la décision agricole conçue pour le contexte marocain. Elle exploite les données climatiques satellitaires de la NASA pour calculer des indicateurs scientifiques précis (GDD, indice d'aridité, risques de gel) et recommander des cultures résilientes.",
  disclaimer:
    "Avertissement : Les recommandations sont générées à titre d'aide à la décision technique. Consultez un conseiller agricole avant tout investissement.",

  // FarmsPage
  farms_badge: 'Mes Parcelles & Plans de Rotation',
  farms_title: 'Exploitations & Plans Enregistrés',
  farms_intro:
    "Consultez vos parcelles agricoles sauvegardées et retrouvez l'historique de vos plans de rotation approuvés.",
  farms_loading: 'Chargement de vos exploitations...',
  farms_loadError: 'Impossible de charger vos données. Vérifiez la connexion au serveur.',
  farms_savedParcels: 'Parcelles Enregistrées',
  farms_parcelCount: 'parcelle(s)',
  farms_noParcels:
    "Aucune parcelle sauvegardée pour l'instant. Enregistrez un résultat depuis la page principale.",
  farms_parcelPrefix: 'Parcelle',
  farms_irrigated: '💧 Irrigué',
  farms_rainfed: '🌧️ Pluvial',
  farms_analyze: 'Analyser',
  farms_delete: 'Supprimer',
  farms_confirmDelete: 'Voulez-vous vraiment supprimer cette parcelle ?',
  farms_plansTitle: 'Plans de Rotation Validés',
  farms_noPlans:
    'Aucun plan validé pour le moment. Rendez-vous dans le planificateur de rotation pour adopter une stratégie.',
  farms_approved: '✓ Approuvé',
  farms_rejected: '✕ Rejeté',
  farms_proposed: 'Proposé',
  farms_planApproved: 'Plan Approuvé',
  farms_planRejected: 'Plan Rejeté',
  farms_selectedCrop: 'Culture retenue',
  farms_reason: 'Motif',
};

type Dict = Record<keyof typeof fr, string>;

const ar: Dict = {
  appName: 'تيرا روتا',
  tagline: 'توصيات المحاصيل المعتمدة على بيانات ناسا',
  subtitle: 'بيانات مناخية حقيقية لقرارات زراعية مستنيرة وتكيف مع الجفاف',
  startBtn: 'ابدأ التحليل',

  step1: 'الموقع الجغرافي',
  step2: 'خصائص الضيعة',
  step3: 'المراجعة',
  step4: 'النتائج والتوصيات',

  latitude: 'خط العرض (Latitude)',
  longitude: 'خط الطول (Longitude)',
  latitudeHelp: 'مثال: 31.52 (مراكش)',
  longitudeHelp: 'مثال: -8.75 (مراكش)',
  previousCrop: 'المحصول السابق',
  waterAccess: 'الوصول إلى مياه الري',
  soilType: 'نوع التربة',
  fieldSize: 'المساحة (هكتار)',
  preferredCrops: 'محاصيل مفضلة (اختياري)',
  notes: 'ملاحظات إضافية',
  nextBtn: 'التالي',
  backBtn: 'رجوع',
  submitBtn: 'عرض التوصيات الزراعية',
  reviseBtn: 'تعديل المعطيات',

  rainfed: 'بور (مطري فقط)',
  irrigated: 'سقوي (ري دائم)',
  partial: 'ري تكميلي جزئي',

  clay: 'طيني',
  clay_loam: 'طيني طميي',
  loam: 'طميي',
  sandy_loam: 'رملي طميي',
  sandy: 'رملي',
  unknown: 'غير محدد',

  wheat_hard: 'القمح الصلب',
  wheat_soft: 'القمح اللين',
  barley: 'الشعير',
  olive: 'الزيتون',
  argan: 'الأركان',
  tomato: 'الطماطم',
  chickpea: 'الحمص',
  cactus_pear: 'الهندية (الصبار)',
  potato: 'البطاطا',
  almond: 'اللوز',
  lentil: 'العدس',
  faba_bean: 'الفول',
  onion: 'البصل',
  orange: 'البرتقال',
  clementine: 'الكليمنتين',
  capers: 'الكبار',
  fallow: 'أرض مستريحة',
  none: 'لا شيء / أرض مستريحة',

  recommendations: 'المحاصيل الموصى بها',
  indicators: 'المؤشرات المناخية للأقمار الاصطناعية',
  annualRain: 'المعدل السنوي للتساقطات',
  meanTemp: 'متوسط درجة الحرارة السنوية',
  gdd: 'مجموع درجات النمو (GDD)',
  frostDays: 'أيام الصقيع (الجريحة) في السنة',
  aridityIndex: 'مؤشر الجفاف (AI)',
  dryMonths: 'عدد الأشهر الجافة سنوياً',
  score: 'نسبة الملاءمة',
  reasons: 'عوامل التوافق والمميزات',
  cautions: 'نقاط اليقظة والتحذيرات',
  rulesApplied: 'القواعد العلمية المطبقة',
  provisional: 'تنبيه علمي',
  provisionalNote: 'القواعد الزراعية استرشادية، يُنصح باستشارة تقني فلاحي قبل الزرع.',
  insufficientData: 'بيانات غير كافية',
  noRecommendations: 'لا توجد محاصيل مناسبة لهذه الشروط المناخية بدقة كافية.',
  sampleDataWarning: 'وضع عدم الاتصال: يتم عرض بيانات تقريبية.',
  dataSource: 'المصدر الفضائي',
  period: 'الفترة الزمنية',
  resolution: 'دقة القمر الاصطناعي',
  loading: 'جارٍ استرجاع بيانات ناسا...',
  loadingDetail: 'الاتصال المباشر مع NASA POWER وحساب المؤشرات المناخية...',
  errorTitle: 'خطأ في معالجة الطلب',
  errorRetry: 'إعادة المحاولة',
  missingData: 'بيانات ناقصة',
  rank: 'الرتبة',
  ineligible: 'غير مؤهل زراعياً',
  ineligibleReason: 'سبب الاستبعاد',
  reviewTitle: 'مراجعة معطيات الضيعة',
  reviewCoords: 'الإحداثيات الجغرافية',
  reviewConstraints: 'الشروط الفلاحية',
  nasaLive: 'بيانات ناسا الحية',
  nasaCached: 'بيانات ناسا المحفوظة',
  nasaSample: 'بيانات محاكاة تجريبية',

  login: 'تسجيل الدخول',
  register: 'إنشاء حساب جديد',
  logout: 'تسجيل الخروج',
  username: 'اسم المستخدم',
  password: 'كلمة المرور',
  email: 'البريد الإلكتروني',
  saveParcel: 'حفظ هذه الضيعة في حسابي',
  myParcels: 'ضيعاتي المسجلة',
  parcelName: 'اسم الضيعة (مثال: ضيعة الحوز)',
  savedSuccess: 'تم تسجيل الضيعة بنجاح !',
  noParcels: 'لم تقم بحفظ أي ضيعة بعد.',
  loadParcel: 'تحميل بيانات هذه الضيعة',
  authRequired: 'قم بتسجيل الدخول لتتمكن من حفظ ضيعاتك.',

  requiredField: 'هذا الحقل ضروري.',
  invalidLat: 'خط العرض يجب أن يكون بين -90 و 90.',
  invalidLon: 'خط الطول يجب أن يكون بين -180 و 180.',

  aboutTitle: 'حول مشروع تيرا روتا',
  aboutText:
    'تيرا روتا هو نظام رقمي علمي لمساعدة الفلاحين المغاربة على اختيار المحاصيل الأكثر صموداً أمام الجفاف وتغير المناخ بالاعتماد على رصد الأقمار الاصطناعية لناسا.',
  disclaimer: 'تنبيه: التوصيات المقدمة هي للمساعدة في اتخاذ القرار وتستوجب مراجعة خبير فلاحي محلي.',

  // FarmsPage
  farms_badge: 'إدارة الأراضي والمخططات الفلاحية',
  farms_title: 'الضيعات والمخططات المحفوظة',
  farms_intro: 'تتبع أراضيك الفلاحية، واسترجع التوصيات السابقة والمخططات المعتمدة لكل موسم زراعي.',
  farms_loading: 'جاري تحميل ضيعاتك...',
  farms_loadError: 'تعذر تحميل بياناتك. تحقق من الاتصال بالخادم.',
  farms_savedParcels: 'الأراضي الفلاحية المحفوظة',
  farms_parcelCount: 'أرض',
  farms_noParcels: 'لا توجد أراضٍ محفوظة بعد. قم بحفظ نتيجة التوصية من الصفحة الرئيسية.',
  farms_parcelPrefix: 'ضيعة',
  farms_irrigated: '💧 مسقي',
  farms_rainfed: '🌧️ بور',
  farms_analyze: 'تحليل',
  farms_delete: 'حذف',
  farms_confirmDelete: 'هل أنت متأكد من حذف هذه الضيعة؟',
  farms_plansTitle: 'مخططات التناوب المعتمدة',
  farms_noPlans: 'لم يتم اعتماد أي مخطط بعد. انتقل إلى مخطط التناوب لاعتماد استراتيجية.',
  farms_approved: '✓ معتمد',
  farms_rejected: '✕ مرفوض',
  farms_proposed: 'مقترح',
  farms_planApproved: 'مخطط معتمد',
  farms_planRejected: 'مخطط مرفوض',
  farms_selectedCrop: 'المحصول المعتمد',
  farms_reason: 'سبب الرفض',
};

const en: Dict = {
  appName: 'TerraRota',
  tagline: 'Crop recommendations powered by NASA Earth observations',
  subtitle: 'Real satellite climate data for evidence-based agricultural decisions and drought resilience',
  startBtn: 'Start Analysis',

  step1: 'Field Location',
  step2: 'Farm Details',
  step3: 'Verification',
  step4: 'Results',

  latitude: 'Latitude',
  longitude: 'Longitude',
  latitudeHelp: 'e.g. 31.52 (Marrakech)',
  longitudeHelp: 'e.g. -8.75 (Marrakech)',
  previousCrop: 'Previous Crop',
  waterAccess: 'Water Access',
  soilType: 'Soil Type',
  fieldSize: 'Field Size (ha)',
  preferredCrops: 'Preferred Crops (optional)',
  notes: 'Additional Notes',
  nextBtn: 'Next',
  backBtn: 'Back',
  submitBtn: 'Get Crop Recommendations',
  reviseBtn: 'Modify Input Data',

  rainfed: 'Rainfed (No irrigation)',
  irrigated: 'Irrigated (Drip / Well)',
  partial: 'Partially Irrigated (Supplemental)',

  clay: 'Clay',
  clay_loam: 'Clay Loam (Tirs)',
  loam: 'Loam',
  sandy_loam: 'Sandy Loam (Hamri)',
  sandy: 'Sandy',
  unknown: 'Unknown / Not specified',

  wheat_hard: 'Durum Wheat',
  wheat_soft: 'Soft Wheat',
  barley: 'Barley',
  olive: 'Olive Tree',
  argan: 'Argan',
  tomato: 'Tomato',
  chickpea: 'Chickpea',
  cactus_pear: 'Cactus Pear',
  potato: 'Potato',
  almond: 'Almond',
  lentil: 'Lentil',
  faba_bean: 'Faba Bean',
  onion: 'Onion',
  orange: 'Orange',
  clementine: 'Clementine',
  capers: 'Capers',
  fallow: 'Fallow',
  none: 'None / Fallow land',

  recommendations: 'Crop Recommendations',
  indicators: 'Satellite Agro-Climatic Indicators',
  annualRain: 'Cumulative Annual Rainfall',
  meanTemp: 'Mean Annual Temperature',
  gdd: 'Growing Degree Days (GDD Base 10°C)',
  frostDays: 'Frost Days per Year',
  aridityIndex: 'UNEP Aridity Index (AI)',
  dryMonths: 'Dry Months per Year (<30mm)',
  score: 'Suitability Score',
  reasons: 'Favorable Factors',
  cautions: 'Vigilance & Risks',
  rulesApplied: 'Applied Scientific Rules',
  provisional: 'Agronomic Notice',
  provisionalNote: 'Provisional decision model based on NASA and INRA agroclimatology. Consult a local advisor.',
  insufficientData: 'Insufficient Data',
  noRecommendations: 'No suitable crops found for these environmental conditions.',
  sampleDataWarning: 'Offline mode: Demonstrative simulated NASA data.',
  dataSource: 'Satellite Data Source',
  period: 'Analyzed Time Window',
  resolution: 'Spatial Resolution',
  loading: 'Fetching NASA Earth observations...',
  loadingDetail: 'Direct connection to NASA POWER, computing agro-climatic indicators...',
  errorTitle: 'Processing Error',
  errorRetry: 'Retry',
  missingData: 'Missing Data',
  rank: 'Rank',
  ineligible: 'Agronomically Ineligible',
  ineligibleReason: 'Rejection Reason',
  reviewTitle: 'Verify Field Parameters',
  reviewCoords: 'Geographic Coordinates',
  reviewConstraints: 'Pedoclimatic Constraints',
  nasaLive: 'NASA Direct Live Data',
  nasaCached: 'NASA Cached Observations',
  nasaSample: 'Simulated NASA Data',

  login: 'Log In',
  register: 'Create Account',
  logout: 'Log Out',
  username: 'Username',
  password: 'Password',
  email: 'Email Address',
  saveParcel: 'Save this Field to My Account',
  myParcels: 'My Saved Fields',
  parcelName: 'Field Name (e.g. Haouz Farm)',
  savedSuccess: 'Field successfully saved!',
  noParcels: 'No saved fields yet.',
  loadParcel: 'Load Field Data',
  authRequired: 'Log in to save and track your fields.',

  requiredField: 'This field is required.',
  invalidLat: 'Latitude must be between -90 and 90.',
  invalidLon: 'Longitude must be between -180 and 180.',

  aboutTitle: 'About TerraRota',
  aboutText:
    'TerraRota is an agricultural decision-support platform designed for Moroccan farmers and agronomists, combining NASA Earth observations with INRA and FAO crop rotation rules for climate and drought resilience.',
  disclaimer: 'Disclaimer: Recommendations are provided as technical decision support. Consult an agronomist before investing.',

  // FarmsPage
  farms_badge: 'My Farms & Rotation Plans',
  farms_title: 'Saved Farms & Rotation Plans',
  farms_intro: 'Access your saved agricultural parcels and review the historical record of your approved crop-rotation plans.',
  farms_loading: 'Loading your farms...',
  farms_loadError: 'Could not load your data. Check the server connection.',
  farms_savedParcels: 'Saved Parcels',
  farms_parcelCount: 'parcel(s)',
  farms_noParcels: 'No parcels saved yet. Save a recommendation result from the main page.',
  farms_parcelPrefix: 'Field',
  farms_irrigated: '💧 Irrigated',
  farms_rainfed: '🌧️ Rainfed',
  farms_analyze: 'Analyze',
  farms_delete: 'Delete',
  farms_confirmDelete: 'Are you sure you want to delete this field?',
  farms_plansTitle: 'Validated Rotation Plans',
  farms_noPlans: 'No validated rotation plans yet. Go to the Rotation Planner to adopt a strategy.',
  farms_approved: '✓ Approved',
  farms_rejected: '✕ Rejected',
  farms_proposed: 'Proposed',
  farms_planApproved: 'Approved Plan',
  farms_planRejected: 'Rejected Plan',
  farms_selectedCrop: 'Selected Crop',
  farms_reason: 'Reason',
};

export const translations: Record<Lang, Dict> = { fr, ar, en };
export type TranslationKey = keyof Dict;

/** Raccourci : t('en', 'farms_title') */
export const t = (lang: Lang, key: TranslationKey): string => translations[lang][key];

// ─────────────────────────────────────────────────────────────
// Traduction du texte libre stocké en base (cultures, régions, plans, motifs)
// Principe : on normalise le texte, on retrouve un identifiant, puis on affiche
// le libellé dans la langue courante. Un seul endroit à maintenir.
// ─────────────────────────────────────────────────────────────

/** minuscules, sans accents latins, sans "ال" arabe en début de mot, espaces propres */
const norm = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/(^|\s)ال/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

function makeMatcher<K extends string>(aliases: Record<K, string[]>) {
  const prepared = (Object.keys(aliases) as K[]).map((id) => ({
    id,
    keys: [id, ...aliases[id]].map(norm),
  }));
  return (text: string | null | undefined): K | undefined => {
    if (!text) return undefined;
    const tx = norm(text);
    if (!tx) return undefined;
    return prepared.find((p) => p.keys.some((k) => tx.includes(k)))?.id;
  };
}

// ── Cultures (libellés pris dans le dictionnaire ci-dessus) ──
type CropKey =
  | 'wheat_hard' | 'wheat_soft' | 'barley' | 'olive' | 'argan' | 'tomato'
  | 'chickpea' | 'cactus_pear' | 'potato' | 'almond' | 'lentil' | 'faba_bean'
  | 'onion' | 'orange' | 'clementine' | 'capers' | 'fallow';

const findCrop = makeMatcher<CropKey>({
  wheat_hard: ['durum', 'ble dur', 'قمح صلب'],
  wheat_soft: ['soft wheat', 'ble tendre', 'قمح طري', 'قمح لين'],
  barley: ['orge', 'شعير'],
  olive: ['olivier', 'زيتون'],
  argan: ['أركان', 'اركان'],
  tomato: ['tomate', 'طماطم'],
  chickpea: ['pois chiche', 'حمص'],
  cactus_pear: ['cactus', 'figuier de barbarie', 'صبار', 'هندية'],
  potato: ['pomme de terre', 'بطاطا', 'بطاطس'],
  almond: ['amande', 'amandier', 'لوز'],
  lentil: ['lentille', 'عدس'],
  faba_bean: ['faba', 'feve', 'فول'],
  onion: ['oignon', 'بصل'],
  orange: ['oranger', 'برتقال'],
  clementine: ['clementinier', 'كليمنتين'],
  capers: ['caper', 'capre', 'كبار'],
  fallow: ['jachere', 'مستريحة', 'مريحة', 'بور'],
});

export const translateCrop = (text: string | null | undefined, lang: Lang): string => {
  const id = findCrop(text);
  return id ? translations[lang][id] : (text ?? '');
};

// ── Régions ──
type RegionKey = 'fes_meknes' | 'souss_massa' | 'marrakech' | 'chaouia_settat' | 'gharb_kenitra';

const REGION_NAMES: Record<RegionKey, Record<Lang, string>> = {
  fes_meknes: { fr: 'Fès - Meknès (Saïss)', en: 'Fes - Meknes (Saïss)', ar: 'فاس - مكناس (سايس)' },
  souss_massa: { fr: 'Souss - Massa', en: 'Souss - Massa', ar: 'سوس - ماسة' },
  marrakech: { fr: 'Marrakech - Tensift', en: 'Marrakech - Tensift', ar: 'مراكش - تانسيفت' },
  chaouia_settat: { fr: 'Chaouia - Settat', en: 'Chaouia - Settat', ar: 'الشاوية - سطات' },
  gharb_kenitra: { fr: 'Gharb - Kénitra', en: 'Gharb - Kenitra', ar: 'الغرب - القنيطرة' },
};

const findRegion = makeMatcher<RegionKey>({
  fes_meknes: ['fes', 'meknes', 'saiss', 'فاس', 'مكناس', 'سايس'],
  souss_massa: ['souss', 'massa', 'taroudant', 'سوس', 'ماسة', 'تارودانت'],
  marrakech: ['marrakech', 'tensift', 'haouz', 'مراكش', 'حوز'],
  chaouia_settat: ['chaouia', 'settat', 'شاوية', 'سطات'],
  gharb_kenitra: ['gharb', 'kenitra', 'غرب', 'قنيطرة'],
});

export const translateRegion = (text: string, lang: Lang): string => {
  const id = findRegion(text);
  return id ? REGION_NAMES[id][lang] : text;
};

/**
 * "Parcelle Fes – Meknes (Saïss) (Pois chiche)" → "Field (Fes - Meknes (Saïss)) - Chickpea"
 * Ne retire la dernière parenthèse que si c'est bien une culture connue
 * (sinon "(Saïss)" serait pris pour une culture).
 */
export const formatParcelName = (rawName: string, lang: Lang): string => {
  const prefix = translations[lang].farms_parcelPrefix;
  let rest = (rawName ?? '').trim();
  let cropText = '';

  const m = rest.match(/\(([^()]*)\)\s*$/);
  if (m && m.index !== undefined && findCrop(m[1])) {
    cropText = m[1].trim();
    rest = rest.slice(0, m.index).trim();
  }

  rest = rest
    .replace(/^(parcelle|field|ضيعة)\s*/i, '')
    .replace(/^\(\s*\)|\(\s*\)$/g, '')
    .trim();

  const regionText = rest ? translateRegion(rest, lang) : '';
  const cropName = cropText ? translateCrop(cropText, lang) : '';

  if (regionText && cropName) return `${prefix} (${regionText}) - ${cropName}`;
  if (regionText) return `${prefix} (${regionText})`;
  if (cropName) return `${prefix} - ${cropName}`;
  return prefix;
};

// ── Scénarios de rotation ──
type ScenarioKey = 'legume_rotation' | 'water_conservative' | 'high_value' | 'diversification';

const SCENARIO_TITLES: Record<ScenarioKey, Record<Lang, string>> = {
  legume_rotation: {
    fr: 'Régénération Biologique (Légumineuse - Céréale)',
    en: 'Biological Soil Regeneration (Legume - Cereal)',
    ar: 'دورة التجديد الحيوي (قطاني - حبوب)',
  },
  water_conservative: {
    fr: 'Sobriété Hydrique & Climat Aride',
    en: 'Water Conservation & Drought Resilience',
    ar: 'الاستراتيجية المائية المقاومة للجفاف',
  },
  high_value: {
    fr: 'Valorisation Économique & Marché',
    en: 'High Economic Market Value',
    ar: 'تعظيم المردودية الاقتصادية',
  },
  diversification: {
    fr: 'Diversification & Sécurité Agro-Écologique',
    en: 'Agrobiodiversity & Risk Mitigation',
    ar: 'التنوع الزراعي وتوزيع المخاطر',
  },
};

const findScenario = makeMatcher<ScenarioKey>({
  legume_rotation: ['regeneration biologique', 'biological soil regeneration', 'تجديد حيوي'],
  water_conservative: ['sobriete hydrique', 'water conservation', 'مائية مقاومة'],
  high_value: ['valorisation economique', 'high economic', 'مردودية اقتصادية'],
  diversification: ['agrobiodiversity', 'تنوع زراعي'],
});

const isRejectedTitle = (t: string) => /rejet|reject|مرفوض/i.test(t);
const isApprovedTitle = (t: string) => /approuv|approved|معتمد/i.test(t);

export const translatePlanTitle = (title: string, lang: Lang): string => {
  if (!title) return '';
  const scenario = findScenario(title);
  const scenarioTitle = scenario ? SCENARIO_TITLES[scenario][lang] : '';
  const statusLabel = isRejectedTitle(title)
    ? translations[lang].farms_planRejected
    : isApprovedTitle(title)
    ? translations[lang].farms_planApproved
    : '';

  if (scenarioTitle && statusLabel) return `${statusLabel} : ${scenarioTitle}`;
  return scenarioTitle || statusLabel || title;
};

// ── Motifs de refus ──
type RejectionKey = 'water_excess' | 'seed_unavailable' | 'cash_flow' | 'preference';

const REJECTION_TEXT: Record<RejectionKey, Record<Lang, string>> = {
  water_excess: {
    fr: 'Besoins en eau excessifs',
    en: 'Excessive water needs',
    ar: 'احتياجات مائية مفرطة',
  },
  seed_unavailable: {
    fr: 'Semences non disponibles sur le marché local',
    en: 'Seeds not available in the local market',
    ar: 'البذور غير متوفرة في السوق المحلية',
  },
  cash_flow: {
    fr: 'Contrainte de trésorerie / investissement initial',
    en: 'Cash flow constraint / initial investment',
    ar: 'قيود مالية / تكلفة الاستثمار الأولي',
  },
  preference: {
    fr: 'Préférence personnelle pour une autre culture',
    en: 'Personal preference for another crop',
    ar: 'تفضيل شخصي لمحصول آخر',
  },
};

// Pas de "eau" seul (il matcherait "nouveau", "bureau"...) : on utilise des expressions
const findRejection = makeMatcher<RejectionKey>({
  water_excess: ['besoins en eau', 'excessif', 'water', 'مائية', 'مفرطة'],
  seed_unavailable: ['semence', 'seed', 'بذور', 'marche local', 'local market'],
  cash_flow: ['tresorerie', 'cash', 'مالية', 'investissement', 'investment'],
  preference: ['preference', 'personal', 'personnelle', 'تفضيل'],
});

export const translateRejectionReason = (reason: string | null | undefined, lang: Lang): string => {
  if (!reason) return '';
  const id = findRejection(reason);
  return id ? REJECTION_TEXT[id][lang] : reason;
};