"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { paranaBoundaryGeoJSON } from "@/data/paranaBoundary";
import { paranaBasinsGeoJSON } from "@/data/paranaBasins";
import { PointPopup } from "./PointPopup";
import { MapControls } from "./MapControls";
import { ErosionPoint } from "@/types/erosion";

export const MapViewer: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const {
    getFilteredPoints,
    selectedPoint,
    setSelectedPoint,
    activeAOIPolygon,
    mapState,
    activeRegion,
  } = useErosionStore();

  const filteredPoints = getFilteredPoints();

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Standard high-resolution satellite basemap with global DEM
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "esri-satellite": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Esri, Maxar, Earthstar Geographics",
          },
          "osm-topo": {
            type: "raster",
            tiles: [
              "https://tile.opentopomap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "OpenTopoMap, OpenStreetMap",
          },
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "CARTO, OpenStreetMap",
          },
          "terrain-dem": {
            type: "raster-dem",
            tiles: [
              "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
            ],
            encoding: "terrarium",
            tileSize: 256,
            maxzoom: 15,
          },
        },
        layers: [
          {
            id: "esri-satellite-layer",
            type: "raster",
            source: "esri-satellite",
            paint: { "raster-opacity": 1.0 },
          },
          {
            id: "osm-topo-layer",
            type: "raster",
            source: "osm-topo",
            paint: { "raster-opacity": 0.0 },
          },
          {
            id: "carto-dark-layer",
            type: "raster",
            source: "carto-dark",
            paint: { "raster-opacity": 0.0 },
          },
        ],
        sky: {
          "sky-color": "#0B0F17",
          "horizon-color": "#1E293B",
          "fog-color": "#0F172A",
        },
      },
      center: activeRegion.center,
      zoom: activeRegion.zoom,
      pitch: mapState.terrain3d ? 45 : 0,
      bearing: 0,
      maxPitch: 85,
    });

    // Add navigation and scale controls
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("load", () => {
      mapRef.current = map;

      // Enable 3D Terrain
      if (mapState.terrain3d) {
        map.setTerrain({
          source: "terrain-dem",
          exaggeration: mapState.terrainExaggeration,
        });
      }

      // Add Boundary and Basins layers
      map.addSource("parana-boundary", {
        type: "geojson",
        data: paranaBoundaryGeoJSON,
      });

      map.addLayer({
        id: "parana-boundary-line",
        type: "line",
        source: "parana-boundary",
        paint: {
          "line-color": "#10B981",
          "line-width": 2.5,
          "line-dasharray": [2, 1],
          "line-opacity": 0.8,
        },
      });

      map.addSource("parana-basins", {
        type: "geojson",
        data: paranaBasinsGeoJSON,
      });

      map.addLayer({
        id: "parana-basins-fill",
        type: "fill",
        source: "parana-basins",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.15,
        },
      });

      map.addLayer({
        id: "parana-basins-line",
        type: "line",
        source: "parana-basins",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1.5,
          "line-opacity": 0.6,
        },
      });

      // Add custom AOI Polygon source if exists
      map.addSource("custom-aoi", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "custom-aoi-fill",
        type: "fill",
        source: "custom-aoi",
        paint: {
          "fill-color": "#06B6D4",
          "fill-opacity": 0.25,
        },
      });

      map.addLayer({
        id: "custom-aoi-line",
        type: "line",
        source: "custom-aoi",
        paint: {
          "line-color": "#22D3EE",
          "line-width": 3,
          "line-dasharray": [3, 1],
        },
      });

      // Add Points GeoJSON Source
      map.addSource("erosion-points", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Heatmap Layer
      map.addLayer({
        id: "erosion-heatmap",
        type: "heatmap",
        source: "erosion-points",
        layout: {
          visibility: mapState.showHeatmap ? "visible" : "none",
        },
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "priorityScore"], 0, 0, 100, 1],
          "heatmap-intensity": 1.2,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0,0,0,0)",
            0.2,
            "#38BDF8",
            0.5,
            "#FACC15",
            0.8,
            "#F97316",
            1,
            "#EF4444",
          ],
          "heatmap-radius": 35,
          "heatmap-opacity": 0.8,
        },
      });

      // Point Circle Outer Glow Layer
      map.addLayer({
        id: "erosion-points-glow",
        type: "circle",
        source: "erosion-points",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            7,
            12,
            14,
            16,
            24,
          ],
          "circle-color": [
            "match",
            ["get", "severity"],
            "Crítica",
            "#EF4444",
            "Alta",
            "#F59E0B",
            "Moderada",
            "#EAB308",
            "#10B981",
          ],
          "circle-opacity": 0.35,
          "circle-blur": 0.6,
        },
      });

      // Point Circle Core Layer
      map.addLayer({
        id: "erosion-points-core",
        type: "circle",
        source: "erosion-points",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            4.5,
            12,
            7.5,
            16,
            11,
          ],
          "circle-color": [
            "match",
            ["get", "severity"],
            "Crítica",
            "#EF4444",
            "Alta",
            "#F59E0B",
            "Moderada",
            "#EAB308",
            "#10B981",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      // Click event on points
      map.on("click", "erosion-points-core", (e) => {
        if (!e.features || e.features.length === 0) return;
        const feat = e.features[0];
        const pointProps = feat.properties as any;

        const foundPoint = filteredPoints.find((p) => p.id === feat.id || p.id === pointProps.id);
        if (foundPoint) {
          setSelectedPoint(foundPoint);
        }
      });

      // Hover cursor
      map.on("mouseenter", "erosion-points-core", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "erosion-points-core", () => {
        map.getCanvas().style.cursor = "";
      });

      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Points GeoJSON Source when filtered points change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource("erosion-points") as maplibregl.GeoJSONSource;
    if (!source) return;

    const geojsonData: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: filteredPoints.map((p) => ({
        type: "Feature",
        id: p.id,
        properties: {
          id: p.id,
          code: p.code,
          name: p.name,
          municipality: p.municipality,
          severity: p.severity,
          slopePercent: p.slopePercent,
          bsi: p.bsi,
          priorityScore: p.priorityScore,
          elevation: p.elevation,
        },
        geometry: {
          type: "Point",
          coordinates: [p.longitude, p.latitude, p.elevation],
        },
      })),
    };

    source.setData(geojsonData);
  }, [filteredPoints, mapLoaded]);

  // Update AOI Polygon source
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource("custom-aoi") as maplibregl.GeoJSONSource;
    if (!source) return;

    if (activeAOIPolygon) {
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: activeAOIPolygon.id,
            properties: { name: activeAOIPolygon.name },
            geometry: activeAOIPolygon.geometry,
          },
        ],
      });
    } else {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  }, [activeAOIPolygon, mapLoaded]);

  // Update Basemap Opacity
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const satOpacity = mapState.basemap === "satellite" || mapState.basemap === "hybrid" ? 1.0 : 0.0;
    const topoOpacity = mapState.basemap === "topo" ? 1.0 : 0.0;
    const darkOpacity = mapState.basemap === "dark" ? 1.0 : 0.0;

    if (map.getLayer("esri-satellite-layer")) {
      map.setPaintProperty("esri-satellite-layer", "raster-opacity", satOpacity);
    }
    if (map.getLayer("osm-topo-layer")) {
      map.setPaintProperty("osm-topo-layer", "raster-opacity", topoOpacity);
    }
    if (map.getLayer("carto-dark-layer")) {
      map.setPaintProperty("carto-dark-layer", "raster-opacity", darkOpacity);
    }
  }, [mapState.basemap, mapLoaded]);

  // Update Layers Visibility
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (map.getLayer("parana-boundary-line")) {
      map.setLayoutProperty("parana-boundary-line", "visibility", mapState.showBoundary ? "visible" : "none");
    }
    if (map.getLayer("parana-basins-fill")) {
      map.setLayoutProperty("parana-basins-fill", "visibility", mapState.showBasins ? "visible" : "none");
      map.setLayoutProperty("parana-basins-line", "visibility", mapState.showBasins ? "visible" : "none");
    }
    if (map.getLayer("erosion-heatmap")) {
      map.setLayoutProperty("erosion-heatmap", "visibility", mapState.showHeatmap ? "visible" : "none");
    }
  }, [mapState.showBoundary, mapState.showBasins, mapState.showHeatmap, mapLoaded]);

  // Update 3D Terrain & Exaggeration
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    if (mapState.terrain3d) {
      map.setTerrain({
        source: "terrain-dem",
        exaggeration: mapState.terrainExaggeration,
      });
    } else {
      map.setTerrain(null as any);
    }
  }, [mapState.terrain3d, mapState.terrainExaggeration, mapLoaded]);

  // Handle Fly-To camera movements
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !mapState.flyToTarget) return;

    const { lng, lat, zoom, pitch, bearing } = mapState.flyToTarget;

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: zoom ?? 14,
      pitch: pitch ?? 60,
      bearing: bearing ?? 0,
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [mapState.flyToTarget, mapLoaded]);

  return (
    <div className="relative w-full h-full flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Overlays & Controls */}
      <MapControls />

      {/* Floating Inspector Popup when point is selected */}
      {selectedPoint && (
        <PointPopup point={selectedPoint} onClose={() => setSelectedPoint(null)} />
      )}
    </div>
  );
};
