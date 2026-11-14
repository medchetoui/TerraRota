import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Region {
  name_ar: string;
  name_fr: string;
  name_en: string;
  lat: number;
  lon: number;
  soil: string;
  desc_fr: string;
  desc_ar: string;
}

interface FarmMapProps {
  regions: Region[];
  selectedRegionIndex: number;
  onSelectRegion: (index: number) => void;
  customLat?: number;
  customLon?: number;
  onSelectCoords: (lat: number, lon: number) => void;
  lang: 'ar' | 'fr' | 'en';
}

export const FarmMap: React.FC<FarmMapProps> = ({
  regions,
  selectedRegionIndex,
  onSelectRegion,
  customLat,
  customLon,
  onSelectCoords,
  lang,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const activeMarkerRef = useRef<L.Marker | null>(null);

  const activeLat = customLat ?? regions[selectedRegionIndex]?.lat ?? 33.0;
  const activeLon = customLon ?? regions[selectedRegionIndex]?.lon ?? -7.6;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Fix leaflet default icon issue with bundlers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, {
      center: [activeLat, activeLon],
      zoom: 6,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | NASA POWER',
      maxZoom: 18,
    }).addTo(map);

    const markerGroup = L.layerGroup().addTo(map);
    markerGroupRef.current = markerGroup;

    // Handle map click for custom field coordinates
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onSelectCoords(parseFloat(lat.toFixed(4)), parseFloat(lng.toFixed(4)));
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;

    markerGroupRef.current.clearLayers();

    // Custom colored pin for pilot regions
    const regionIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color:#2D4A27; color:white; border:2px solid #FAF7F2; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px; box-shadow:0 3px 6px rgba(0,0,0,0.3);">🌾</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const activeIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color:#8C3A27; color:white; border:3px solid white; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px; box-shadow:0 4px 10px rgba(0,0,0,0.4); animation:bounce 1s infinite alternate;">📍</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    // Add preset region markers
    regions.forEach((reg, index) => {
      const isSelected = selectedRegionIndex === index && !customLat;
      const marker = L.marker([reg.lat, reg.lon], {
        icon: isSelected ? activeIcon : regionIcon,
      });

      const title = lang === 'ar' ? reg.name_ar : lang === 'en' ? reg.name_en : reg.name_fr;
      marker.bindPopup(`
        <div style="font-family:sans-serif; text-align:${lang === 'ar' ? 'right' : 'left'};">
          <strong style="color:#1E331A; font-size:14px;">${title}</strong><br/>
          <span style="font-size:12px; color:#5A4D3B;">${reg.lat.toFixed(2)}°N, ${reg.lon.toFixed(2)}°E</span><br/>
          <span style="font-size:11px; color:#8C3A27; font-weight:bold;">${reg.desc_fr}</span>
        </div>
      `);

      marker.on('click', () => {
        onSelectRegion(index);
      });

      marker.addTo(markerGroupRef.current!);
    });

    // If custom click coordinate is set, add active pin
    if (customLat && customLon) {
      const customMarker = L.marker([customLat, customLon], { icon: activeIcon });
      customMarker.bindPopup(`
        <div style="font-family:sans-serif; text-align:${lang === 'ar' ? 'right' : 'left'};">
          <strong style="color:#8C3A27;">${lang === 'ar' ? 'موقع مخصص' : 'Emplacement sélectionné'}</strong><br/>
          <span>${customLat.toFixed(4)}°N, ${customLon.toFixed(4)}°E</span>
        </div>
      `).openPopup();
      customMarker.addTo(markerGroupRef.current);
    }

    // Pan map to active point
    mapInstanceRef.current.setView([activeLat, activeLon], mapInstanceRef.current.getZoom(), { animate: true });
  }, [regions, selectedRegionIndex, customLat, customLon, lang]);

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden border-2 border-[#DECAB3] shadow-inner bg-[#EFE9DC]">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <div className="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#D5C4AC] text-[11px] font-bold text-[#3B3020] shadow-sm flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[#8C3A27]"></span>
        <span>
          {lang === 'ar'
            ? 'انقر في أي مكان على الخريطة لتحديد إحداثيات حقلك'
            : lang === 'en'
            ? 'Click anywhere on the map to set custom farm coordinates'
            : 'Cliquez sur la carte pour sélectionner les coordonnées de votre parcelle'}
        </span>
      </div>
    </div>
  );
};
