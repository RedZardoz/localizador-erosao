"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Sliders, Activity, ListFilter } from "lucide-react";
import { useErosionStore } from "@/lib/store/useErosionStore";
import { RegionAndTopNSelector } from "./RegionAndTopNSelector";
import { StatsOverview } from "./StatsOverview";
import { FiltersPanel } from "./FiltersPanel";
import { PointCardList } from "./PointCardList";

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useErosionStore();
  const [activeTab, setActiveTab] = useState<"triagem" | "filtros">("triagem");

  return (
    <aside
      className={`fixed lg:static top-16 bottom-0 left-0 z-20 w-80 sm:w-96 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-r border-slate-200 dark:border-slate-800/90 flex flex-col transition-all duration-300 shadow-xl dark:shadow-2xl ${
        sidebarCollapsed ? "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-none" : "translate-x-0"
      }`}
    >
      {/* Sidebar Header & Tab Bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 bg-slate-50/80 dark:bg-slate-900/60 transition-colors">
        <div className="grid grid-cols-2 gap-1 bg-slate-200/70 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 w-full">
          <button
            onClick={() => setActiveTab("triagem")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              activeTab === "triagem"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Painel & Focos
          </button>

          <button
            onClick={() => setActiveTab("filtros")}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              activeTab === "filtros"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            Filtros Detalhados
          </button>
        </div>

        {/* Collapse toggle button on desktop */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 transition-colors hidden lg:flex"
          title="Recolher Painel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar">
        {/* Top N & Region is always visible at the top */}
        <RegionAndTopNSelector />

        {activeTab === "triagem" ? (
          <>
            <StatsOverview />
            <PointCardList />
          </>
        ) : (
          <>
            <FiltersPanel />
            <StatsOverview />
          </>
        )}
      </div>
    </aside>
  );
};
