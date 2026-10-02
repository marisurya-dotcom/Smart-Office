/**
 * Top Navigation bar adhering to Universal Frontend Design Constitution:
 * Exactly 3 zones (Brand wordmark, Nav/Engine tabs, Primary actions).
 */

import React from 'react';
import { ViewMode, CameraPreset } from '../../types/digitalTwin';
import { Eye, Layers, Compass, Play, Pause, Zap, ShieldAlert } from 'lucide-react';

interface TopNavigationProps {
  activeEngineTab: 'comfort' | 'energy' | 'grid';
  onChangeEngineTab: (tab: 'comfort' | 'energy' | 'grid') => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  cameraPreset: CameraPreset;
  onChangeCameraPreset: (preset: CameraPreset) => void;
  timeSpeed: number;
  onToggleTimeSpeed: () => void;
  onTriggerDrEvent: () => void;
  isDrActive: boolean;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeEngineTab,
  onChangeEngineTab,
  viewMode,
  onChangeViewMode,
  cameraPreset,
  onChangeCameraPreset,
  timeSpeed,
  onToggleTimeSpeed,
  onTriggerDrEvent,
  isDrActive,
}) => {
  return (
    <header className="relative z-30 flex items-center justify-between px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Single Wordmark Brand */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-base font-semibold tracking-tight text-white flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-sm bg-cyan-400 rotate-45 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
          <span className="text-slate-100">AURA</span>
          <span className="text-slate-400 font-normal text-sm">3D Digital Twin</span>
        </a>
        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs text-slate-400 font-mono">
          <span>Demonstration Twin</span>
          <span aria-hidden="true">·</span>
          <span>ASHRAE 55 & ISO 7730 Physics Model</span>
        </div>
      </div>

      {/* Zone 2: Navigation Links / Engine Selector (Clean functional segmented control) */}
      <nav className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
        <button
          onClick={() => onChangeEngineTab('comfort')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeEngineTab === 'comfort'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Comfort Engine
        </button>
        <button
          onClick={() => onChangeEngineTab('energy')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeEngineTab === 'energy'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Energy Engine
        </button>
        <button
          onClick={() => onChangeEngineTab('grid')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            activeEngineTab === 'grid'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Grid & Renewable
        </button>
      </nav>

      {/* Zone 3: Actions (Camera View Presets, 3D Mode, DR Simulation) */}
      <div className="flex items-center gap-2.5">
        {/* Camera Preset Selector */}
        <div className="hidden sm:flex items-center gap-1 text-xs">
          <select
            value={cameraPreset}
            onChange={(e) => onChangeCameraPreset(e.target.value as CameraPreset)}
            aria-label="3D View Preset"
            className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="isometric">View: Isometric Cutaway</option>
            <option value="workspace">View: Open Workspace</option>
            <option value="boardroom">View: Boardroom</option>
            <option value="server-room">View: Server Room</option>
            <option value="utility-plant">View: Utility Plant</option>
            <option value="top-down">View: Top-Down Plan</option>
          </select>
        </div>

        {/* 3D Visual Layer Selector */}
        <select
          value={viewMode}
          onChange={(e) => onChangeViewMode(e.target.value as ViewMode)}
          aria-label="3D Visual Layer"
          className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-cyan-300 rounded-lg text-xs font-medium focus:outline-none focus:border-cyan-500 cursor-pointer"
        >
          <option value="architectural">Layer: Architectural</option>
          <option value="occupancy-sensors">Layer: Simulated Sensors & Cones</option>
          <option value="energy-flow">Layer: Energy Flow Conduits</option>
          <option value="thermal-heatmap">Layer: Thermal Heatmap (PMV)</option>
          <option value="airflow-ducts">Layer: HVAC Airflow Ducts</option>
        </select>

        {/* Demand Response Trigger Button */}
        <button
          onClick={onTriggerDrEvent}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 whitespace-nowrap ${
            isDrActive
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
          }`}
          title="Simulate a Grid Peak Demand Response Event"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{isDrActive ? 'DR Event Active' : 'Simulate DR'}</span>
        </button>

        {/* Simulation Play / Pause */}
        <button
          onClick={onToggleTimeSpeed}
          className="p-1.5 bg-slate-900 border border-slate-800 text-slate-200 hover:text-cyan-400 rounded-lg transition-colors"
          title={timeSpeed > 0 ? 'Pause simulation clock' : 'Play simulation clock'}
        >
          {timeSpeed > 0 ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
