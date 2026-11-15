import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  Layers, 
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
          {isAr ? 'مصادر البيانات والأقمار الاصطناعية المعتمدة' : 'Sources de Données & Satellites NASA'}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A6B53] max-w-3xl leading-relaxed">
          {isAr 
            ? 'توثيق رسمي لجميع مجموعات البيانات البيئية لوكالة الفضاء الأمريكية (NASA) والمؤسسات الشريكة (ISRIC / FAO) مع بيان دقتها المكانية والزمنية وحالتها التشغيلية في المنصة.'
            : 'Inventaire officiel et transparent des flux de données d\'observation de la Terre utilisés ou en cours d\'intégration dans TerraRota, avec leurs limites et résolutions.'}
        </p>
      </div>

      {/* Sources Cards */}
      {loading ? (
        <div className="p-12 text-center text-sm font-bold text-[#7A6B53]">Chargement du registre NASA...</div>
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
                      title="Visiter le portail officiel NASA"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-[#7A6B53] font-semibold mt-0.5">
                    Fournisseur : {src.provider} • Produit : <span className="font-mono text-[#1E331A]">{src.product_id}</span>
                  </p>
                </div>
                {getStatusBadge(src.status)}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#EFE9DC]">
                  <span className="text-[#7A6B53] font-bold block">Résolution Spatiale :</span>
                  <span className="font-extrabold text-[#1E331A]">{src.spatial_resolution}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#EFE9DC]">
                  <span className="text-[#7A6B53] font-bold block">Résolution Temporelle :</span>
                  <span className="font-extrabold text-[#1E331A]">{src.temporal_resolution}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#EFE9DC] sm:col-span-2">
                  <span className="text-[#7A6B53] font-bold block">Variables extraites :</span>
                  <span className="font-semibold text-[#1E331A]">
                    {src.variables.map(v => `${v.code} (${v.unit})`).join(', ')}
                  </span>
                </div>
              </div>

              {/* Processing methods */}
              <div className="space-y-1.5 text-xs text-[#4D3F2C]">
                <div className="font-bold text-[#1E331A]">Traitements & Algorithmes Appliqués :</div>
                <ul className="list-disc list-inside space-y-0.5 text-[#61513C]">
                  {src.processing_methods.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>

              {/* Limitations note */}
              <div className="p-3.5 rounded-2xl bg-[#EFE9DC]/70 border border-[#DECAB3] text-xs text-[#61513C] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#1E331A]">Limites Connues :</strong> {src.limitations}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
