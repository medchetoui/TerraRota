import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Search, 
  Filter, 
  Droplets, 
  Sun, 
  Layers, 
  ShieldCheck, 
  Info,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { getCropsDetail } from '../api/client';
import type { CropDetail } from '../types/api';

interface CropLibraryPageProps {
  lang: 'ar' | 'fr' | 'en';
}

export const CropLibraryPage: React.FC<CropLibraryPageProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  const [crops, setCrops] = useState<CropDetail[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCrop, setSelectedCrop] = useState<CropDetail | null>(null);

  useEffect(() => {
    async function loadCrops() {
      try {
        const res = await getCropsDetail();
        if (res?.crops) {
          setCrops(res.crops);
        }
      } catch (err) {
        console.error('Error fetching crops detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCrops();
  }, []);

  const filteredCrops = crops.filter((crop) => {
    const matchesCat = selectedCategory === 'all' || crop.category === selectedCategory;
    const nameMatch = 
      crop.name_fr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.name_ar?.includes(searchQuery) ||
      crop.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.scientific_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && nameMatch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3] shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE9DC] text-xs font-bold text-[#2D4A27]">
          <Sprout className="w-4 h-4" />
          <span>{isAr ? 'موسوعة المحاصيل الزراعية بالمغرب' : isEn ? 'Moroccan Crop Knowledge Base' : 'Bibliothèque des Cultures du Maroc'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1E331A]">
          {isAr ? 'دليل المحاصيل والقواعد الزراعية العلمية' : isEn ? 'Crop Agronomic Factsheets' : 'Fiches Agronomiques des Cultures'}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A6B53] max-w-3xl leading-relaxed">
          {isAr 
            ? 'قاعدة بيانات مهيكلة تشمل الاحتياجات المائية، الحصص الحرارية، التثبيت الحيوي للأزوت، ومصادر البحث العلمي المعتمدة من المعهد الوطني للبحث الزراعي (INRA Maroc) ومنظمة الأغذية والزراعة (FAO).'
            : isEn
            ? 'Comprehensive Moroccan agronomic catalog compiling crop water requirements, optimal temperature ranges, biological nitrogen fixation, and official INRA/FAO scientific citations.'
            : 'Référentiel agronomique complet compilant les besoins en eau, seuils thermiques, fixation symbiotique de l\'azote et références scientifiques officielles.'}
        </p>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7A6B53] absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder={isAr ? 'ابحث عن محصول أو اسم علمي...' : isEn ? 'Search crop by common or scientific name...' : 'Rechercher une culture (nom commun ou scientifique)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#EFE9DC] border border-[#DECAB3] text-xs font-bold text-[#3B3020] outline-none"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: isAr ? 'الكل' : isEn ? 'All' : 'Tous' },
              { id: 'cereal', label: isAr ? 'حبوب 🌾' : isEn ? 'Cereals 🌾' : 'Céréales 🌾' },
              { id: 'legume', label: isAr ? 'قطاني 🫘' : isEn ? 'Pulses 🫘' : 'Légumineuses 🫘' },
              { id: 'tree_crop', label: isAr ? 'أشجار 🫒' : isEn ? 'Tree Crops 🫒' : 'Arboriculture 🫒' },
              { id: 'vegetable', label: isAr ? 'خضروات 🍅' : isEn ? 'Vegetables 🍅' : 'Maraîchage 🍅' },
              { id: 'cactus', label: isAr ? 'صبار 🌵' : isEn ? 'Cactus 🌵' : 'Cactus 🌵' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer border ${
                  selectedCategory === cat.id 
                    ? 'bg-[#2D4A27] text-white border-[#2D4A27]' 
                    : 'bg-[#EFE9DC] text-[#61513C] border-[#DECAB3] hover:bg-[#E5DDCF]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Crops */}
      {loading ? (
        <div className="p-12 text-center text-sm font-bold text-[#7A6B53]">{isAr ? 'جاري تحميل الدليل الزراعي...' : isEn ? 'Loading crop library...' : 'Chargement de la bibliothèque...'}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCrops.map((crop) => (
            <div 
              key={crop.id}
              onClick={() => setSelectedCrop(crop)}
              className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3] hover:border-[#2D4A27] shadow-xs hover:shadow-md transition-all cursor-pointer space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl">{crop.emoji}</span>
                  <h3 className="text-lg font-black text-[#1E331A] mt-1">
                    {isAr ? crop.name_ar : isEn ? (crop.name_en || crop.name_fr) : crop.name_fr}
                  </h3>
                  <div className="text-xs italic text-[#7A6B53] font-serif">
                    {crop.scientific_name || crop.name_en}
                  </div>
                </div>
                {crop.nitrogen_fixation && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full border border-emerald-300">
                    {isAr ? 'مثبت للأزوت' : isEn ? 'N-Fixing' : 'Fixateur N'}
                  </span>
                )}
              </div>

              {/* Agronomic specs chips */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#4D3F2C]">
                <div className="p-2 rounded-xl bg-[#EFE9DC]">
                  <div className="text-[#7A6B53] font-bold">{isAr ? 'الماء المطلوب' : isEn ? 'Water Required' : 'Eau Requise'}</div>
                  <div className="font-extrabold text-[#1E331A]">
                    {crop.water_req_mm ? `${crop.water_req_mm[0]} - ${crop.water_req_mm[1]} mm` : 'Variable'}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#EFE9DC]">
                  <div className="text-[#7A6B53] font-bold">{isAr ? 'الحرارة المثالية' : isEn ? 'Optimal Temp' : 'Temp. Optimale'}</div>
                  <div className="font-extrabold text-[#1E331A]">
                    {crop.temp_opt_c ? `${crop.temp_opt_c[0]} - ${crop.temp_opt_c[1]} °C` : 'Tempérée'}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#EFE9DC]">
                  <div className="text-[#7A6B53] font-bold">{isAr ? 'موسم الزرع' : isEn ? 'Sowing Season' : 'Période Semis'}</div>
                  <div className="font-extrabold text-[#1E331A] truncate">
                    {crop.sowing_season || 'Automne'}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#EFE9DC]">
                  <div className="text-[#7A6B53] font-bold">{isAr ? 'عمق الجذور' : isEn ? 'Root Depth' : 'Profondeur Racines'}</div>
                  <div className="font-extrabold text-[#1E331A]">
                    {crop.root_depth_cm ? `${crop.root_depth_cm} cm` : 'Moyenne'}
                  </div>
                </div>
              </div>

              {/* Source citation */}
              <div className="text-[10px] text-[#7A6B53] border-t border-[#DECAB3]/70 pt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D4A27] shrink-0" />
                <span className="truncate">{crop.source || 'INRA Maroc / FAO ECOCROP'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Crop Detail Modal */}
      {selectedCrop && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl max-w-lg w-full border border-[#DECAB3] shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-3xl">{selectedCrop.emoji}</span>
                <h3 className="text-2xl font-black text-[#1E331A] mt-1">
                  {isAr ? selectedCrop.name_ar : selectedCrop.name_fr} ({selectedCrop.name_en})
                </h3>
                <p className="text-xs italic text-[#7A6B53] font-serif">
                  {selectedCrop.scientific_name} • Famille: {selectedCrop.family}
                </p>
              </div>
              <button 
                onClick={() => setSelectedCrop(null)}
                className="w-8 h-8 rounded-full bg-[#EFE9DC] flex items-center justify-center font-bold text-[#61513C] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#4D3F2C]">
              <div className="p-3 rounded-2xl bg-[#EFE9DC] space-y-1">
                <div className="font-bold text-[#1E331A]">Rôle Agronomique dans la Rotation</div>
                <p className="text-[#61513C]">
                  {selectedCrop.nitrogen_fixation 
                    ? 'Fixe biologiquement entre 40 et 100 kg d\'azote minéralisable par hectare grâce aux nodosités racinaires Rhizobium. Excellent précédent pour céréales.'
                    : selectedCrop.soil_effect === 'depleting'
                    ? 'Culture exigeante qui prélève des quantités substantielles d\'azote et d\'éléments minéraux. Nécessite une alternance avec une légumineuse.'
                    : 'Culture pérenne ou rustique participant à la stabilisation des sols et à la lutte contre l\'érosion éolienne et hydrique.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[#EFE9DC]">
                  <span className="font-bold block text-[#7A6B53]">Besoins en eau :</span>
                  <span className="font-extrabold text-sm">{selectedCrop.water_req_mm ? `${selectedCrop.water_req_mm[0]}-${selectedCrop.water_req_mm[1]} mm` : 'Non renseigné'}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#EFE9DC]">
                  <span className="font-bold block text-[#7A6B53]">Récolte :</span>
                  <span className="font-extrabold text-sm">{selectedCrop.harvest_season || 'Printemps / Été'}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#EFE9DC]/70 border border-[#DECAB3] text-[11px] text-[#61513C]">
                <strong>Référence Scientifique :</strong> {selectedCrop.source}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCrop(null)}
                className="px-5 py-2.5 rounded-xl bg-[#2D4A27] text-white text-xs font-bold cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
