import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AOIPolygon,
  ErosionPoint,
  FilterState,
  GcpCredentials,
  NewRegionRequest,
  RegionPreset,
  SeverityLevel,
} from "@/types/erosion";
import { mockErosionPoints } from "@/data/mockErosionPoints";
import { regionPresets } from "@/data/regionsData";
import { isPointInGeoJSON } from "../utils/geoUtils";

export type ModalType = "settings" | "region" | "export" | null;
export type BasemapType = "satellite" | "topo" | "dark" | "hybrid";

interface MapViewState {
  basemap: BasemapType;
  terrain3d: boolean;
  terrainExaggeration: number;
  showBasins: boolean;
  showBoundary: boolean;
  showHeatmap: boolean;
  flyToTarget: {
    lat: number;
    lng: number;
    zoom?: number;
    pitch?: number;
    bearing?: number;
    elevation?: number;
  } | null;
}

interface ErosionStoreState {
  // Data
  allPoints: ErosionPoint[];
  dataSource: "mock" | "custom";
  customPoints: ErosionPoint[];
  selectedPoint: ErosionPoint | null;
  activeRegion: RegionPreset;
  activeAOIPolygon: AOIPolygon | null;
  regionRequests: NewRegionRequest[];

  // Filters
  filters: FilterState;

  // Map & Visualization
  mapState: MapViewState;

  // Credentials
  gcpCredentials: GcpCredentials | null;
  mapboxToken: string;
  googleMapsKey: string;
  credentialPersistMode: "session" | "local";

  // UI Modals & Theme
  activeModal: ModalType;
  sidebarCollapsed: boolean;
  theme: "dark" | "light";

  // Actions
  setDataSource: (source: "mock" | "custom") => void;
  setCustomPoints: (points: ErosionPoint[]) => void;
  setSelectedPoint: (point: ErosionPoint | null) => void;
  setActiveRegion: (regionId: string) => void;
  setActiveAOIPolygon: (polygon: AOIPolygon | null) => void;
  addRegionRequest: (request: NewRegionRequest) => void;

  // Theme actions
  setTheme: (theme: "dark" | "light") => void;
  toggleTheme: () => void;

  // Filter actions
  setSearchQuery: (query: string) => void;
  setSlopeRange: (min: number, max: number) => void;
  setBsiRange: (min: number, max: number) => void;
  toggleSeverity: (severity: SeverityLevel) => void;
  toggleWatershed: (watershed: string) => void;
  setTopN: (topN: number) => void;
  setSorting: (sortBy: FilterState["sortBy"], order?: FilterState["sortOrder"]) => void;
  resetFilters: () => void;

  // Map actions
  setBasemap: (basemap: BasemapType) => void;
  toggleTerrain3D: () => void;
  setTerrainExaggeration: (exaggeration: number) => void;
  toggleLayer: (layer: "showBasins" | "showBoundary" | "showHeatmap") => void;
  flyToLocation: (target: MapViewState["flyToTarget"]) => void;
  flyToPoint: (point: ErosionPoint) => void;

  // Credentials actions
  setGcpCredentials: (creds: GcpCredentials | null) => void;
  setMapboxToken: (token: string) => void;
  setGoogleMapsKey: (key: string) => void;
  setCredentialPersistMode: (mode: "session" | "local") => void;

  // UI actions
  setActiveModal: (modal: ModalType) => void;
  toggleSidebar: () => void;

  // Computed helper
  getFilteredPoints: () => ErosionPoint[];
}

const initialFilters: FilterState = {
  searchQuery: "",
  minSlope: 0,
  maxSlope: 100,
  minBsi: -1.0,
  maxBsi: 1.0,
  selectedSeverities: ["Moderada", "Alta", "Crítica"],
  selectedWatersheds: [],
  selectedSoilTypes: [],
  selectedFeatureTypes: [],
  topN: 150, // Default to top 150 / all
  sortBy: "priority",
  sortOrder: "desc",
};

