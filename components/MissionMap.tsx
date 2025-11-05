'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Mission } from '@/lib/types';
import { getCityCoordinates } from '@/lib/cities';
import { MapPin, Navigation, Truck } from 'lucide-react';

// Fix pour les icônes par défaut de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MissionMapProps {
  missions: Mission[];
  selectedMission?: Mission | null;
  onMissionSelect?: (mission: Mission | null) => void;
}

export default function MissionMap({ missions, selectedMission, onMissionSelect }: MissionMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Petite pause pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      if (!containerRef.current || mapRef.current) return;

      // Initialiser la carte centrée sur le Maroc
      const map = L.map(containerRef.current, {
        center: [31.6295, -7.9811], // Centre du Maroc
        zoom: 6,
        zoomControl: true,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
      });

      // Ajouter la tuile OpenStreetMap avec style moderne
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Invalider la taille après un court délai pour forcer le redimensionnement
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          // Forcer le rendu initial
          mapRef.current.invalidateSize(true);
          // Forcer le rendu après l'invalidation
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize(true);
            }
          }, 100);
        }
      }, 150);
    }, 50);

    // Nettoyer lors du démontage
    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Si pas de missions, recentrer sur le Maroc
    if (missions.length === 0) {
      map.setView([31.6295, -7.9811], 6);
      return;
    }

    // Supprimer les anciens marqueurs et polylines
    markersRef.current.forEach(marker => marker.remove());
    polylinesRef.current.forEach(polyline => polyline.remove());
    markersRef.current = [];
    polylinesRef.current = [];

    // Créer des marqueurs et polylines pour chaque mission
    const bounds: L.LatLng[] = [];

    console.log(`🗺️ Affichage de ${missions.length} mission(s) sur la carte`);

    missions.forEach((mission, index) => {
      // Vérifier que les villes existent
      if (!mission.depart || !mission.destination) {
        console.warn(`⚠️ Mission ${mission.id} manque départ ou destination`);
        return;
      }

      const startCoords = getCityCoordinates(mission.depart);
      const endCoords = getCityCoordinates(mission.destination);

      if (!startCoords || !endCoords) {
        console.warn(`⚠️ Coordonnées non trouvées pour ${mission.depart} (${startCoords ? 'OK' : 'NON TROUVÉ'}) ou ${mission.destination} (${endCoords ? 'OK' : 'NON TROUVÉ'})`);
        return;
      }

      console.log(`✅ Trajet ${mission.depart} → ${mission.destination} trouvé`);

      const startLatLng: L.LatLng = L.latLng(startCoords.lat, startCoords.lng);
      const endLatLng: L.LatLng = L.latLng(endCoords.lat, endCoords.lng);

      bounds.push(startLatLng, endLatLng);

      // Couleur selon le statut
      const color = 
        mission.statut === 'en_cours' ? '#0ea5e9' : // Blue
        mission.statut === 'termine' ? '#10b981' : // Green
        '#6b7280'; // Gray

      // Calculer l'angle de direction pour orienter le camion
      const calculateBearing = (start: L.LatLng, end: L.LatLng): number => {
        const lat1 = start.lat * Math.PI / 180;
        const lat2 = end.lat * Math.PI / 180;
        const dLon = (end.lng - start.lng) * Math.PI / 180;
        
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        
        const bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
      };

      // Calculer l'angle de direction (le camion SVG pointe vers la droite par défaut)
      // Nous devons ajuster l'angle pour que le camion pointe vers la destination
      const bearing = calculateBearing(startLatLng, endLatLng);
      // Le camion SVG pointe vers la droite (0°), donc on ajoute 90° pour pointer vers le haut
      // Ensuite on soustrait l'angle de bearing pour pointer vers la destination
      const startRotation = (90 - bearing) % 360;
      const endRotation = (270 - bearing) % 360; // Inverse pour l'arrivée

      // Créer une polyline avec animation et style moderne
      const polyline = L.polyline([startLatLng, endLatLng], {
        color,
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1,
        dashArray: mission.statut === 'en_cours' ? '15, 10' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      
      // Ajouter un effet de glow pour les missions en cours
      if (mission.statut === 'en_cours') {
        const glowPolyline = L.polyline([startLatLng, endLatLng], {
          color,
          weight: 10,
          opacity: 0.2,
          smoothFactor: 1,
          dashArray: '15, 10',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
        polylinesRef.current.push(glowPolyline);
      }

      // Ajouter une animation pour les missions en cours (via CSS)
      if (mission.statut === 'en_cours') {
        polyline.getElement()?.classList.add('animate-dash');
      }

      polylinesRef.current.push(polyline);

      // Créer des marqueurs personnalisés avec icône de camion (image van.png) - couleur selon statut
      const startIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-start" style="
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <img 
              src="/images/van.png" 
              alt="Camion" 
              style="
                width: 40px;
                height: 40px;
                object-fit: contain;
                transform: rotate(${startRotation}deg);
              "
            />
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const endIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="marker-end" style="
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            <img 
              src="/images/van.png" 
              alt="Camion" 
              style="
                width: 40px;
                height: 40px;
                object-fit: contain;
                transform: rotate(${endRotation}deg);
              "
            />
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      // Popup moderne avec plus d'informations
      const popupContent = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: ${color};">
            ${mission.depart} → ${mission.destination}
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
            Statut: <span style="color: ${color}; font-weight: 600;">${
              mission.statut === 'en_cours' ? 'En cours' : 
              mission.statut === 'termine' ? 'Terminé' : 
              'Planifié'
            }</span>
          </div>
          ${mission.recette ? `
            <div style="font-size: 12px; color: #666; margin-top: 6px;">
              Recette: <span style="color: #10b981; font-weight: 600;">${mission.recette.toLocaleString('fr-FR')} MAD</span>
            </div>
          ` : ''}
        </div>
      `;

      const startMarker = L.marker(startLatLng, { icon: startIcon })
        .addTo(map)
        .bindPopup(popupContent);

      const endMarker = L.marker(endLatLng, { icon: endIcon })
        .addTo(map)
        .bindPopup(popupContent);

      // Ajouter des événements de clic
      if (onMissionSelect) {
        [startMarker, endMarker, polyline].forEach(item => {
          item.on('click', () => {
            onMissionSelect(mission);
          });
        });
      }

      markersRef.current.push(startMarker, endMarker);

      // Mettre en surbrillance la mission sélectionnée
      if (selectedMission && selectedMission.id === mission.id) {
        polyline.setStyle({ weight: 6, opacity: 1 });
        map.setView([(startCoords.lat + endCoords.lat) / 2, (startCoords.lng + endCoords.lng) / 2], 8);
      }
    });

    // Ajuster la vue pour montrer tous les trajets
    if (bounds.length > 0) {
      console.log(`📍 Ajustement de la vue pour ${bounds.length / 2} trajet(s)`);
      const boundsGroup = L.latLngBounds(bounds);
      map.fitBounds(boundsGroup, { padding: [50, 50] });
    } else {
      console.warn('⚠️ Aucune mission avec coordonnées valides, recentrage sur le Maroc');
      // Si aucune mission avec coordonnées valides, recentrer sur le Maroc
      map.setView([31.6295, -7.9811], 6);
    }
  }, [missions, selectedMission, onMissionSelect]);

  return (
    <div className="relative w-full h-full min-h-[400px] sm:min-h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <div ref={containerRef} className="w-full h-full" style={{ zIndex: 0, height: '100%', minHeight: '400px' }} />
      
      {/* Message si aucune mission ou si aucune coordonnée trouvée */}
      {missions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Aucune mission à afficher</p>
          </div>
        </div>
      )}
      
      {/* Légende moderne */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-3 sm:p-4 z-[1000] border border-gray-200">
        <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary-600" />
          Légende
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 bg-blue-500 rounded-full shadow-sm"></div>
            <span className="text-xs text-gray-600">En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 bg-green-500 rounded-full shadow-sm"></div>
            <span className="text-xs text-gray-600">Terminé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 bg-gray-500 rounded-full shadow-sm"></div>
            <span className="text-xs text-gray-600">Planifié</span>
          </div>
        </div>
      </div>

      {/* Compteur de trajets moderne */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl px-3 sm:px-4 py-2 z-[1000] border border-gray-200">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary-600" />
          <span className="text-xs sm:text-sm font-semibold text-gray-700">
            {missions.length} trajet{missions.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

