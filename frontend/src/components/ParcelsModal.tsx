import { useEffect, useState, useContext } from 'react';
import { AppContext } from '../App';
import { getParcels, deleteParcel, type ParcelItem } from '../api/client';
import { MapPin, Trash2, ArrowUpRight, X, BookmarkCheck, Loader2 } from 'lucide-react';

interface ParcelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectParcel: (parcel: ParcelItem) => void;
}

export default function ParcelsModal({ isOpen, onClose, onSelectParcel }: ParcelsModalProps) {
  const { t, lang } = useContext(AppContext);
  const [parcels, setParcels] = useState<ParcelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAr = lang === 'ar';

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
      setErrorMsg(isAr ? 'تعذر تحميل الأراضي المحفوظة.' : 'Impossible de charger les parcelles.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteParcel(id);
      setParcels((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setErrorMsg(isAr ? 'خطأ أثناء الحذف.' : 'Erreur lors de la suppression.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="relative w-full max-w-xl p-8 rounded-3xl bg-[#FAF7F2] border-2 border-[#DECAB3] shadow-2xl text-[#2C2416] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#DECAB3] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D4A27]/10 border border-[#2D4A27]/30 flex items-center justify-center text-[#2D4A27]">
              <BookmarkCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1E331A]">{isAr ? 'أراضيي الفلاحية المحفوظة' : t('myParcels')}</h2>
              <p className="text-xs text-[#7A6B53] font-medium">{isAr ? 'قائمة الحقول والقطع المسجلة في حسابك' : 'Vos exploitations et parcelles sauvegardées'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#7A6B53] hover:text-[#1E331A] rounded-xl bg-[#EFE9DC] hover:bg-[#E5DDCF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pe-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#7A6B53] gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#8C3A27]" />
              <span className="text-xs font-bold">{isAr ? 'جاري جلب أراضيك من السيرفور...' : 'Chargement...'}</span>
            </div>
          ) : parcels.length === 0 ? (
            <div className="py-12 text-center text-[#7A6B53] space-y-2">
              <p className="text-sm font-bold text-[#1E331A]">{isAr ? 'لا توجد أراضي محفوظة بعد.' : 'Aucune parcelle sauvegardée.'}</p>
              <p className="text-xs text-[#8C7A60]">
                {isAr ? 'يمكنك تحديد موقع حقلك والضغط على "حفظ الحقل" لإضافته هنا.' : 'Localisez votre parcelle et cliquez sur "Enregistrer" pour la retrouver ici.'}
              </p>
            </div>
          ) : (
            parcels.map((parcel) => (
              <div
                key={parcel.id}
                className="p-4 rounded-2xl bg-[#EFE9DC] border border-[#DECAB3] hover:border-[#2D4A27] transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#8C3A27] shrink-0" />
                    <span className="font-extrabold text-[#1E331A] text-sm">{parcel.name}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#7A6B53] font-medium">
                    <span>
                      {parcel.latitude.toFixed(4)}°N, {parcel.longitude.toFixed(4)}°W
                    </span>
                    {parcel.field_size_ha && <span>• {parcel.field_size_ha} {isAr ? 'هكتار' : 'Ha'}</span>}
                    {parcel.soil_type && <span>• {parcel.soil_type}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectParcel(parcel)}
                    className="px-3 py-1.5 rounded-xl bg-[#2D4A27] text-white hover:bg-[#1E331A] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{isAr ? 'تحليل الآن' : 'Analyser'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(parcel.id)}
                    className="p-1.5 rounded-xl bg-white/60 hover:bg-rose-100 text-[#7A6B53] hover:text-rose-700 transition-colors cursor-pointer"
                    title={isAr ? 'حذف' : 'Supprimer'}
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
