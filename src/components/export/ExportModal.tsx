"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  FileCode,
  Globe,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useErosionStore } from "@/lib/store/useErosionStore";
import {
  downloadFile,
  exportToCSV,
  exportToGeoJSON,
  exportToKML,
} from "@/lib/utils/exportUtils";

export const ExportModal: React.FC = () => {
  const { activeModal, setActiveModal, getFilteredPoints, activeAOIPolygon, activeRegion } =
    useErosionStore();

  const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);

  if (activeModal !== "export") return null;

  const points = getFilteredPoints();

  const handleExport = (format: "geojson" | "kml" | "csv" | "print") => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const baseName = `triagem_erosao_${activeRegion.state.toLowerCase()}_${points.length}_focos_${timestamp}`;

    if (format === "geojson") {
      const content = exportToGeoJSON(points, activeAOIPolygon);
      downloadFile(content, `${baseName}.geojson`, "application/geo+json");
    } else if (format === "kml") {
      const content = exportToKML(points, `Triagem Erosão - ${activeRegion.name}`);
      downloadFile(content, `${baseName}.kml`, "application/vnd.google-earth.kml+xml");
    } else if (format === "csv") {
      const content = exportToCSV(points);
      downloadFile(content, `${baseName}.csv`, "text/csv;charset=utf-8;");
    } else if (format === "print") {
      window.print();
      return;
    }

    setDownloadedFormat(format.toUpperCase());
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });

    setTimeout(() => setDownloadedFormat(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in transition-colors">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Exportação de Dados Geoespaciais</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Download instantâneo das {points.length} feições de erosão ativas
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Summary Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Região Ativa:</span>
              <span className="font-bold text-slate-900 dark:text-white">{activeRegion.name}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Selecionado:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {points.length} pontos
              </span>
            </div>
          </div>

          {/* Download Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* GeoJSON */}
            <button
              onClick={() => handleExport("geojson")}
              className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 rounded-xl text-left transition-all group flex flex-col justify-between space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <FileCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                  .GEOJSON
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">GeoJSON Padronizado</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ideal para QGIS, ArcGIS, MapLibre e WebGIS.
                </p>
              </div>
            </button>

            {/* KML */}
            <button
              onClick={() => handleExport("kml")}
              className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 rounded-xl text-left transition-all group flex flex-col justify-between space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                  .KML
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Google Earth KML</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Com estilos e ícones de severidade em 3D.
                </p>
              </div>
            </button>

            {/* CSV */}
            <button
              onClick={() => handleExport("csv")}
              className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 rounded-xl text-left transition-all group flex flex-col justify-between space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                  .CSV / Excel
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Tabela CSV Completa</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Todas as métricas (DMS, decliv, BSI, perda).
                </p>
              </div>
            </button>

            {/* Print / Report */}
            <button
              onClick={() => handleExport("print")}
              className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 rounded-xl text-left transition-all group flex flex-col justify-between space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Printer className="w-5 h-5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                  PDF / Print
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Relatório de Triagem</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Geração de sumário executivo para impressão.
                </p>
              </div>
            </button>
          </div>

          {/* Success Banner */}
          {downloadedFormat && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Arquivo <strong>{downloadedFormat}</strong> gerado e baixado com sucesso!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs rounded-lg transition-colors border border-slate-200 dark:border-transparent"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
