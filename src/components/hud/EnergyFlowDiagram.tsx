/**
 * Electrical Energy Flow Diagram.
 * Visually displays the prompt-mandated power distribution topology:
 * GRID + SOLAR + BATTERY -> MAIN DISTRIBUTION PANEL -> AC / LIGHTING / COMPUTERS / WATER MOTOR
 */

import React from 'react';
import { ElectricalLoads, RenewableGridState } from '../../types/digitalTwin';
import { Sun, BatteryCharging, Zap, Wind, Lightbulb, Server, Droplets, ArrowDown, ChevronRight } from 'lucide-react';

interface EnergyFlowDiagramProps {
  loads: ElectricalLoads;
  renewable: RenewableGridState;
  onSelectEquipment: (id: string) => void;
}

export const EnergyFlowDiagram: React.FC<EnergyFlowDiagramProps> = ({
  loads,
  renewable,
  onSelectEquipment,
}) => {
  const isBatteryDischarging = renewable.batteryPowerKw > 0;
  const isBatteryCharging = renewable.batteryPowerKw < 0;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 text-slate-200 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white tracking-tight">Electrical Energy Flow Architecture</h3>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
          <span>Total Load:</span>
          <span className="font-semibold text-cyan-300 tabular-nums">{loads.totalDemandKw} kW</span>
          <span className="text-slate-600">·</span>
          <span>PF: {loads.powerFactor}</span>
        </div>
      </div>

      {/* TOP SOURCES: GRID + SOLAR + BATTERY */}
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {/* Source 1: GRID */}
        <div
          onClick={() => onSelectEquipment('equip-mdp')}
          className="group cursor-pointer p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all text-center relative overflow-hidden"
        >
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>GRID UTILITY</span>
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-white tabular-nums">
            {renewable.gridImportKw >= 0 ? `${renewable.gridImportKw} kW` : `Net Zero`}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            ${renewable.electricityPriceKwh.toFixed(2)}/kWh ({renewable.tariffPeriod})
          </div>
        </div>

        {/* Source 2: SOLAR PV */}
        <div
          onClick={() => onSelectEquipment('equip-solar-pv')}
          className="group cursor-pointer p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all text-center relative overflow-hidden"
        >
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 font-medium">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>SOLAR PV</span>
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-amber-400 tabular-nums">
            {renewable.solarPvKw} kW
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {renewable.solarIrradiance} W/m² Irradiance
          </div>
        </div>

        {/* Source 3: BATTERY BESS */}
        <div
          onClick={() => onSelectEquipment('equip-bess-battery')}
          className="group cursor-pointer p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all text-center relative overflow-hidden"
        >
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-300 font-medium">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            <span>BATTERY BESS</span>
          </div>
          <div className="mt-1 font-mono text-sm font-bold text-emerald-400 tabular-nums">
            {isBatteryDischarging && `+${renewable.batteryPowerKw} kW`}
            {isBatteryCharging && `${renewable.batteryPowerKw} kW`}
            {!isBatteryDischarging && !isBatteryCharging && `0.0 kW`}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {renewable.batterySoc}% SoC · {renewable.batteryMode}
          </div>
        </div>
      </div>

      {/* CONVERGENCE CONDUIT ARROWS */}
      <div className="py-2 flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-1 text-xs font-mono text-cyan-400">
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          <span className="text-[10px] uppercase tracking-wider">Synchronized 480V Main Bus</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </div>
      </div>

      {/* NODE: MAIN DISTRIBUTION PANEL */}
      <div
        onClick={() => onSelectEquipment('equip-mdp')}
        className="cursor-pointer p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 hover:border-cyan-400/80 transition-all text-center"
      >
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            MAIN DISTRIBUTION PANEL (MDP)
          </span>
          <span className="font-mono text-white text-xs font-bold tabular-nums">
            Total Demand: {loads.totalDemandKw} kW
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400 font-mono flex items-center justify-center gap-4">
          <span>3-Phase 480V</span>
          <span>·</span>
          <span>Main Breaker: Closed</span>
          <span>·</span>
          <span>Sub-metering: Active</span>
        </div>
      </div>

      {/* DISTRIBUTION CONDUIT ARROWS */}
      <div className="py-2 flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
          <ArrowDown className="w-3.5 h-3.5" />
          <span className="text-[10px] uppercase tracking-wider">Branch Circuit Feeders</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* DOWNSTREAM LOADS: AC | LIGHTING | COMPUTERS | WATER MOTOR */}
      <div className="grid grid-cols-4 gap-2">
        {/* Load 1: AC / HVAC */}
        <div
          onClick={() => onSelectEquipment('equip-hvac-unit')}
          className="group cursor-pointer p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition-all text-center"
        >
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-300 font-medium">
            <Wind className="w-3 h-3 text-cyan-400" />
            <span>AC / HVAC</span>
          </div>
          <div className="mt-1 font-mono text-xs font-bold text-white tabular-nums">
            {loads.hvacKw} kW
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {loads.totalDemandKw > 0 ? Math.round((loads.hvacKw / loads.totalDemandKw) * 100) : 0}% Load
          </div>
        </div>

        {/* Load 2: LIGHTING */}
        <div
          onClick={() => onSelectEquipment('equip-mdp')}
          className="group cursor-pointer p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 transition-all text-center"
        >
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-300 font-medium">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>LIGHTING</span>
          </div>
          <div className="mt-1 font-mono text-xs font-bold text-white tabular-nums">
            {loads.lightingKw} kW
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {loads.totalDemandKw > 0 ? Math.round((loads.lightingKw / loads.totalDemandKw) * 100) : 0}% Load
          </div>
        </div>

        {/* Load 3: COMPUTERS & IT */}
        <div
          onClick={() => onSelectEquipment('equip-server-rack')}
          className="group cursor-pointer p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-purple-500/40 transition-all text-center"
        >
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-300 font-medium">
            <Server className="w-3 h-3 text-purple-400" />
            <span>COMPUTERS</span>
          </div>
          <div className="mt-1 font-mono text-xs font-bold text-white tabular-nums">
            {loads.computersKw} kW
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {loads.totalDemandKw > 0 ? Math.round((loads.computersKw / loads.totalDemandKw) * 100) : 0}% Load
          </div>
        </div>

        {/* Load 4: WATER MOTOR */}
        <div
          onClick={() => onSelectEquipment('equip-water-pump')}
          className="group cursor-pointer p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-all text-center"
        >
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-300 font-medium">
            <Droplets className="w-3 h-3 text-blue-400" />
            <span>WATER MOTOR</span>
          </div>
          <div className="mt-1 font-mono text-xs font-bold text-white tabular-nums">
            {loads.waterMotorKw} kW
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {loads.totalDemandKw > 0 ? Math.round((loads.waterMotorKw / loads.totalDemandKw) * 100) : 0}% Load
          </div>
        </div>
      </div>
    </div>
  );
};
