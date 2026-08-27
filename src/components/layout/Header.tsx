"use client";

import React from "react";
import {
  Layers,
  Settings,
  Download,
  MapPin,
  Mountain,
  Globe,
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
  PlusCircle,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";

export const Header: React.FC = () => {
  const {
    activeRegion,
    filters,
    gcpCredentials,
    activeAOIPolygon,
    dataSource,
    mapState,
    sidebarCollapsed,
    theme,
    toggleTheme,
    setActiveModal,
    toggleTerrain3D,
    toggleSidebar,
    getFilteredPoints,
  } = useErosionStore();

  const filteredCount = getFilteredPoints().length;

  return (
    <header className="h-16 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-30 sticky top-0 shadow-sm dark:shadow-lg transition-colors duration-200">
      {/* Left section: Logo, Title & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
          title="Alternar Painel Lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/30">
            <Mountain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Localizador de Erosão
                <span className="text-[10px] font-semibold uppercase bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  2D / 3D
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
              Mestrado PPGTCA • Pesquisa de Erosão Laminar (Paraná & Brasil)
            </p>
          </div>
        </div>
      </div>

      {/* Middle section: Active Region & Active Points Pill */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => setActiveModal("region")}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 transition-all shadow-sm group"
        >
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="max-w-[170px] truncate text-slate-800 dark:text-slate-100">{activeRegion.name}</span>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 font-mono">
            {activeRegion.state}
          </span>
        </button>

        {activeAOIPolygon && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-500/40 rounded-lg text-xs font-medium text-cyan-800 dark:text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="truncate max-w-[130px]">AOI: {activeAOIPolygon.name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 rounded-lg text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong className="text-slate-900 dark:text-white font-bold">{filteredCount}</strong> Focos Triados
          </span>
          {filters.topN > 0 && filters.topN < 150 && (
            <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.5 rounded font-mono font-semibold">
              Top {filters.topN}
            </span>
          )}
        </div>
      </div>

      {/* Right section: Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium transition-all shadow-sm group"
          title={theme === "dark" ? "Mudar para interface clara (Modo Claro)" : "Mudar para interface escura (Modo Escuro)"}
          aria-label="Alternar interface clara ou escura"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline">Tema Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform" />
              <span className="hidden sm:inline">Tema Escuro</span>
            </>
          )}
        </button>

        {/* 3D Relevo toggle */}
        <button
          onClick={toggleTerrain3D}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            mapState.terrain3d
              ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
              : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
          }`}
          title="Ativar / Desativar Terreno 3D DEM"
        >
          <Mountain className="w-4 h-4" />
          <span className="hidden sm:inline">{mapState.terrain3d ? "Relevo 3D Ativo" : "Modo 2D"}</span>
        </button>

        {/* Region & AOI Modal trigger */}
        <button
          onClick={() => setActiveModal("region")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 dark:hover:border-slate-600 rounded-lg text-xs font-medium transition-all shadow-sm"
          title="Selecionar Região, Subir Polígono ou Pedir Nova Área"
        >
          <PlusCircle className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className="hidden sm:inline">Regiões & AOI</span>
        </button>

        {/* Settings & Ingestion trigger */}
        <button
          onClick={() => setActiveModal("settings")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 dark:hover:border-slate-600 rounded-lg text-xs font-medium transition-all shadow-sm relative"
          title="Configurações de Credenciais GEE e Ingestão de Dados"
        >
          <Settings className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span className="hidden sm:inline">Conexão & Dados</span>
          {gcpCredentials && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"
              title="GEE Conectado"
            />
          )}
        </button>

        {/* Export Modal trigger */}
        <button
          onClick={() => setActiveModal("export")}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-lg text-xs transition-all shadow-md shadow-emerald-700/20"
          title="Exportar dados filtrados em KML, GeoJSON ou CSV"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>
    </header>
  );
};
