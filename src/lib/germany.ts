// Curated German geography for the readiness map. Pure data (server + client).
// Region codes match the ids in public/germany-states.geojson (ISO 3166-2 DE).

export interface City {
  name: string;
  regionCode: string;
  lat: number;
  lng: number;
}

export const REGIONS: { code: string; name: string }[] = [
  { code: "DE-BW", name: "Baden-Württemberg" },
  { code: "DE-BY", name: "Bayern" },
  { code: "DE-BE", name: "Berlin" },
  { code: "DE-BB", name: "Brandenburg" },
  { code: "DE-HB", name: "Bremen" },
  { code: "DE-HH", name: "Hamburg" },
  { code: "DE-HE", name: "Hessen" },
  { code: "DE-MV", name: "Mecklenburg-Vorpommern" },
  { code: "DE-NI", name: "Niedersachsen" },
  { code: "DE-NW", name: "Nordrhein-Westfalen" },
  { code: "DE-RP", name: "Rheinland-Pfalz" },
  { code: "DE-SL", name: "Saarland" },
  { code: "DE-ST", name: "Sachsen-Anhalt" },
  { code: "DE-SN", name: "Sachsen" },
  { code: "DE-SH", name: "Schleswig-Holstein" },
  { code: "DE-TH", name: "Thüringen" },
];

export function regionName(code: string | null | undefined): string {
  return REGIONS.find((r) => r.code === code)?.name ?? code ?? "—";
}

// Major cities with coordinates, at least one per region.
export const CITIES: City[] = [
  { name: "Berlin", regionCode: "DE-BE", lat: 52.52, lng: 13.405 },
  { name: "Hamburg", regionCode: "DE-HH", lat: 53.551, lng: 9.993 },
  { name: "München", regionCode: "DE-BY", lat: 48.137, lng: 11.575 },
  { name: "Nürnberg", regionCode: "DE-BY", lat: 49.452, lng: 11.077 },
  { name: "Augsburg", regionCode: "DE-BY", lat: 48.37, lng: 10.897 },
  { name: "Köln", regionCode: "DE-NW", lat: 50.937, lng: 6.96 },
  { name: "Düsseldorf", regionCode: "DE-NW", lat: 51.227, lng: 6.773 },
  { name: "Dortmund", regionCode: "DE-NW", lat: 51.514, lng: 7.466 },
  { name: "Essen", regionCode: "DE-NW", lat: 51.456, lng: 7.012 },
  { name: "Bonn", regionCode: "DE-NW", lat: 50.737, lng: 7.098 },
  { name: "Bielefeld", regionCode: "DE-NW", lat: 52.03, lng: 8.532 },
  { name: "Frankfurt am Main", regionCode: "DE-HE", lat: 50.11, lng: 8.682 },
  { name: "Wiesbaden", regionCode: "DE-HE", lat: 50.078, lng: 8.24 },
  { name: "Stuttgart", regionCode: "DE-BW", lat: 48.776, lng: 9.182 },
  { name: "Karlsruhe", regionCode: "DE-BW", lat: 49.007, lng: 8.404 },
  { name: "Mannheim", regionCode: "DE-BW", lat: 49.487, lng: 8.466 },
  { name: "Freiburg", regionCode: "DE-BW", lat: 47.999, lng: 7.842 },
  { name: "Bremen", regionCode: "DE-HB", lat: 53.079, lng: 8.802 },
  { name: "Hannover", regionCode: "DE-NI", lat: 52.376, lng: 9.732 },
  { name: "Braunschweig", regionCode: "DE-NI", lat: 52.268, lng: 10.526 },
  { name: "Osnabrück", regionCode: "DE-NI", lat: 52.279, lng: 8.047 },
  { name: "Leipzig", regionCode: "DE-SN", lat: 51.34, lng: 12.375 },
  { name: "Dresden", regionCode: "DE-SN", lat: 51.05, lng: 13.737 },
  { name: "Chemnitz", regionCode: "DE-SN", lat: 50.832, lng: 12.924 },
  { name: "Erfurt", regionCode: "DE-TH", lat: 50.984, lng: 11.029 },
  { name: "Jena", regionCode: "DE-TH", lat: 50.927, lng: 11.589 },
  { name: "Magdeburg", regionCode: "DE-ST", lat: 52.12, lng: 11.627 },
  { name: "Halle (Saale)", regionCode: "DE-ST", lat: 51.482, lng: 11.97 },
  { name: "Kiel", regionCode: "DE-SH", lat: 54.323, lng: 10.135 },
  { name: "Lübeck", regionCode: "DE-SH", lat: 53.866, lng: 10.685 },
  { name: "Rostock", regionCode: "DE-MV", lat: 54.092, lng: 12.099 },
  { name: "Schwerin", regionCode: "DE-MV", lat: 53.636, lng: 11.401 },
  { name: "Potsdam", regionCode: "DE-BB", lat: 52.391, lng: 13.064 },
  { name: "Cottbus", regionCode: "DE-BB", lat: 51.76, lng: 14.334 },
  { name: "Mainz", regionCode: "DE-RP", lat: 49.992, lng: 8.247 },
  { name: "Koblenz", regionCode: "DE-RP", lat: 50.356, lng: 7.589 },
  { name: "Trier", regionCode: "DE-RP", lat: 49.75, lng: 6.637 },
  { name: "Saarbrücken", regionCode: "DE-SL", lat: 49.24, lng: 6.997 },
];

// Readiness → colour ramp (red → amber → mint → brand). null = no data (grey).
const STOPS: [number, [number, number, number]][] = [
  [0, [244, 167, 167]],
  [35, [255, 206, 107]],
  [65, [95, 224, 192]],
  [100, [109, 93, 246]],
];

export const NO_DATA_COLOR = "#e7e7ef";

export function readinessColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return NO_DATA_COLOR;
  const v = Math.max(0, Math.min(100, value));
  let lo = STOPS[0];
  let hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (v >= STOPS[i][0] && v <= STOPS[i + 1][0]) {
      lo = STOPS[i];
      hi = STOPS[i + 1];
      break;
    }
  }
  const t = hi[0] === lo[0] ? 0 : (v - lo[0]) / (hi[0] - lo[0]);
  const c = [0, 1, 2].map((k) => Math.round(lo[1][k] + (hi[1][k] - lo[1][k]) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}
