// Coordonnées GPS des villes marocaines principales
export interface CityCoordinates {
  name: string;
  lat: number;
  lng: number;
}

export const moroccanCities: Record<string, CityCoordinates> = {
  'Casablanca': { name: 'Casablanca', lat: 33.5731, lng: -7.5898 },
  'Rabat': { name: 'Rabat', lat: 34.0209, lng: -6.8416 },
  'Fès': { name: 'Fès', lat: 34.0331, lng: -5.0003 },
  'Marrakech': { name: 'Marrakech', lat: 31.6295, lng: -7.9811 },
  'Tanger': { name: 'Tanger', lat: 35.7595, lng: -5.8340 },
  'Agadir': { name: 'Agadir', lat: 30.4278, lng: -9.5981 },
  'Meknès': { name: 'Meknès', lat: 33.8938, lng: -5.5473 },
  'Oujda': { name: 'Oujda', lat: 34.6867, lng: -1.9114 },
  'Kénitra': { name: 'Kénitra', lat: 34.2611, lng: -6.5802 },
  'Tétouan': { name: 'Tétouan', lat: 35.5886, lng: -5.3700 },
  'Safi': { name: 'Safi', lat: 32.2833, lng: -9.2333 },
  'El Jadida': { name: 'El Jadida', lat: 33.2543, lng: -8.5061 },
  'Khenifra': { name: 'Khenifra', lat: 32.9389, lng: -5.6614 },
  'Khénifra': { name: 'Khénifra', lat: 32.9389, lng: -5.6614 },
  'Khénifra ': { name: 'Khénifra ', lat: 32.9389, lng: -5.6614 },
  'Béni Mellal': { name: 'Béni Mellal', lat: 32.3394, lng: -6.3608 },
  'Nador': { name: 'Nador', lat: 35.1683, lng: -2.9336 },
  'Settat': { name: 'Settat', lat: 33.0011, lng: -7.6167 },
  'Larache': { name: 'Larache', lat: 35.1911, lng: -6.1556 },
  'Khémisset': { name: 'Khémisset', lat: 33.8156, lng: -6.0575 },
  'Taza': { name: 'Taza', lat: 34.2144, lng: -4.0086 },
  'Errachidia': { name: 'Errachidia', lat: 31.9319, lng: -4.4244 },
  'Ouarzazate': { name: 'Ouarzazate', lat: 30.9200, lng: -6.9100 },
};

// Fonction pour obtenir les coordonnées d'une ville
export function getCityCoordinates(cityName: string): CityCoordinates | null {
  if (!cityName) return null;
  
  // Normaliser le nom de la ville
  const normalizedCityName = cityName.trim().replace(/\s+/g, ' ');
  
  // Recherche exacte
  if (moroccanCities[normalizedCityName]) {
    return moroccanCities[normalizedCityName];
  }
  
  // Recherche insensible à la casse
  const found = Object.values(moroccanCities).find(
    city => city.name.toLowerCase() === normalizedCityName.toLowerCase()
  );
  
  if (found) {
    return found;
  }
  
  // Recherche partielle (le nom de la ville contient le terme recherché ou vice versa)
  const partialMatch = Object.values(moroccanCities).find(
    city => {
      const cityLower = city.name.toLowerCase();
      const searchLower = normalizedCityName.toLowerCase();
      return cityLower.includes(searchLower) || searchLower.includes(cityLower);
    }
  );
  
  if (partialMatch) {
    return partialMatch;
  }
  
  // Recherche avec accents (remplacer les accents)
  const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const accentMatch = Object.values(moroccanCities).find(
    city => removeAccents(city.name.toLowerCase()) === removeAccents(normalizedCityName.toLowerCase())
  );
  
  return accentMatch || null;
}

