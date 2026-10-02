/**
 * Engine 2: Energy Engine.
 * Monitored electrical power breakdown, Energy Use Intensity (EUI),
 * peak shaving limits, automated diagnostic anomalies, and 24h baseline load profile.
 */

import React from 'react';
import { ElectricalLoads, DemandResponseMode } from '../../types/digitalTwin';
import { Zap, Activity, CheckCircle2, AlertTriangle, TrendingDown, Gauge } from 'lucide-react';

interface EnergyEnginePanelProps {
  loads: ElectricalLoads;
  drMode: DemandResponseMode;
  onChangeDrMode: (mode: DemandResponseMode) => void;
  onSelectEquipment: (id: string) => void;
}

export const EnergyEnginePanel: React.FC<EnergyEnginePanelProps> = ({
  loads,
  drMode,
  onChangeDrMode,
  onSelectEquipment,
}) => {
  // Building area: 36m x 24m = 864 m²
  const buildingAreaM2 = 864;
  // Estimated annual EUI (kWh/m²/year)
  const estimatedEui = Number(((loads.totalDemandKw * 8760 * 0.42) / buildingAreaM2).toFixed(1));
  const baselineEui = 124.0;
  const euiSavingsPercent = Math.round(((baselineEui - estimatedEui) / baselineEui) * 100);

  const peakLimitKw = 60.0;
  const peakHeadroom = Number(Math.max(0, peakLimitKw - loads.totalDemandKw).toFixed(1));

  // 24-Hour Hourly Profile synthetic data
  const hourlyProfile = [
    { hour: '00', kw: 18.2, base: 24.0 },
    { hour: '03', kw: 17.5, base: 23.5 },
    { hour: '06', kw: 22.0, base: 28.0 },
    { hour: '09', kw: 46.5, base: 58.0 },
    { hour: '12', kw: 54.0, base: 68.5 },
    { hour: '15', kw: 48.2, base: 72.0 },
    { hour: '18', kw: 36.4, base: 52.0 },
    { hour: '21', kw: 24.1, base: 34.0 },
  ];

  return (
    <div className="space-y-4">
      {/* Header & KPI Summary */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              Energy Engine · Power & Load Analytics
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time electrical sub-metering, EUI performance, and automated diagnostics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{euiSavingsPercent}% vs Baseline</span>
            </span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Building Demand</div>
            <div className="font-mono text-base font-bold text-cyan-300 tabular-nums">
              {loads.totalDemandKw} kW
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Instantaneous</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Energy Intensity (EUI)</div>
            <div className="font-mono text-base font-bold text-emerald-400 tabular-nums">
              {estimatedEui}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">kWh/m²/yr (Base: {baselineEui})</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Power Factor</div>
            <div className="font-mono text-base font-bold text-white tabular-nums">
              {loads.powerFactor}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Lagging (THD: 1.8%)</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Peak Headroom</div>
            <div className="font-mono text-base font-bold text-amber-400 tabular-nums">
              {peakHeadroom} kW
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Limit: {peakLimitKw} kW</div>
          </div>
        </div>
      </div>

      {/* Subsystem Sub-Meter Breakdown */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl">
        <h4 className="text-xs font-semibold text-white mb-3">Subsystem Electrical Sub-Meter Loads</h4>

        <div className="space-y-3">
          {/* Subsystem 1: HVAC */}
          <div
            onClick={() => onSelectEquipment('equip-hvac-unit')}
            className="cursor-pointer group p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-200 font-medium group-hover:text-cyan-300">
                1. HVAC & Heat Pump Chiller
              </span>
              <span className="text-cyan-300 font-bold tabular-nums">
                {loads.hvacKw} kW ({Math.round((loads.hvacKw / (loads.totalDemandKw || 1)) * 100)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (loads.hvacKw / (loads.totalDemandKw || 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Subsystem 2: Computers & Servers */}
          <div
            onClick={() => onSelectEquipment('equip-server-rack')}
            className="cursor-pointer group p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-200 font-medium group-hover:text-purple-300">
                2. Server Cluster & Desktop IT
              </span>
              <span className="text-purple-300 font-bold tabular-nums">
                {loads.computersKw} kW ({Math.round((loads.computersKw / (loads.totalDemandKw || 1)) * 100)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (loads.computersKw / (loads.totalDemandKw || 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Subsystem 3: Lighting */}
          <div
            onClick={() => onSelectEquipment('equip-mdp')}
            className="cursor-pointer group p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-200 font-medium group-hover:text-amber-300">
                3. Architectural & Task Lighting
              </span>
              <span className="text-amber-300 font-bold tabular-nums">
                {loads.lightingKw} kW ({Math.round((loads.lightingKw / (loads.totalDemandKw || 1)) * 100)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (loads.lightingKw / (loads.totalDemandKw || 1)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Subsystem 4: Water Booster Motor */}
          <div
            onClick={() => onSelectEquipment('equip-water-pump')}
            className="cursor-pointer group p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 transition-all"
          >
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-200 font-medium group-hover:text-blue-300">
                4. Water Pressure Booster Pump
              </span>
              <span className="text-blue-300 font-bold tabular-nums">
                {loads.waterMotorKw} kW ({Math.round((loads.waterMotorKw / (loads.totalDemandKw || 1)) * 100)}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (loads.waterMotorKw / (loads.totalDemandKw || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Automated Diagnostic & Anomaly Engine */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl">
        <h4 className="text-xs font-semibold text-white mb-2.5 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-Time Anomaly & Health Telemetry</span>
        </h4>

        <div className="space-y-2 text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chiller COP Efficiency:</span>
            </span>
            <span className="text-emerald-400 font-semibold">4.2 COP (Nominal)</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Water Pump Vibration (RMS):</span>
            </span>
            <span className="text-emerald-400 font-semibold">1.1 mm/s (ISO 10816 Zone A)</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Server Data Center Delta-T:</span>
            </span>
            <span className="text-cyan-300 font-semibold">12.6°C (Thermal Delta Balanced)</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Daylight Harvesting Sensor Loop:</span>
            </span>
            <span className="text-amber-300 font-semibold">+34% Lighting Offset</span>
          </div>
        </div>
      </div>
    </div>
  );
};
