export function buildSearchUrl({ query, location, latitude, longitude, radius }) {
  const baseUrl = 'https://www.google.com/maps/search/';
  
  if (latitude && longitude) {
    const zoom = getZoomFromRadius(radius || 5000);
    // Usar búsqueda basada en coordenadas para un objetivo de ubicación preciso
    const encodedQuery = encodeURIComponent(query);
    return `${baseUrl}${encodedQuery}/@${latitude},${longitude},${zoom}z`;
  } else if (location) {
    // Usar formato "consulta en ubicación" para mejor geo-direccionamiento
    // Esto le dice a Google Maps que busque la consulta DENTRO de la ubicación especificada
    const searchQuery = `${query} in ${location}`;
    return `${baseUrl}${encodeURIComponent(searchQuery)}`;
  } else {
    return `${baseUrl}${encodeURIComponent(query)}`;
  }
}

// Geocodificar un nombre de ubicación a coordenadas usando Nominatim (OpenStreetMap)
export async function geocodeLocation(locationName) {
  try {
    const encodedLocation = encodeURIComponent(locationName);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`,
      {
        headers: {
          'User-Agent': 'GoogleMapsScraper/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.log(`Geocodificación fallida para "${locationName}", usando búsqueda de texto`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    
    return null;
  } catch (error) {
    console.log(`Error de geocodificación para "${locationName}": ${error.message}`);
    return null;
  }
}

function getZoomFromRadius(radiusMeters) {
  if (radiusMeters <= 500) return 16;
  if (radiusMeters <= 1000) return 15;
  if (radiusMeters <= 2000) return 14;
  if (radiusMeters <= 5000) return 13;
  if (radiusMeters <= 10000) return 12;
  return 11;
}

export function extractCoordinatesFromUrl(url) {
  try {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      return {
        latitude: parseFloat(match[1]),
        longitude: parseFloat(match[2]),
      };
    }

    const placeMatch = url.match(/place\/[^/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (placeMatch) {
      return {
        latitude: parseFloat(placeMatch[1]),
        longitude: parseFloat(placeMatch[2]),
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting coordinates from URL:', error);
    return null;
  }
}

export function parseAddress(fullAddress) {
  if (!fullAddress) {
    return {
      full: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    };
  }

  const parts = fullAddress.split(',').map(p => p.trim());
  const result = {
    full: fullAddress,
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  };

  if (parts.length === 0) return result;

  result.country = parts[parts.length - 1] || '';

  if (parts.length >= 4) {
    result.street = parts[0];
    result.city = parts[1];
    
    const stateZipPart = parts[parts.length - 2];
    const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s*(\d{5}(-\d{4})?)?$/);
    
    if (stateZipMatch) {
      result.state = stateZipMatch[1];
      result.zipCode = stateZipMatch[2] || '';
    } else {
      const altMatch = stateZipPart.match(/([A-Z]{2})\s*(\d{5}(-\d{4})?)/);
      if (altMatch) {
        result.state = altMatch[1];
        result.zipCode = altMatch[2];
      }
    }
  } else if (parts.length === 3) {
    result.street = parts[0];
    
    const secondPart = parts[1];
    const stateZipMatch = secondPart.match(/^(.+?)\s+([A-Z]{2})\s*(\d{5}(-\d{4})?)?$/);
    
    if (stateZipMatch) {
      result.city = stateZipMatch[1].trim();
      result.state = stateZipMatch[2];
      result.zipCode = stateZipMatch[3] || '';
    } else {
      const justStateZip = secondPart.match(/^([A-Z]{2})\s*(\d{5}(-\d{4})?)?$/);
      if (justStateZip) {
        result.state = justStateZip[1];
        result.zipCode = justStateZip[2] || '';
      } else {
        result.city = secondPart;
      }
    }
  } else if (parts.length === 2) {
    result.street = parts[0];
    result.city = parts[1];
  }

  return result;
}

export function formatPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}

export function extractEmail(text) {
  if (!text) return null;
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

export function parseOpeningHours(hoursData) {
  if (!hoursData || !Array.isArray(hoursData)) return [];
  
  return hoursData.map(day => {
    if (typeof day === 'string') {
      return { raw: day };
    }
    return day;
  });
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await sleep(delay * Math.pow(2, i));
      }
    }
  }
  
  throw lastError;
}

export function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

export function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}
