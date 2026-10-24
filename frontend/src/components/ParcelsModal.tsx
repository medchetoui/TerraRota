import { useEffect, useState, useContext } from 'react';
import { AppContext } from '../App';
import { getParcels, deleteParcel, type ParcelItem } from '../api/client';
import { MapPin, Trash2, ArrowUpRight, X, BookmarkCheck, Loader2 } from 'lucide-react';
import type { FormData } from '../App';

interface ParcelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectParcel: (parcel: ParcelItem) => void;
}

export default function ParcelsModal({ isOpen, onClose, onSelectParcel }: ParcelsModalProps) {
  const { t } = useContext(AppContext);
  const [parcels, setParcels] = useState<ParcelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadParcels();
    }
  }, [isOpen]);

  const loadParcels = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getParcels();
      setParcels(res.parcels || []);
    } catch {
      setErrorMsg('Impossible de charger les parcelles.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteParcel(id);
      setParcels((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setErrorMsg('Erreur lors de la suppression.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl p-8 rounded-3xl bg-[#0b120c] border border-emerald-500/30 shadow-2xl shadow-emerald-950/60 text-white max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{t('myParcels')}</h2>
              <p className="text-xs text-slate-400">Vos exploitations et parcelles sauvegardées</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-sm">Chargement des parcelles...</p>
            </div>
          ) : parcels.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              {t('noParcels')}
            </div>
          ) : (
            parcels.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="font-semibold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Lat: {p.latitude.toFixed(4)}, Lon: {p.longitude.toFixed(4)}
                  </p>
                  <div className="flex gap-2 text-[11px] text-gray-300">
                    <span className="px-2 py-0.5 rounded bg-white/10">{p.water_access || 'N/A'}</span>
                    <span className="px-2 py-0.5 rounded bg-white/10">{p.soil_type || 'N/A'}</span>
                    {p.field_size_ha && (
                      <span className="px-2 py-0.5 rounded bg-white/10">{p.field_size_ha} ha</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectParcel(p);
                      onClose();
                    }}
                    className="py-1.5 px-3 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{t('loadParcel')}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
