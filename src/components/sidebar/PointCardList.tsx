"use client";

import React from "react";
import {
  MapPin,
  ExternalLink,
  Compass,
  TrendingUp,
  Percent,
  Layers,
  ChevronRight,
  Flame,
} from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { ErosionPoint } from "@/types/erosion";
import { getGoogleEarthWebUrl } from "@/lib/utils/geoUtils";

export const PointCardList: React.FC = () => {
  const { getFilteredPoints, selectedPoint, flyToPoint } = useErosionStore();
  const points = getFilteredPoints();

  if (points.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
        <MapPin className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-300">Nenhum foco encontrado</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Ajuste os filtros de declividade, BSI ou bacia hidrográfica para visualizar os pontos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          Focos Selecionados ({points.length})
        </span>
        <span className="text-[11px] text-slate-500">Clique para voo 3D</span>
      </div>

      <div className="space-y-1.5 max-h-[calc(100vh-490px)] min-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {points.map((pt, idx) => {
          const isSelected = selectedPoint?.id === pt.id;

          const severityBadgeClass =
            pt.severity === "Crítica"
              ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40"
              : pt.severity === "Alta"
              ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
              : "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40";

          return (
            <div
              key={pt.id}
              onClick={() => flyToPoint(pt)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                isSelected
                  ? "bg-emerald-50/70 dark:bg-slate-800/95 border-emerald-500 shadow-md ring-1 ring-emerald-500"
                  : "bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
              }`}
            >
              {/* Card Top Row: Code, Municipality & Priority Score */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    #{idx + 1}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate max-w-[140px]">
                    {pt.municipality}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">({pt.code})</span>
                </div>

                {/* Priority Score badge */}
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${severityBadgeClass}`}
                  >
                    {pt.severity}
                  </span>
                  <span className="text-[10px] font-mono font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 px-1.5 py-0.5 rounded shadow-sm">
                    {pt.priorityScore} pts
                  </span>
                </div>
              </div>

              {/* Feature type & Watershed */}
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-2 truncate flex items-center gap-1.5">
                <span className="text-slate-800 dark:text-slate-300 font-medium">{pt.featureType}</span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-slate-600 dark:text-slate-400 truncate">{pt.watershed}</span>
              </div>

              {/* Stats pill row */}
              <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-mono">
                <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300/90 bg-amber-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-amber-200/50 dark:border-transparent">
                  <TrendingUp className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                  <span>{pt.slopePercent}%</span>
                </div>
                <div className="flex items-center gap-1 text-rose-700 dark:text-rose-300/90 bg-rose-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-rose-200/50 dark:border-transparent">
                  <Percent className="w-2.5 h-2.5 text-rose-500 dark:text-rose-400" />
                  <span>BSI {pt.bsi > 0 ? `+${pt.bsi}` : pt.bsi}</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-700 dark:text-cyan-300/90 bg-cyan-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-cyan-200/50 dark:border-transparent">
                  <Layers className="w-2.5 h-2.5 text-cyan-500 dark:text-cyan-400" />
                  <span>{pt.estimatedSoilLoss} t/ha</span>
                </div>
              </div>

              {/* Floating Action Button for Google Earth */}
              <div className="absolute right-2.5 bottom-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={getGoogleEarthWebUrl(pt.latitude, pt.longitude, pt.elevation)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-[10px] shadow-sm"
                  title="Abrir no Google Earth Web 3D"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
