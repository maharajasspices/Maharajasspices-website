/**
 * Free geocoding and distance calculation utilities using OpenStreetMap Nominatim
 * No API key required - respects Nominatim usage policy (1 req/sec)
 */

interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
}

// Cache for geocoding results
const geocodeCache = new Map<string, GeocodingResult>();

/**
 * Geocode an address using OpenStreetMap Nominatim (free, no API key)
 * Respects rate limiting (1 request per second)
 */
export const geocodeAddress = async (address: string, city: string, country: string = "South Africa"): Promise<GeocodingResult | null> => {
  const cacheKey = `${address}, ${city}, ${country}`.toLowerCase();
  
  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const query = encodeURIComponent(`${address}, ${city}, ${country}`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=za`,
      {
        headers: {
          'User-Agent': 'MaharajasSpices/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding request failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result: GeocodingResult = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name,
      };
      
      // Cache the result
      geocodeCache.set(cacheKey, result);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get warehouse/store location (Waterfall, Durban)
 */
export const getWarehouseLocation = (): { lat: number; lon: number } => {
  // Maharaja's Spices main warehouse in Waterfall, Durban
  return {
    lat: -29.8167,
    lon: 31.0167,
  };
};

/**
 * Calculate shipping distance from warehouse to destination address
 */
export const calculateShippingDistance = async (
  address: string,
  city: string
): Promise<number | null> => {
  const destination = await geocodeAddress(address, city);
  
  if (!destination) {
    console.error('Could not geocode destination address');
    return null;
  }
  
  const warehouse = getWarehouseLocation();
  const distance = calculateDistance(
    warehouse.lat,
    warehouse.lon,
    destination.lat,
    destination.lon
  );
  
  return distance;
};
