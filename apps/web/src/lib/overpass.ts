/**
 * OpenStreetMap Overpass API client for fetching nearby POIs
 * Free API with no key required
 */

export interface POI {
  id: string;
  name: string;
  type: string;
  category: string;
  distance: number; // in meters
  latitude: number;
  longitude: number;
  address?: string;
}

export interface POICategory {
  category: string;
  icon: string;
  color: string;
  items: POI[];
  totalCount: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c); // Distance in meters
}

/**
 * Fetch nearby POIs from Overpass API
 */
export async function fetchNearbyPOIs(
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
): Promise<POICategory[]> {
  const radius = radiusMeters;

  // Define POI categories with their OpenStreetMap tags
  const categories = [
    {
      name: 'metro',
      displayName: 'Станции метро',
      icon: 'train',
      color: 'blue',
      query: `node["railway"="station"]["station"="subway"](around:${radius},${latitude},${longitude});`,
    },
    {
      name: 'kindergarten',
      displayName: 'Детские сады',
      icon: 'baby',
      color: 'pink',
      query: `node["amenity"="kindergarten"](around:${radius},${latitude},${longitude});
              way["amenity"="kindergarten"](around:${radius},${latitude},${longitude});`,
    },
    {
      name: 'school',
      displayName: 'Школы',
      icon: 'school',
      color: 'purple',
      query: `node["amenity"="school"](around:${radius},${latitude},${longitude});
              way["amenity"="school"](around:${radius},${latitude},${longitude});`,
    },
    {
      name: 'hospital',
      displayName: 'Больницы',
      icon: 'hospital',
      color: 'red',
      query: `node["amenity"="hospital"](around:${radius},${latitude},${longitude});
              way["amenity"="hospital"](around:${radius},${latitude},${longitude});
              node["amenity"="clinic"](around:${radius},${latitude},${longitude});
              way["amenity"="clinic"](around:${radius},${latitude},${longitude});`,
    },
    {
      name: 'pharmacy',
      displayName: 'Аптеки',
      icon: 'pill',
      color: 'green',
      query: `node["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
              way["amenity"="pharmacy"](around:${radius},${latitude},${longitude});`,
    },
    {
      name: 'supermarket',
      displayName: 'Супермаркеты',
      icon: 'shopping-cart',
      color: 'yellow',
      query: `node["shop"="supermarket"](around:${radius},${latitude},${longitude});
              way["shop"="supermarket"](around:${radius},${latitude},${longitude});
              node["shop"="convenience"](around:${radius},${latitude},${longitude});
              way["shop"="convenience"](around:${radius},${latitude},${longitude});`,
    },
    {
      name: 'restaurant',
      displayName: 'Рестораны',
      icon: 'utensils',
      color: 'orange',
      query: `node["amenity"="restaurant"](around:${radius},${latitude},${longitude});
              way["amenity"="restaurant"](around:${radius},${latitude},${longitude});
              node["amenity"="cafe"](around:${radius},${latitude},${longitude});
              way["amenity"="cafe"](around:${radius},${latitude},${longitude});`,
    },
    {
      name: 'shopping',
      displayName: 'Торговые центры',
      icon: 'shopping-bag',
      color: 'purple',
      query: `node["shop"="mall"](around:${radius},${latitude},${longitude});
              way["shop"="mall"](around:${radius},${latitude},${longitude});
              node["amenity"="marketplace"](around:${radius},${latitude},${longitude});
              way["amenity"="marketplace"](around:${radius},${latitude},${longitude});`,
    },
    {
      name: 'park',
      displayName: 'Парки',
      icon: 'tree',
      color: 'green',
      query: `node["leisure"="park"](around:${radius},${latitude},${longitude});
              way["leisure"="park"](around:${radius},${latitude},${longitude});
              node["leisure"="garden"](around:${radius},${latitude},${longitude});
              way["leisure"="garden"](around:${radius},${latitude},${longitude});`,
    },
    {
      name: 'sports',
      displayName: 'Спортзалы',
      icon: 'dumbbell',
      color: 'blue',
      query: `node["leisure"="fitness_centre"](around:${radius},${latitude},${longitude});
              way["leisure"="fitness_centre"](around:${radius},${latitude},${longitude});
              node["leisure"="sports_centre"](around:${radius},${latitude},${longitude});
              way["leisure"="sports_centre"](around:${radius},${latitude},${longitude});`,
    },
    {
      name: 'bank',
      displayName: 'Банки',
      icon: 'building-columns',
      color: 'indigo',
      query: `node["amenity"="bank"](around:${radius},${latitude},${longitude});
              way["amenity"="bank"](around:${radius},${latitude},${longitude});
              node["amenity"="atm"](around:${radius},${latitude},${longitude});`,
    },
  ];

  const results: POICategory[] = [];

  for (const category of categories) {
    try {
      const overpassQuery = `
        [out:json][timeout:25];
        (
          ${category.query}
        );
        out center;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${category.name}:`, response.statusText);
        continue;
      }

      const data = await response.json();
      const pois: POI[] = [];

      for (const element of data.elements) {
        const lat = element.lat || element.center?.lat;
        const lon = element.lon || element.center?.lon;

        if (!lat || !lon) continue;

        const distance = calculateDistance(latitude, longitude, lat, lon);
        const name = element.tags?.name || element.tags?.['name:en'] || element.tags?.['name:ru'] || `${category.displayName}`;

        pois.push({
          id: `${category.name}-${element.id}`,
          name,
          type: element.tags?.amenity || element.tags?.shop || element.tags?.leisure || category.name,
          category: category.name,
          distance,
          latitude: lat,
          longitude: lon,
          address: element.tags?.['addr:street']
            ? `${element.tags['addr:street']}${element.tags['addr:housenumber'] ? ', ' + element.tags['addr:housenumber'] : ''}`
            : undefined,
        });
      }

      // Sort by distance and limit to closest 5
      pois.sort((a, b) => a.distance - b.distance);
      const closestPOIs = pois.slice(0, 5);

      results.push({
        category: category.displayName,
        icon: category.icon,
        color: category.color,
        items: closestPOIs,
        totalCount: pois.length,
      });

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching ${category.name}:`, error);
      results.push({
        category: category.displayName,
        icon: category.icon,
        color: category.color,
        items: [],
        totalCount: 0,
      });
    }
  }

  return results;
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} м`;
  }
  return `${(meters / 1000).toFixed(1)} км`;
}

/**
 * Calculate walking time (assuming 5 km/h average walking speed)
 */
export function calculateWalkingTime(meters: number): string {
  const minutes = Math.round((meters / 1000) * 12); // 12 min per km
  if (minutes < 1) return '< 1 мин';
  return `${minutes} мин пешком`;
}
