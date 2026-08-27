import { AOIPolygon, ErosionPoint } from "@/types/erosion";
import { formatToDMS } from "./geoUtils";

/**
 * Exports points to GeoJSON FeatureCollection
 */
export function exportToGeoJSON(points: ErosionPoint[], aoiPolygon?: AOIPolygon | null): string {
  const features: GeoJSON.Feature[] = points.map((p) => ({
    type: "Feature",
    id: p.id,
    properties: {
      code: p.code,
      name: p.name,
      municipality: p.municipality,
      state: p.state,
      macroRegion: p.macroRegion,
      watershed: p.watershed,
      slopePercent: p.slopePercent,
      slopeDegrees: p.slopeDegrees,
      bsi: p.bsi,
      ndvi: p.ndvi,
      soilType: p.soilType,
      featureType: p.featureType,
      severity: p.severity,
      estimatedSoilLoss_t_ha_ano: p.estimatedSoilLoss,
      priorityScore: p.priorityScore,
      elevation_m: p.elevation,
      detectionDate: p.detectionDate,
      notes: p.notes,
    },
    geometry: {
      type: "Point",
      coordinates: [p.longitude, p.latitude, p.elevation],
    },
  }));

  if (aoiPolygon) {
    features.unshift({
      type: "Feature",
      id: aoiPolygon.id,
      properties: {
        name: aoiPolygon.name,
        type: "Area_of_Interest_AOI",
        importedAt: aoiPolygon.importedAt,
      },
      geometry: aoiPolygon.geometry,
    });
  }

  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features,
  };

  return JSON.stringify(collection, null, 2);
}

/**
 * Exports points to standard styled KML for Google Earth
 */
export function exportToKML(points: ErosionPoint[], title: string = "Triagem de Erosao Parana"): string {
  const placemarks = points
    .map((p) => {
      const styleId = p.severity === "Crítica" ? "critica" : p.severity === "Alta" ? "alta" : "moderada";
      const dmsLat = formatToDMS(p.latitude, true);
      const dmsLng = formatToDMS(p.longitude, false);

      return `
    <Placemark id="${p.id}">
      <name>${escapeXml(p.name)}</name>
      <styleUrl>#${styleId}</styleUrl>
      <description><![CDATA[
        <h3>${escapeXml(p.name)} (${p.code})</h3>
        <table border="1" cellpadding="4" cellspacing="0" style="font-family:sans-serif;font-size:12px;">
          <tr><td><b>Severidade:</b></td><td style="color:${p.severity === "Crítica" ? "#dc2626" : p.severity === "Alta" ? "#ea580c" : "#ca8a04"}"><b>${p.severity}</b></td></tr>
          <tr><td><b>Score de Prioridade:</b></td><td>${p.priorityScore}/100</td></tr>
          <tr><td><b>Município:</b></td><td>${escapeXml(p.municipality)} (${p.state})</td></tr>
          <tr><td><b>Bacia Hidrográfica:</b></td><td>${escapeXml(p.watershed)}</td></tr>
          <tr><td><b>Declividade:</b></td><td>${p.slopePercent}% (${p.slopeDegrees}°)</td></tr>
          <tr><td><b>Índice BSI (Solo Exposto):</b></td><td>${p.bsi}</td></tr>
          <tr><td><b>NDVI (Vegetação):</b></td><td>${p.ndvi}</td></tr>
          <tr><td><b>Tipo de Feição:</b></td><td>${escapeXml(p.featureType)}</td></tr>
          <tr><td><b>Tipo de Solo:</b></td><td>${escapeXml(p.soilType)}</td></tr>
          <tr><td><b>Perda Estimada:</b></td><td>${p.estimatedSoilLoss} t/ha/ano</td></tr>
          <tr><td><b>Altitude:</b></td><td>${p.elevation} m</td></tr>
          <tr><td><b>Coordenadas DMS:</b></td><td>${dmsLat}, ${dmsLng}</td></tr>
          <tr><td><b>Data Detecção:</b></td><td>${p.detectionDate}</td></tr>
        </table>
        <p><i>${escapeXml(p.notes || "")}</i></p>
      ]]></description>
      <ExtendedData>
        <Data name="id"><value>${p.id}</value></Data>
        <Data name="severity"><value>${p.severity}</value></Data>
        <Data name="slopePercent"><value>${p.slopePercent}</value></Data>
        <Data name="bsi"><value>${p.bsi}</value></Data>
        <Data name="priorityScore"><value>${p.priorityScore}</value></Data>
      </ExtendedData>
      <Point>
        <coordinates>${p.longitude},${p.latitude},${p.elevation}</coordinates>
      </Point>
    </Placemark>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(title)}</name>
    <open>1</open>
    
    <!-- Styles for Severity Levels -->
    <Style id="critica">
      <IconStyle>
        <color>ff0000ff</color>
        <scale>1.2</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="alta">
      <IconStyle>
        <color>ff00a5ff</color>
        <scale>1.1</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/paddle/orange-circle.png</href></Icon>
      </IconStyle>
    </Style>
    <Style id="moderada">
      <IconStyle>
        <color>ff00ffff</color>
        <scale>1.0</scale>
        <Icon><href>http://maps.google.com/mapfiles/kml/paddle/ylw-circle.png</href></Icon>
      </IconStyle>
    </Style>

    <Folder>
      <name>Focos de Erosão Triados</name>
      ${placemarks}
    </Folder>
  </Document>
</kml>`;
}

/**
 * Exports points to CSV with complete columns
 */
export function exportToCSV(points: ErosionPoint[]): string {
  const headers = [
    "ID",
    "Codigo",
    "Nome",
    "Latitude",
    "Longitude",
    "Latitude_DMS",
    "Longitude_DMS",
    "Altitude_m",
    "Declividade_pct",
    "Declividade_graus",
    "Indice_BSI",
    "Indice_NDVI",
    "Severidade",
    "Prioridade_Score",
    "Municipio",
    "Estado",
    "Regiao",
    "Bacia_Hidrografica",
    "Tipo_Feicao",
    "Tipo_Solo",
    "Perda_Solo_t_ha_ano",
    "Data_Deteccao",
    "Notas",
  ];

  const rows = points.map((p) => [
    `"${p.id}"`,
    `"${p.code}"`,
    `"${p.name.replace(/"/g, '""')}"`,
    p.latitude.toFixed(6),
    p.longitude.toFixed(6),
    `"${formatToDMS(p.latitude, true)}"`,
    `"${formatToDMS(p.longitude, false)}"`,
    p.elevation,
    p.slopePercent,
    p.slopeDegrees,
    p.bsi,
    p.ndvi,
    `"${p.severity}"`,
    p.priorityScore,
    `"${p.municipality.replace(/"/g, '""')}"`,
    `"${p.state}"`,
    `"${p.macroRegion}"`,
    `"${p.watershed.replace(/"/g, '""')}"`,
    `"${p.featureType.replace(/"/g, '""')}"`,
    `"${p.soilType.replace(/"/g, '""')}"`,
    p.estimatedSoilLoss,
    `"${p.detectionDate}"`,
    `"${(p.notes || "").replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

/**
 * Triggers browser file download
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
