/**
 * Engine 3: Grid & Renewable Engine.
 * Manages Solar Photovoltaics, Battery Energy Storage System (BESS),
 * Grid Net-Metering, Dynamic ToU Tariffs, and Carbon Avoided.
 */

import React from 'react';
import { RenewableGridState } from '../../types/digitalTwin';
import { Sun, BatteryCharging, Zap, Leaf, DollarSign, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface GridRenewablePanelProps {
  renewable: RenewableGridState;
  onTriggerDrEvent: () => void;
  onSelectEquipment: (id: string) => void;
}

export const GridRenewablePanel: React.FC<GridRenewablePanelProps> = ({
  renewable,
  onTriggerDrEvent,
  onSelectEquipment,
}) => {
  const isBatteryDischarging = renewable.batteryPowerKw > 0;
  const isBatteryCharging = renewable.batteryPowerKw < 0;

  return (
    <div className="space-y-4">
      {/* Header & KPI Summary */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Grid & Renewable Engine · Decarbonization
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Solar PV generation, BESS dispatch arbitrage, and net-zero balancing
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <Leaf className="w-3.5 h-3.5" />
              <span>{renewable.cleanEnergyRatio}% Clean Power</span>
            </span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Solar PV Gen</div>
            <div className="font-mono text-base font-bold text-amber-400 tabular-nums">
              {renewable.solarPvKw} kW
            </div>
            <div className="text-[10px] text-slate-500 font-mono">{renewable.solarDailyKwh} kWh Today</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">BESS State of Charge</div>
            <div className="font-mono text-base font-bold text-emerald-400 tabular-nums">
              {renewable.batterySoc}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {isBatteryDischarging && `Discharging ${renewable.batteryPowerKw} kW`}
              {isBatteryCharging && `Charging ${Math.abs(renewable.batteryPowerKw)} kW`}
              {!isBatteryDischarging && !isBatteryCharging && 'Standby Idle'}
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Net Grid Flow</div>
            <div className="font-mono text-base font-bold text-blue-400 tabular-nums">
              {renewable.gridImportKw > 0 ? `${renewable.gridImportKw} kW` : '0.0 kW (Net Zero)'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">${renewable.electricityPriceKwh.toFixed(2)}/kWh</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">CO2 Avoided</div>
            <div className="font-mono text-base font-bold text-teal-400 tabular-nums">
              {renewable.carbonAvoidedKg} kg
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Saved Today</div>
          </div>
        </div>
      </div>

      {/* Solar & Battery Dual Column */}
      <div className="grid grid-cols-2 gap-3">
        {/* Solar PV Card */}
        <div
          onClick={() => onSelectEquipment('equip-solar-pv')}
          className="cursor-pointer group p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 hover:border-amber-500/50 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-semibold text-white group-hover:text-amber-300">
                Rooftop Solar Array
              </h4>
            </div>
            <span className="text-[10px] font-mono text-amber-400">42.0 kWp DC</span>
          </div>

          <div className="mt-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Irradiance:</span>
              <span className="font-semibold text-amber-300">{renewable.solarIrradiance} W/m²</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Inverter Efficiency:</span>
              <span className="text-white font-semibold">98.4%</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Panel Azimuth / Tilt:</span>
              <span className="text-white">180° South / 22°</span>
            </div>
          </div>
        </div>

        {/* Battery Storage Card */}
        <div
          onClick={() => onSelectEquipment('equip-bess-battery')}
          className="cursor-pointer group p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 hover:border-emerald-500/50 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300">
                100 kWh BESS System
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">LiFePO4 Chemistry</span>
          </div>

          <div className="mt-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Pack State of Charge:</span>
              <span className="font-semibold text-emerald-300">{renewable.batterySoc}%</span>
            </div>
            {/* Visual Battery Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  renewable.batterySoc < 20 ? 'bg-red-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${renewable.batterySoc}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-slate-300 pt-1">
              <span className="text-slate-400">Dispatch Mode:</span>
              <span className="capitalize text-cyan-300 font-semibold">{renewable.batteryMode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Interconnection & Dynamic Time of Use Tariff */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-white flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Grid Tariff & Demand Response Integration</span>
          </h4>
          <span
            className={`px-2 py-0.5 text-[10px] font-mono rounded uppercase font-semibold ${
              renewable.tariffPeriod === 'on-peak'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : renewable.tariffPeriod === 'mid-peak'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {renewable.tariffPeriod} Tariff (${renewable.electricityPriceKwh.toFixed(2)}/kWh)
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Grid Carbon Intensity:</span>
            <span className="text-slate-200">{renewable.gridCarbonIntensity} g CO2/kWh</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Daily Energy Cost Avoided:</span>
            <span className="text-emerald-400 font-semibold">${renewable.dailyCostAvoided.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Clean Energy Offset Ratio:</span>
            <span className="text-cyan-300 font-semibold">{renewable.cleanEnergyRatio}% of Building Demand</span>
          </div>
        </div>

        {/* 1-Click Demand Response Simulation Action */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {renewable.drEventActive
              ? 'Utility Peak Event Active · Non-critical loads shed by 30%'
              : 'Test automated building load shed during simulated utility peak'}
          </span>
          <button
            onClick={onTriggerDrEvent}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded-lg border transition-all ${
              renewable.drEventActive
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {renewable.drEventActive ? 'End DR Event' : 'Trigger DR Peak Event'}
          </button>
        </div>
      </div>
    </div>
  );
};
