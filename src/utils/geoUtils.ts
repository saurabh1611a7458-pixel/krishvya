/**
 * Geographical & Precision Agronomy Utility Functions
 */

/**
 * Calculates geodesic polygon area in acres from an array of [lat, lon] coordinates
 * Uses spherical Shoelace formula on Earth radius (6,378,137m)
 */
export function calculatePolygonAreaAcres(vertices: Array<[number, number]>): number {
  if (!vertices || vertices.length < 3) return 0;

  const R = 6378137; // Earth radius in meters
  const n = vertices.length;
  let totalAreaSqMeters = 0;

  // Use average latitude for longitude scaling
  let avgLat = 0;
  for (let i = 0; i < n; i++) {
    avgLat += vertices[i][0];
  }
  avgLat = (avgLat / n) * (Math.PI / 180);

  // Convert each coordinate to projected planar meters
  const points = vertices.map(([lat, lon]) => {
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    const x = lonRad * R * Math.cos(avgLat);
    const y = latRad * R;
    return { x, y };
  });

  // Shoelace formula
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    totalAreaSqMeters += points[i].x * points[j].y;
    totalAreaSqMeters -= points[j].x * points[i].y;
  }

  totalAreaSqMeters = Math.abs(totalAreaSqMeters) / 2;

  // 1 Acre = 4046.8564224 square meters
  const acres = totalAreaSqMeters / 4046.8564224;
  return parseFloat(acres.toFixed(2));
}

/**
 * Calculates the geographic centroid [lat, lon] of a polygon
 */
export function calculateCentroid(vertices: Array<[number, number]>): [number, number] {
  if (!vertices || vertices.length === 0) return [0, 0];

  let sumLat = 0;
  let sumLon = 0;
  const count = vertices.length;

  for (const [lat, lon] of vertices) {
    sumLat += lat;
    sumLon += lon;
  }

  return [
    parseFloat((sumLat / count).toFixed(6)),
    parseFloat((sumLon / count).toFixed(6)),
  ];
}

/**
 * Generates an initial balanced 4-corner field boundary around a centroid
 */
export function generateDefaultBoundary(
  centerLat: number,
  centerLon: number,
  acres: number = 2.5
): Array<[number, number]> {
  // Approximate delta in degrees for a square lot matching target acreage
  // 1 acre is approx 63.6m x 63.6m => sqrt(acres * 4047)
  const sideMeters = Math.sqrt(Math.max(0.5, acres) * 4047);
  const dLat = sideMeters / 111320 / 2;
  const dLon = sideMeters / (111320 * Math.cos((centerLat * Math.PI) / 180)) / 2;

  return [
    [parseFloat((centerLat - dLat * 0.95).toFixed(6)), parseFloat((centerLon - dLon * 0.9).toFixed(6))],
    [parseFloat((centerLat + dLat * 1.05).toFixed(6)), parseFloat((centerLon - dLon * 0.85).toFixed(6))],
    [parseFloat((centerLat + dLat * 0.95).toFixed(6)), parseFloat((centerLon + dLon * 1.05).toFixed(6))],
    [parseFloat((centerLat - dLat * 1.05).toFixed(6)), parseFloat((centerLon + dLon * 0.95).toFixed(6))],
  ];
}
