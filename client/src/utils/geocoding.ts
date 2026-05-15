/**
 * Geocoding utility for validating and converting addresses to coordinates
 * Uses Google Maps Geocoding API
 */

export interface GeocodedLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

/**
 * Validates and geocodes an address using Google Maps API
 *
 * Requirements:
 * - Address must be exact (no partial matches)
 * - Must include: street number, street name, and city
 * - Must be a valid address type (street_address, premise, etc.)
 *
 * @param locationText - The address text to geocode
 * @returns Promise with lat, lng, and formatted address
 * @throws Error if address is invalid or incomplete
 */
export async function geocodeAddress(locationText: string): Promise<GeocodedLocation> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    throw new Error('Missing Google Maps API key');
  }

  const cleaned = locationText.trim();
  if (!cleaned) {
    throw new Error('יש להזין כתובת');
  }

  // Add Israel to query if not included
  const query = cleaned.includes('ישראל') ? cleaned : `${cleaned}, ישראל`;

  const params = new URLSearchParams({
    address: query,
    key: apiKey,
    language: 'he',
    region: 'IL',
  });

  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results?.length) {
    if (data.status === 'ZERO_RESULTS') {
      throw new Error('כתובת לא נמצאה');
    }
    throw new Error(`Geocoding failed: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`);
  }

  const first = data.results[0];

  // 1. Check for partial match - Google shouldn't guess
  if (first.partial_match) {
    throw new Error('כתובת לא מדויקת - אנא הזן כתובת מלאה כולל מספר בית');
  }

  // 2. Check if it's a valid address type
  const allowedTypes = new Set([
    'street_address',
    'premise',
    'subpremise',
  ]);

  const hasAllowedType = Array.isArray(first.types) &&
    first.types.some((type: string) => allowedTypes.has(type));

  if (!hasAllowedType) {
    throw new Error('כתובת לא מדויקת - יש להזין כתובת מלאה (רחוב, מספר בית, עיר)');
  }

  // 3. Validate address components - must have street number, street name, and city
  const components = first.address_components || [];

  const hasStreetNumber = components.some((comp: any) =>
    comp.types.includes('street_number')
  );

  const hasStreetName = components.some((comp: any) =>
    comp.types.includes('route')
  );

  const hasCity = components.some((comp: any) =>
    comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')
  );

  if (!hasStreetNumber) {
    throw new Error('חסר מספר בית - אנא הזן כתובת מלאה כולל מספר');
  }

  if (!hasStreetName) {
    throw new Error('חסר שם רחוב - אנא הזן כתובת מלאה');
  }

  if (!hasCity) {
    throw new Error('חסר שם עיר - אנא הזן כתובת מלאה');
  }

  return {
    lat: first.geometry.location.lat,
    lng: first.geometry.location.lng,
    formattedAddress: first.formatted_address,
  };
}

/**
 * Validates that a city exists in Israel using Google Maps API
 *
 * Requirements:
 * - City must exist (no partial matches)
 * - Must be a valid city type (locality or administrative_area_level_2)
 *
 * @param city - The city name to validate
 * @throws Error if city is not found or name is not exact
 */
export async function validateCity(city: string): Promise<void> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    throw new Error('Missing Google Maps API key');
  }

  const cleaned = city.trim();
  if (!cleaned) {
    throw new Error('יש להזין שם עיר');
  }

  // Add Israel to query if not included
  const query = cleaned.includes('ישראל') ? cleaned : `${cleaned}, ישראל`;

  const params = new URLSearchParams({
    address: query,
    key: apiKey,
    language: 'he',
    region: 'IL',
  });

  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error('העיר לא נמצאה - נא לבדוק את האיות');
  }

  const result = data.results[0];

  // Check for partial match
  if (result.partial_match === true) {
    throw new Error('שם העיר אינו מדויק - נא להזין שם עיר מלא');
  }

  // Validate result type
  const types = result.types || [];
  const isCity = types.includes('locality') || types.includes('administrative_area_level_2');

  if (!isCity) {
    throw new Error('העיר לא נמצאה - נא לבדוק את האיות');
  }
}

/**
 * Validates that a street exists in a given city using Google Maps API
 *
 * Requirements:
 * - Street must exist in the specified city (no partial matches)
 * - Must be a valid street type (route)
 *
 * @param city - The city name
 * @param street - The street name to validate
 * @throws Error if street is not found in the city or name is not exact
 */
export async function validateCityAndStreet(city: string, street: string): Promise<void> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    throw new Error('Missing Google Maps API key');
  }

  const cleanedStreet = street.trim();
  if (!cleanedStreet) {
    throw new Error('יש להזין שם רחוב');
  }

  // Query: "{street}, {city}, ישראל"
  const query = `${cleanedStreet}, ${city}, ישראל`;

  const params = new URLSearchParams({
    address: query,
    key: apiKey,
    language: 'he',
    region: 'IL',
  });

  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error('הרחוב לא נמצא בעיר זו - נא לבדוק את האיות');
  }

  const result = data.results[0];

  // Check for partial match
  if (result.partial_match === true) {
    throw new Error('שם הרחוב אינו מדויק');
  }

  // Validate result type is a route (street)
  const types = result.types || [];
  const isRoute = types.includes('route');

  if (!isRoute) {
    throw new Error('הרחוב לא נמצא בעיר זו - נא לבדוק את האיות');
  }
}

/**
 * Validates full address and returns coordinates
 *
 * Requirements:
 * - House number must be provided
 * - Address must exist (no partial matches)
 * - Must be a valid address type (street_address, premise, or subpremise)
 *
 * @param city - The city name
 * @param street - The street name
 * @param number - The house number
 * @returns Promise with lat, lng, and formatted address
 * @throws Error if house number is not found on the street
 */
export async function validateFullAddress(
  city: string,
  street: string,
  number: string
): Promise<{ lat: number; lng: number; formattedAddress: string }> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!apiKey) {
    throw new Error('Missing Google Maps API key');
  }

  if (!number.trim()) {
    throw new Error('יש להזין מספר בית');
  }

  // Query: "{street} {number}, {city}, ישראל"
  const query = `${street} ${number}, ${city}, ישראל`;

  const params = new URLSearchParams({
    address: query,
    key: apiKey,
    language: 'he',
    region: 'IL',
  });

  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error('מספר הבית לא נמצא ברחוב זה');
  }

  const result = data.results[0];

  // Check for partial match
  if (result.partial_match === true) {
    throw new Error('מספר הבית לא נמצא ברחוב זה');
  }

  // Validate result type
  const types = result.types || [];
  const isAddress =
    types.includes('street_address') ||
    types.includes('premise') ||
    types.includes('subpremise');

  if (!isAddress) {
    throw new Error('מספר הבית לא נמצא ברחוב זה');
  }

  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formattedAddress: result.formatted_address,
  };
}
