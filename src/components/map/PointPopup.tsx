"use client";

import React from "react";
import {
  X,
  ExternalLink,
  MapPin,
  TrendingUp,
  Percent,
  Layers,
  Calendar,
  Compass,
  Mountain,
  Globe,
  Share2,
} from "lucide-react";
import { ErosionPoint } from "@/types/erosion";
import { formatToDMS, getGoogleEarthWebUrl, getGoogleMapsUrl } from "@/lib/utils/geoUtils";

interface PointPopupProps {
  point: ErosionPoint;
  onClose: () => void;
}

export const PointPopup: React.FC<PointPopupProps> = ({ point, onClose }) => {
  const dmsLat = formatToDMS(point.latitude, true);
  const dmsLng = formatToDMS(point.longitude, false);

  const severityColor =
    point.severity === "Crítica"
      ? "text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-600/50"
      : point.severity === "Alta"
      ? "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-600/50"
      : "text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950/60 border-yellow-300 dark:border-yellow-600/50";

  return (
    <div className="absolute top-4 right-4 z-20 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 transition-colors">
      {/* Header Banner */}
      <div className="p-4 bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-850 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700/80 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${severityColor}`}>
              {point.severity}
            </span>
            <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {point.code}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{point.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {point.municipality} • {point.state} ({point.macroRegion})
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Fechar Detalhes"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-4 space-y-3.5 max-h-[70vh] overflow-y-auto custom-scrollbar">
        {/* Coordinates Section: Decimal + DMS */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Posicionamento Geográfico (WGS84 EPSG:4326)
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">Graus Decimais (DD):</span>
              <span className="text-slate-800 dark:text-slate-200">
                {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Altitude Estimada:</span>
              <span className="text-slate-800 dark:text-slate-200">{point.elevation} metros</span>
            </div>
          </div>
          <div className="pt-1 border-t border-slate-200 dark:border-slate-850 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
            {dmsLat}, {dmsLng}
          </div>
        </div>

        {/* 2x2 Grid of Key Environmental Metrics */}
        <div className="grid grid-cols-2 gap-2">
          {/* Slope */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              Declividade
            </span>
            <div className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
              {point.slopePercent}% ({point.slopeDegrees}°)
            </div>
          </div>

          {/* BSI */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Percent className="w-3 h-3 text-rose-500 dark:text-rose-400" />
              Índice BSI
            </span>
            <div className="text-base font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
              {point.bsi > 0 ? `+${point.bsi}` : point.bsi}
            </div>
          </div>

          {/* Soil Loss */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              Perda Estimada
            </span>
            <div className="text-base font-bold text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
              {point.estimatedSoilLoss} t/ha/ano
            </div>
          </div>

          {/* Priority Score */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              Score de Prioridade
            </span>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {point.priorityScore} / 100
            </div>
          </div>
        </div>

        {/* Detailed Soil & Watershed Data */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Bacia Hidrográfica:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{point.watershed}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Tipo de Feição:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{point.featureType}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Classificação Pedológica (Solo):</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-[190px] truncate">
              {point.soilType}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Data de Mapeamento:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{point.detectionDate}</span>
          </div>
        </div>

        {/* Notes */}
        {point.notes && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs text-slate-700 dark:text-slate-300 italic border border-slate-200 dark:border-slate-800">
            &ldquo;{point.notes}&rdquo;
          </div>
        )}

        {/* Action Buttons: Google Earth & Google Maps */}
        <div className="pt-2 grid grid-cols-2 gap-2">
          <a
            href={getGoogleEarthWebUrl(point.latitude, point.longitude, point.elevation)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            <Globe className="w-3.5 h-3.5" />
            Google Earth Web
            <ExternalLink className="w-3 h-3" />
          </a>

          <a
            href={getGoogleMapsUrl(point.latitude, point.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Google Maps
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
