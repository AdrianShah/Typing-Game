export const CONTINENTS = [
  { id: 'concacaf', name: 'CONCACAF' },
  { id: 'uefa', name: 'UEFA' },
  { id: 'conmebol', name: 'CONMEBOL' },
  { id: 'caf', name: 'CAF' },
  { id: 'afc', name: 'AFC' },
  { id: 'ofc', name: 'OFC' },
];

export const COUNTRIES = [
  { id: 'canada', code: 'CA', name: 'Canada', continentId: 'concacaf' },
  { id: 'mexico', code: 'MX', name: 'Mexico', continentId: 'concacaf' },
  { id: 'united-states', code: 'US', name: 'United States', continentId: 'concacaf' },
  { id: 'panama', code: 'PA', name: 'Panama', continentId: 'concacaf' },
  { id: 'curacao', code: 'CW', name: 'Curaçao', continentId: 'concacaf' },
  { id: 'haiti', code: 'HT', name: 'Haiti', continentId: 'concacaf' },

  { id: 'england', code: 'GB', name: 'England', continentId: 'uefa' },
  { id: 'france', code: 'FR', name: 'France', continentId: 'uefa' },
  { id: 'croatia', code: 'HR', name: 'Croatia', continentId: 'uefa' },
  { id: 'portugal', code: 'PT', name: 'Portugal', continentId: 'uefa' },
  { id: 'norway', code: 'NO', name: 'Norway', continentId: 'uefa' },
  { id: 'germany', code: 'DE', name: 'Germany', continentId: 'uefa' },
  { id: 'netherlands', code: 'NL', name: 'Netherlands', continentId: 'uefa' },
  { id: 'switzerland', code: 'CH', name: 'Switzerland', continentId: 'uefa' },
  { id: 'scotland', code: 'GB', name: 'Scotland', continentId: 'uefa' },
  { id: 'spain', code: 'ES', name: 'Spain', continentId: 'uefa' },
  { id: 'austria', code: 'AT', name: 'Austria', continentId: 'uefa' },
  { id: 'belgium', code: 'BE', name: 'Belgium', continentId: 'uefa' },
  { id: 'bosnia-and-herzegovina', code: 'BA', name: 'Bosnia and Herzegovina', continentId: 'uefa' },
  { id: 'sweden', code: 'SE', name: 'Sweden', continentId: 'uefa' },
  { id: 'turkey', code: 'TR', name: 'Turkey', continentId: 'uefa' },
  { id: 'czech-republic', code: 'CZ', name: 'Czech Republic', continentId: 'uefa' },

  { id: 'argentina', code: 'AR', name: 'Argentina', continentId: 'conmebol' },
  { id: 'ecuador', code: 'EC', name: 'Ecuador', continentId: 'conmebol' },
  { id: 'colombia', code: 'CO', name: 'Colombia', continentId: 'conmebol' },
  { id: 'uruguay', code: 'UY', name: 'Uruguay', continentId: 'conmebol' },
  { id: 'brazil', code: 'BR', name: 'Brazil', continentId: 'conmebol' },
  { id: 'paraguay', code: 'PY', name: 'Paraguay', continentId: 'conmebol' },

  { id: 'egypt', code: 'EG', name: 'Egypt', continentId: 'caf' },
  { id: 'senegal', code: 'SN', name: 'Senegal', continentId: 'caf' },
  { id: 'south-africa', code: 'ZA', name: 'South Africa', continentId: 'caf' },
  { id: 'cape-verde', code: 'CV', name: 'Cape Verde', continentId: 'caf' },
  { id: 'morocco', code: 'MA', name: 'Morocco', continentId: 'caf' },
  { id: 'ivory-coast', code: 'CI', name: 'Ivory Coast', continentId: 'caf' },
  { id: 'algeria', code: 'DZ', name: 'Algeria', continentId: 'caf' },
  { id: 'ghana', code: 'GH', name: 'Ghana', continentId: 'caf' },
  { id: 'tunisia', code: 'TN', name: 'Tunisia', continentId: 'caf' },
  { id: 'dr-congo', code: 'CD', name: 'DR Congo', continentId: 'caf' },

  { id: 'iran', code: 'IR', name: 'Iran', continentId: 'afc' },
  { id: 'japan', code: 'JP', name: 'Japan', continentId: 'afc' },
  { id: 'south-korea', code: 'KR', name: 'South Korea', continentId: 'afc' },
  { id: 'uzbekistan', code: 'UZ', name: 'Uzbekistan', continentId: 'afc' },
  { id: 'jordan', code: 'JO', name: 'Jordan', continentId: 'afc' },
  { id: 'qatar', code: 'QA', name: 'Qatar', continentId: 'afc' },
  { id: 'saudi-arabia', code: 'SA', name: 'Saudi Arabia', continentId: 'afc' },
  { id: 'australia', code: 'AU', name: 'Australia', continentId: 'afc' },
  { id: 'iraq', code: 'IQ', name: 'Iraq', continentId: 'afc' },

  { id: 'new-zealand', code: 'NZ', name: 'New Zealand', continentId: 'ofc' },
];

export function getContinentById(continentId) {
  return CONTINENTS.find((continent) => continent.id === continentId) || null;
}

export function getCountriesByContinent(continentId) {
  return COUNTRIES.filter((country) => country.continentId === continentId);
}

export function getCountryById(countryId) {
  return COUNTRIES.find((country) => country.id === countryId) || null;
}

export function getCountryFlagEmoji(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return '🏳️';
  return normalized
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}