export const useErosionStore = create<ErosionStoreState>()(
  persist(
    (set, get) => ({
      // Data state
      allPoints: mockErosionPoints,
      dataSource: "mock",
      customPoints: [],
      selectedPoint: null,
      activeRegion: regionPresets[0],
      activeAOIPolygon: null,
      regionRequests: [],

      // Filters
      filters: initialFilters,

      // Map View
      mapState: {
        basemap: "satellite",
        terrain3d: true,
        terrainExaggeration: 1.5,
        showBasins: true,
        showBoundary: true,
        showHeatmap: false,
        flyToTarget: null,
      },

      // Credentials
      gcpCredentials: null,
      mapboxToken: "",
      googleMapsKey: "",
      credentialPersistMode: "local",

      // UI
      activeModal: null,
      sidebarCollapsed: false,
      theme: "dark",

      // Actions
      setDataSource: (source) =>
        set((state) => ({
          dataSource: source,
          allPoints: source === "mock" ? mockErosionPoints : state.customPoints,
          selectedPoint: null,
        })),

      setCustomPoints: (points) =>
        set({
          customPoints: points,
          allPoints: points,
          dataSource: "custom",
          selectedPoint: null,
        }),

      setSelectedPoint: (point) => set({ selectedPoint: point }),

      setActiveRegion: (regionId) => {
        const found = regionPresets.find((r) => r.id === regionId);
        if (found) {
          set((state) => ({
            activeRegion: found,
            mapState: {
              ...state.mapState,
              flyToTarget: {
                lng: found.center[0],
                lat: found.center[1],
                zoom: found.zoom,
                pitch: found.pitch ?? 45,
                bearing: found.bearing ?? 0,
              },
            },
          }));
        }
      },

      setActiveAOIPolygon: (polygon) => set({ activeAOIPolygon: polygon }),

      addRegionRequest: (request) =>
        set((state) => ({
          regionRequests: [request, ...state.regionRequests],
        })),

      // Filter actions
      setSearchQuery: (query) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        })),

      setSlopeRange: (min, max) =>
        set((state) => ({
          filters: { ...state.filters, minSlope: min, maxSlope: max },
        })),

      setBsiRange: (min, max) =>
        set((state) => ({
          filters: { ...state.filters, minBsi: min, maxBsi: max },
        })),

      toggleSeverity: (sev) =>
        set((state) => {
          const current = state.filters.selectedSeverities;
          const updated = current.includes(sev)
            ? current.filter((s) => s !== sev)
            : [...current, sev];
          return {
            filters: { ...state.filters, selectedSeverities: updated },
          };
        }),

      toggleWatershed: (w) =>
        set((state) => {
          const current = state.filters.selectedWatersheds;
          const updated = current.includes(w)
            ? current.filter((item) => item !== w)
            : [...current, w];
          return {
            filters: { ...state.filters, selectedWatersheds: updated },
          };
        }),

      setTopN: (topN) =>
        set((state) => ({
          filters: { ...state.filters, topN },
        })),

      setSorting: (sortBy, order) =>
        set((state) => ({
          filters: {
            ...state.filters,
            sortBy,
            sortOrder: order || (state.filters.sortBy === sortBy && state.filters.sortOrder === "desc" ? "asc" : "desc"),
          },
        })),

      resetFilters: () =>
        set({
          filters: initialFilters,
          activeAOIPolygon: null,
        }),

      // Map actions
      setBasemap: (basemap) =>
        set((state) => ({
          mapState: { ...state.mapState, basemap },
        })),

      toggleTerrain3D: () =>
        set((state) => ({
          mapState: { ...state.mapState, terrain3d: !state.mapState.terrain3d },
        })),

      setTerrainExaggeration: (exaggeration) =>
        set((state) => ({
          mapState: { ...state.mapState, terrainExaggeration: exaggeration },
        })),

      toggleLayer: (layer) =>
        set((state) => ({
          mapState: { ...state.mapState, [layer]: !state.mapState[layer] },
        })),

      flyToLocation: (target) =>
        set((state) => ({
          mapState: { ...state.mapState, flyToTarget: target },
        })),

      flyToPoint: (point) =>
        set((state) => ({
          selectedPoint: point,
          mapState: {
            ...state.mapState,
            flyToTarget: {
              lng: point.longitude,
              lat: point.latitude,
              zoom: 15.5,
              pitch: 62,
              bearing: -20,
              elevation: point.elevation,
            },
          },
        })),

      // Credentials
      setGcpCredentials: (creds) => set({ gcpCredentials: creds }),
      setMapboxToken: (token) => set({ mapboxToken: token }),
      setGoogleMapsKey: (key) => set({ googleMapsKey: key }),
      setCredentialPersistMode: (mode) => set({ credentialPersistMode: mode }),

      // UI
      setActiveModal: (modal) => set({ activeModal: modal }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

      // Filtering logic
      getFilteredPoints: () => {
        const { allPoints, filters, activeAOIPolygon } = get();

        let result = allPoints.filter((pt) => {
          // Search query (id, name, municipality, watershed, soil)
          if (filters.searchQuery.trim()) {
            const q = filters.searchQuery.toLowerCase();
            const match =
              pt.name.toLowerCase().includes(q) ||
              pt.code.toLowerCase().includes(q) ||
              pt.municipality.toLowerCase().includes(q) ||
              pt.watershed.toLowerCase().includes(q) ||
              pt.soilType.toLowerCase().includes(q) ||
              pt.featureType.toLowerCase().includes(q);
            if (!match) return false;
          }

          // Slope (%)
          if (pt.slopePercent < filters.minSlope || pt.slopePercent > filters.maxSlope) {
            return false;
          }

          // BSI (-1 to 1)
          if (pt.bsi < filters.minBsi || pt.bsi > filters.maxBsi) {
            return false;
          }

          // Severity
          if (filters.selectedSeverities.length > 0 && !filters.selectedSeverities.includes(pt.severity)) {
            return false;
          }

          // Watershed
          if (filters.selectedWatersheds.length > 0 && !filters.selectedWatersheds.includes(pt.watershed)) {
            return false;
          }

          // Spatial clip inside active AOI polygon if one is loaded
          if (activeAOIPolygon) {
            const inside = isPointInGeoJSON(pt.latitude, pt.longitude, activeAOIPolygon.geometry);
            if (!inside) return false;
          }

          return true;
        });

        // Sorting
        result.sort((a, b) => {
          let comparison = 0;
          switch (filters.sortBy) {
            case "priority":
              comparison = a.priorityScore - b.priorityScore;
              break;
            case "bsi":
              comparison = a.bsi - b.bsi;
              break;
            case "slope":
              comparison = a.slopePercent - b.slopePercent;
              break;
            case "soilLoss":
              comparison = a.estimatedSoilLoss - b.estimatedSoilLoss;
              break;
            case "municipality":
              comparison = a.municipality.localeCompare(b.municipality);
              break;
            default:
              comparison = a.priorityScore - b.priorityScore;
          }
          return filters.sortOrder === "desc" ? -comparison : comparison;
        });

        // Limit to Top N if set (> 0)
        if (filters.topN > 0 && result.length > filters.topN) {
          result = result.slice(0, filters.topN);
        }

        return result;
      },
    }),
    {
      name: "localizador-erosao-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        gcpCredentials: state.credentialPersistMode === "local" ? state.gcpCredentials : null,
        mapboxToken: state.credentialPersistMode === "local" ? state.mapboxToken : "",
        googleMapsKey: state.credentialPersistMode === "local" ? state.googleMapsKey : "",
        credentialPersistMode: state.credentialPersistMode,
        regionRequests: state.regionRequests,
        theme: state.theme,
        mapState: {
          basemap: state.mapState.basemap,
          terrain3d: state.mapState.terrain3d,
          terrainExaggeration: state.mapState.terrainExaggeration,
          showBasins: state.mapState.showBasins,
          showBoundary: state.mapState.showBoundary,
          showHeatmap: state.mapState.showHeatmap,
          flyToTarget: null,
        },
      }),
    }
  )
);
