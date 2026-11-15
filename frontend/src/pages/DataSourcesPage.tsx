import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  AlertCircle, 
  Info,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { getDataSources } from '../api/client';
import type { DataSource } from '../types/api';

interface DataSourcesPageProps {
  lang: 'ar' | 'fr' | 'en';
}

export const DataSourcesPage: React.FC<DataSourcesPageProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const isEn = lang === 'en';

  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSources() {
      try {
        const res = await getDataSources();
        if (res?.data_sources) {
          setSources(res.data_sources);
        }
      } catch (err) {
        console.error('Error fetching data sources:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSources();
  }, []);

  const getStatusBadge = (status: DataSource['status']) => {
    switch (status) {
      case 'fully_integrated':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'مدمج ومفعل كلياً' : isEn ? 'Fully Operational' : 'Pleinement Intégré'}</span>
          </span>
        );
      case 'partially_integrated':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black border border-blue-300">
            <Info className="w-3.5 h-3.5" />
            <span>{isAr ? 'مدمج جزئياً' : isEn ? 'Partially Integrated' : 'Partiellement Intégré'}</span>
          </span>
        );
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? 'قيد الدراسة والربط' : isEn ? 'Investigating / Planned' : 'En Cours d\'Étude'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3] shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFE9DC] text-xs font-bold text-[#2D4A27]">
          <Database className="w-4 h-4" />
          <span>{isAr ? 'سجل مصادر البيانات الفضائية التابع لناسا' : isEn ? 'NASA Earth Observation Data Registry' : 'Registre des Données Satellitaires NASA'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1E331A]">
          {isAr ? 'مصادر البيانات والأقمار الاصطناعية المعتمدة' : isEn ? 'NASA Data Sources & Satellites' : 'Sources de Données & Satellites NASA'}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A6B53] max-w-3xl leading-relaxed">
          {isAr 
            ? 'توثيق رسمي لجميع مجموعات البيانات البيئية لوكالة الفضاء الأمريكية (NASA) والمؤسسات الشريكة (ISRIC / FAO) مع بيان دقتها المكانية والزمنية وحالتها التشغيلية في المنصة.'
            : isEn
            ? 'Official and transparent inventory of Earth observation data flows used or being integrated into TerraRota, along with their limitations and resolutions.'
            : 'Inventaire officiel et transparent des flux de données d\'observation de la Terre utilisés ou en cours d\'intégration dans TerraRota, avec leurs limites et résolutions.'}
        </p>
      </div>

      {/* Sources Cards */}
      {loading ? (
        <div className="p-12 text-center text-sm font-bold text-[#7A6B53]">
          {isAr ? 'جارٍ تحميل سجل ناسا...' : isEn ? 'Loading NASA registry...' : 'Chargement du registre NASA...'}
        </div>
      ) : (
        <div className="space-y-6">
          {sources.map((src) => (
            <div 
              key={src.id}
              className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F2] border border-[#DECAB3] shadow-xs space-y-5"
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-black text-[#1E331A]">{src.name}</h3>
                    <a 
                      href={src.official_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#8C3A27] hover:text-[#732F1F]"
                      title={isAr ? 'زيارة البوابة الرسمية لناسا' : isEn ? 'Visit official NASA portal' : 'Visiter le portail officiel NASA'}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-[#7A6B53] font-semibold mt-0.5">
                    {isAr ? 'المزود:' : isEn ? 'Provider:' : 'Fournisseur :'} {src.provider} • {isAr ? 'المنتج:' : isEn ? 'Product:' : 'Produit :'} <span className="font-mono text-[#1E331A]">{src.product_id}</span>
                  </p>
                </div>
                {getStatusBadge(src.status)}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#EFE9DC]">
                  <span className="text-[#7A6B53] font-bold block mb-1">
                    {isAr ? 'الدقة المكانية:' : isEn ? 'Spatial Resolution:' : 'Résolution Spatiale :'}
                  </span>
                  <span className="font-extrabold text-[#1E331A]" dir="ltr">
                    {src.spatial_resolution}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#EFE9DC]">
                  <span className="text-[#7A6B53] font-bold block mb-1">
                    {isAr ? 'الدقة الزمنية:' : isEn ? 'Temporal Resolution:' : 'Résolution Temporelle :'}
                  </span>
                  <span className="font-extrabold text-[#1E331A]">
                    {isAr ? src.temporal_resolution_ar : isEn ? src.temporal_resolution_en : src.temporal_resolution_fr}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#EFE9DC] sm:col-span-2">
                  <span className="text-[#7A6B53] font-bold block mb-1">
                    {isAr ? 'المتغيرات المستخرجة:' : isEn ? 'Extracted Variables:' : 'Variables extraites :'}
                  </span>
                  <span className="font-semibold text-[#1E331A]" dir="ltr">
                    {src.variables.map(v => `${v.code} (${v.unit})`).join(', ')}
                  </span>
                </div>
              </div>

              {/* Processing methods */}
              <div className="space-y-1.5 text-xs text-[#4D3F2C]">
                <div className="font-bold text-[#1E331A]">
                  {isAr ? 'المعالجات والخوارزميات المطبقة:' : isEn ? 'Processing & Algorithms Applied:' : 'Traitements & Algorithmes Appliqués :'}
                </div>
                <ul className={`list-disc space-y-0.5 text-[#61513C] ${isAr ? 'list-inside pr-4' : 'list-inside'}`}>
                  {(isAr ? src.processing_methods_ar : isEn ? src.processing_methods_en : src.processing_methods_fr).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>

              {/* Limitations note */}
              <div className="p-3.5 rounded-2xl bg-[#EFE9DC]/70 border border-[#DECAB3] text-xs text-[#61513C] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#1E331A]">
                    {isAr ? 'القيود المعروفة:' : isEn ? 'Known Limitations:' : 'Limites Connues :'}
                  </strong> {isAr ? src.limitations_ar : isEn ? src.limitations_en : src.limitations_fr}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};