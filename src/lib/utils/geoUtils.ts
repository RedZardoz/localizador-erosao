import { ErosionPoint } from "@/types/erosion";

/**
 * Converts decimal degrees to DMS format (Graus, Minutos, Segundos)
 */
export function formatToDMS(coordinate: number, isLatitude: boolean): string {
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);

  let direction = "";
  if (isLatitude) {
    direction = coordinate >= 0 ? "N" : "S";
  } else {
    direction = coordinate >= 0 ? "E" : "W";
  }

  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

/**
 * Generates direct URL to open coordinate in Google Earth 3D Web
 */
export function getGoogleEarthWebUrl(lat: number, lng: number, elevation: number = 500): string {
  // Google Earth Web URL schema
  // @lat,lng,alt-in-meters,distance,pitch-in-degrees,heading-in-degrees
  return `https://earth.google.com/web/@${lat.toFixed(6)},${lng.toFixed(6)},${elevation}a,1500d,35y,60h,60t,0r`;
}

/**
 * Generates direct URL to open coordinate in Google Maps Satellite view
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}&layer=c`;
}

/**
 * Computes bounding box for an array of points
 */
export function calculatePointsBBox(points: ErosionPoint[]): [[number, number], [number, number]] | null {
  if (!points.length) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const pt of points) {
    if (pt.longitude < minLng) minLng = pt.longitude;
    if (pt.longitude > maxLng) maxLng = pt.longitude;
    if (pt.latitude < minLat) minLat = pt.latitude;
    if (pt.latitude > maxLat) maxLat = pt.latitude;
  }

  return [
    [minLng - 0.05, minLat - 0.05],
    [maxLng + 0.05, maxLat + 0.05],
  ];
}

/**
 * Checks if a 2D point [lng, lat] is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: [number, number], polygonCoords: number[][][]): boolean {
  const [x, y] = point;
  let inside = false;

  // Handles polygon exterior ring
  const ring = polygonCoords[0];
  if (!ring || ring.length < 3) return false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Checks if a point is inside a GeoJSON Polygon or MultiPolygon
 */
export function isPointInGeoJSON(lat: number, lng: number, geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): boolean {
  const point: [number, number] = [lng, lat];

  if (geometry.type === "Polygon") {
    return isPointInPolygon(point, geometry.coordinates);
  } else if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polyCoords) => isPointInPolygon(point, polyCoords));
  }

  return false;
}
