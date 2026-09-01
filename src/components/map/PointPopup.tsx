"use client";

import React, { useState } from "react";
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
  Satellite,
  RefreshCw,
  AlertTriangle,
  BadgeCheck,
  Trash2,
  Sparkles,
  RotateCcw,
  TreePine,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";
import { ErosionPoint } from "@/types/erosion";
import { formatToDMS, getGoogleEarthWebUrl, getGoogleMapsUrl } from "@/lib/utils/geoUtils";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { isPointSlopeOutdated, GEE_CALC_ENGINE_VERSION } from "@/lib/gee/calcEngineVersion";

interface PointPopupProps {
  point: ErosionPoint;
  onClose: () => void;
}

const PROVENANCE_LABEL: Record<string, string> = {
  mock: "Dado de demonstração (sintético)",
  "user-upload": "Importado pelo usuário",
  "satellite-derived": "Calculado via satélite/DEM (Earth Engine)",
  "gee-screened": "Candidato Triado (Earth Engine)",
  "field-validated": "Validado em campo",
};

export const PointPopup: React.FC<PointPopupProps> = ({ point, onClose }) => {
  const { geeSessionActive, updatePointWithRealData, removePoint, replacePoint, flyToLocation, addSystemLog, openAuditDossier } =
    useErosionStore();

  const [computing, setComputing] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [replaceSuccess, setReplaceSuccess] = useState<string | null>(null);
  const [computeError, setComputeError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const dmsLat = formatToDMS(point.latitude, true);
  const dmsLng = formatToDMS(point.longitude, false);

  const hasUsableCredentials = geeSessionActive;
  const isSlopeOutdated = isPointSlopeOutdated(point);

  const severityColor =
    point.severity === "Crítica"
      ? "bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40"
      : point.severity === "Alta"
      ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40"
      : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40";

  const handleComputeReal = async () => {
    if (computing) return;
    setComputing(true);
    setComputeError(null);

    try {
      const res = await fetch("/api/gee/analyze-point", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: point.latitude,
          longitude: point.longitude,
          pointId: point.id,
          soilType: point.soilType,
        }),
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || "Falha ao calcular variáveis no Earth Engine");
      }

      const d = json.data;
      setDiagnostics(d.diagnostics);

      const patch: Partial<ErosionPoint> = {
        slopePercent: d.slopePercent,
        slopeDegrees: d.slopeDegrees,
        bsi: d.bsi,
        ndvi: d.ndvi,
        elevation: d.elevation,
        estimatedSoilLoss: d.estimatedSoilLoss,
        priorityScore: d.priorityScore,
        severity: d.severity,
        dataProvenance: "satellite-derived",
        geeSourceImageId: d.geeSourceImageId || d.diagnostics?.s2ImageId || d.diagnostics?.sentinelSceneId,
        geeComputedAt: new Date().toISOString(),
        calcEngineVersion: d.calcEngineVersion || GEE_CALC_ENGINE_VERSION,
        rusleFactors: d.rusleFactors || {
          r: d.rFactor,
          k: d.kFactor,
          ls: d.lsFactor,
          c: d.cFactor,
          p: 1.0,
        },
      };

      updatePointWithRealData(point.id, patch);
    } catch (err: any) {
      setComputeError(err?.message || "Erro desconhecido ao consultar Earth Engine");
    } finally {
      setComputing(false);
    }
  };

  const handleReElectCandidate = async (reason = "Caiu sobre floresta / área inadequada") => {
    if (replacing) return;
    if (!geeSessionActive) {
      setComputeError(
        "A re-eleição de candidatos via satélite exige conexão ativa com o Google Earth Engine. Conecte sua Service Account em 'Conexão & Dados' no menu superior."
      );
      return;
    }
    setReplacing(true);
    setComputeError(null);

    try {
      const { allPoints, activeAOIPolygon } = useErosionStore.getState();

      // Chamada real ao Earth Engine para re-eleger novo ponto na mesma região
      const res = await fetch("/api/gee/replace-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pointToReplace: point,
          existingPoints: allPoints,
          aoi: activeAOIPolygon,
          reason,
        }),
      });

      const json = await res.json();
      if (!json.success || !json.data?.replacementPoint) {
        throw new Error(json.error || "Não foi possível re-eleger o ponto no Earth Engine.");
      }
      const replacementPoint: ErosionPoint = json.data.replacementPoint;

      // 1. Substitui o ponto no array preservando o código
      replacePoint(point.id, replacementPoint);

      // 2. Registra o log no sistema
      addSystemLog({
        severity: "success",
        category: "GEE",
        message: `Ponto ${point.code} re-eleito com sucesso em ${replacementPoint.municipality} (${replacementPoint.latitude.toFixed(4)}, ${replacementPoint.longitude.toFixed(4)}).`,
        details: `Substituído com sucesso via Earth Engine. Motivo: ${reason}`,
      });

      // 3. Voa com a câmera para a nova coordenada
      flyToLocation({
        lat: replacementPoint.latitude,
        lng: replacementPoint.longitude,
        zoom: 18.5,
        pitch: 55,
      });

      setReplaceSuccess(`Ponto ${point.code} re-eleito com sucesso no Earth Engine!`);
      setTimeout(() => setReplaceSuccess(null), 4000);
    } catch (err: any) {
      setComputeError(err?.message || "Erro ao re-eleger o ponto no Earth Engine.");
    } finally {
      setReplacing(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-20 w-80 sm:w-96 max-h-[calc(100vh-6rem)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2 bg-slate-50/80 dark:bg-slate-950/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 px-2 py-0.5 bg-cyan-100 dark:bg-cyan-950/80 rounded border border-cyan-300 dark:border-cyan-800">
              {point.code}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${severityColor}`}
            >
              {point.severity}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-1">
            {point.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {point.municipality} • {point.watershed}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              if (confirm(`Deseja remover o ponto ${point.code} da triagem?`)) {
                removePoint(point.id);
                onClose();
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            title="Remover este ponto da triagem"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar Detalhes"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {replaceSuccess && (
        <div className="m-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/80 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          {replaceSuccess}
        </div>
      )}

      {/* Scrollable Content */}
      <div className="p-3.5 space-y-3 overflow-y-auto custom-scrollbar flex-1">
        {/* Re-elect / Substitute Point Action Box */}
        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <TreePine className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Substituição por Ponto Elegível (GEE)
              </span>
              <p className="text-[10px] text-amber-800/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                Se este alvo caiu sobre floresta, vegetação densa ou área urbana, execute nova eleição no Earth Engine. O novo ponto herdará o código <b>{point.code}</b>.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleReElectCandidate("Caiu sobre floresta / vegetação densa")}
            disabled={!hasUsableCredentials || replacing}
            title={
              !hasUsableCredentials
                ? "Requer conexão com o Google Earth Engine em 'Conexão & Dados' no menu superior"
                : "Executa nova amostragem estratificada no GEE herdando o código deste ponto"
            }
            className="w-full py-1.5 px-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-amber-600 disabled:hover:to-orange-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            {replacing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Consultando Earth Engine (10m)...
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                Re-eleger no GEE (Manter {point.code})
              </>
            )}
          </button>

          {!hasUsableCredentials && (
            <p className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              Requer conexão ativa com o Google Earth Engine em &quot;Conexão &amp; Dados&quot;.
            </p>
          )}
        </div>

        {/* Priority Score Banner */}
        <div className="p-2.5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent dark:from-emerald-500/20 rounded-xl border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Score de Prioridade
            </span>
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {point.priorityScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Perda Estimada
            </span>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">
              {point.estimatedSoilLoss}{" "}
              <span className="text-[10px] text-slate-400 font-normal">t/ha·ano</span>
            </div>
          </div>
        </div>

        {/* Satellite Provenance & Real Calculation */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Origem do Dado:</span>
            <span className="font-mono text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
              {(point.dataProvenance && PROVENANCE_LABEL[point.dataProvenance]) || point.dataProvenance || "Candidato Triado"}
            </span>
          </div>

          {point.dataProvenance === "gee-screened" && (
            <div className="p-2 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-lg text-[10.5px] text-indigo-900 dark:text-indigo-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-800 dark:text-indigo-300">
                <BadgeCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                Candidato Triado no GEE (Variáveis Reais)
              </div>
              <p className="text-[10px] text-indigo-700 dark:text-indigo-300/90 leading-relaxed">
                BSI ({point.bsi > 0 ? `+${point.bsi}` : point.bsi}), declividade ({point.slopePercent}%) e RUSLE foram extraídos diretamente do Sentinel-2 e Copernicus DEM pelo Earth Engine.
              </p>
            </div>
          )}

          {point.dataProvenance === "satellite-derived" && point.geeSourceImageId && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Cena Sentinel-2: {point.geeSourceImageId} • calculado em{" "}
              {point.geeComputedAt ? new Date(point.geeComputedAt).toLocaleString("pt-BR") : "-"}
            </div>
          )}

          {isSlopeOutdated && (
            <div className="p-2.5 bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/40 rounded-xl text-[10.5px] text-amber-900 dark:text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                Declividade Possivelmente Desatualizada
              </div>
              <p className="text-[10px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Este ponto foi calculado antes da correção da projeção métrica do DEM (motor anterior a 2026-08-30). Recomenda-se auditar/recalcular antes do uso para decisões de campo.
              </p>
            </div>
          )}

          {/* Botão Principal de Laudo / Dossiê de Auditoria Científica */}
          <button
            onClick={() => openAuditDossier(point)}
            className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            title="Abrir tela popup com a memória de cálculo sequencial e baixar o Laudo em PDF"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-100" />
            <span>Dossiê &amp; Laudo de Auditoria (PDF)</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                if (useErosionStore.getState().mapboxToken) {
                  useErosionStore.getState().setBasemap("mapbox-hd");
                }
                useErosionStore.getState().flyToLocation({
                  lat: point.latitude,
                  lng: point.longitude,
                  zoom: 18.5,
                  pitch: 55,
                });
              }}
              className="py-1.5 px-2 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors shadow-sm cursor-pointer"
              title="Aproximar a câmera em Zoom 19 com imagem de alta definição sobre este ponto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ver em Ultra-Zoom (Z19)
            </button>

            <button
              onClick={handleComputeReal}
              disabled={!hasUsableCredentials || computing}
              title={
                !hasUsableCredentials
                  ? "Envie uma Service Account do Google Earth Engine em Configurações para auditar"
                  : "Reconsulta o Earth Engine para buscar o ID exato da passagem Sentinel-2 e % de nuvens pontual"
              }
              className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border border-slate-700 cursor-pointer"
            >
              {computing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Satellite className="w-3.5 h-3.5 text-emerald-400" />
                  Auditar Cena Sentinel-2
                </>
              )}
            </button>
          </div>

          {!hasUsableCredentials && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Requer Service Account do GEE em Configurações → GEE Service Account para auditoria adicional.
            </p>
          )}

          {computeError && (
            <div className="flex items-start gap-1.5 text-[10px] text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{computeError}</span>
            </div>
          )}

          {diagnostics && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div>Nuvens na cena: {diagnostics.cloudyPixelPercentage}%</div>
              <div>Precipitação anual (NASA POWER): {diagnostics.annualPrecipitationMm} mm</div>
              <div>
                Fator K: aproximado por ordem pedológica ({diagnostics.kFactorSusceptibility})
                {diagnostics.lsFactorApproximated ? " • Fator LS: aproximado (HydroSHEDS indisponível para este ponto)" : ""}
              </div>
              <button
                onClick={() => openAuditDossier(point)}
                className="w-full py-1 px-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 rounded font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1 cursor-pointer text-[11px]"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Visualizar Laudo Atualizado &amp; Baixar PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Coordinates Section: Decimal + DMS */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Posicionamento Geográfico (WGS84 EPSG:4326)
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block">Latitude</span>
              <span className="text-slate-900 dark:text-slate-200 font-semibold">{point.latitude.toFixed(5)}°</span>
              <span className="text-[10px] text-slate-400 block">{dmsLat}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Longitude</span>
              <span className="text-slate-900 dark:text-slate-200 font-semibold">{point.longitude.toFixed(5)}°</span>
              <span className="text-[10px] text-slate-400 block">{dmsLng}</span>
            </div>
          </div>
          <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-500">Altitude DEM:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
              {point.elevation} m
            </span>
          </div>
        </div>

        {/* Biophysical Attributes Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 text-slate-500 text-[10px]">
              <TrendingUp className="w-3 h-3 text-amber-500" />
              <span>Declividade</span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {point.slopePercent}%{" "}
              <span className="text-[10px] text-slate-400 font-normal">({point.slopeDegrees}°)</span>
            </div>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 text-slate-500 text-[10px]">
              <Percent className="w-3 h-3 text-rose-500" />
              <span>BSI (Solo Exposto)</span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {point.bsi > 0 ? `+${point.bsi}` : point.bsi}
            </div>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 text-slate-500 text-[10px]">
              <Layers className="w-3 h-3 text-emerald-500" />
              <span>NDVI (Vigor Veg.)</span>
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {point.ndvi}
            </div>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 text-slate-500 text-[10px]">
              <Mountain className="w-3 h-3 text-cyan-500" />
              <span>Tipo de Solo</span>
            </div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5">
              {point.soilType}
            </div>
          </div>
        </div>

        {/* RUSLE Factors Accordion/Box */}
        {point.rusleFactors && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-300 flex items-center justify-between">
              <span>Equação RUSLE (A = R · K · LS · C · P)</span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                {point.estimatedSoilLoss} t/ha·ano
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-center font-mono text-[11px] pt-1">
              <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block">R</span>
                <span className="font-bold">{point.rusleFactors.r}</span>
              </div>
              <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block">K</span>
                <span className="font-bold">{point.rusleFactors.k}</span>
              </div>
              <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block">LS</span>
                <span className="font-bold">{point.rusleFactors.ls}</span>
              </div>
              <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block">C</span>
                <span className="font-bold">{point.rusleFactors.c}</span>
              </div>
              <div className="p-1 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block">P</span>
                <span className="font-bold">{point.rusleFactors.p}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes & Description */}
        {point.notes && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 block">Observações / Metadados:</span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
              &ldquo;{point.notes}&rdquo;
            </p>
          </div>
        )}

        {/* KoboToolbox / Custom Fields Inspection */}
        {point.fieldObservations && Object.keys(point.fieldObservations).length > 0 && (
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Atributos de Campo (KoboToolbox)
            </span>
            <div className="space-y-1 text-xs max-h-32 overflow-y-auto custom-scrollbar">
              {Object.entries(point.fieldObservations).slice(0, 12).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400 truncate">{key}:</span>
                  <span className="font-mono text-right truncate max-w-[160px]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons: Google Earth & Google Maps */}
        <div className="pt-2 grid grid-cols-2 gap-2">
          <a
            href={getGoogleEarthWebUrl(point.latitude, point.longitude, point.elevation)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            Google Earth Web
            <ExternalLink className="w-3 h-3" />
          </a>

          <a
            href={getGoogleMapsUrl(point.latitude, point.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
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
