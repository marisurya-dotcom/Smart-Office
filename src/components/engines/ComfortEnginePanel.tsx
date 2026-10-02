/**
 * Engine 1: Comfort Engine.
 * Evaluates occupant thermal comfort, PMV / PPD (ASHRAE 55), Indoor Air Quality (CO2/VOC),
 * illuminance, and acoustics across all office zones.
 */

import React, { useState } from 'react';
import { ZoneData, OccupantAvatar } from '../../types/digitalTwin';
import { Thermometer, Droplets, Wind, Sun, Volume2, Users, Sliders, CheckCircle2, UserCheck, Eye } from 'lucide-react';

interface ComfortEnginePanelProps {
  zones: ZoneData[];
  occupants?: OccupantAvatar[];
  onUpdateZoneTargetTemp: (zoneId: string, newTarget: number) => void;
  onUpdateZoneBlinds: (zoneId: string, newBlinds: number) => void;
  onSelectZone: (zoneId: string) => void;
  onSelectOccupant?: (occupantId: string) => void;
}

export const ComfortEnginePanel: React.FC<ComfortEnginePanelProps> = ({
  zones,
  occupants = [],
  onUpdateZoneTargetTemp,
  onUpdateZoneBlinds,
  onSelectZone,
  onSelectOccupant,
}) => {
  const [subView, setSubView] = useState<'zones' | 'occupants'>('zones');
  const [autoComfortPilot, setAutoComfortPilot] = useState(true);

  // Compute aggregate building comfort metrics
  const nonServerZones = zones.filter((z) => z.type !== 'server');
  const avgPmv = Number(
    (nonServerZones.reduce((acc, z) => acc + z.pmv, 0) / nonServerZones.length).toFixed(2)
  );
  const avgPpd = Number(
    (nonServerZones.reduce((acc, z) => acc + z.ppd, 0) / nonServerZones.length).toFixed(1)
  );
  const avgSatisfaction = Number((100 - avgPpd).toFixed(1));
  const totalOccupants = zones.reduce((acc, z) => acc + z.occupancyCount, 0);

  return (
    <div className="space-y-4">
      {/* Header & Overall Comfort Score */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Comfort Engine · ISO 7730 / ASHRAE 55
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-parameter environmental predictive comfort modeling & active workforce perception
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setSubView('zones')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  subView === 'zones' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                Office Zones ({zones.length})
              </button>
              <button
                onClick={() => setSubView('occupants')}
                className={`px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                  subView === 'occupants' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Working Persons ({occupants.length})</span>
              </button>
            </div>

            <button
              onClick={() => setAutoComfortPilot(!autoComfortPilot)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors ${
                autoComfortPilot
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              Auto-Pilot: {autoComfortPilot ? 'Active' : 'Manual'}
            </button>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Satisfaction Score</div>
            <div className="font-mono text-base font-bold text-emerald-400 tabular-nums">
              {avgSatisfaction}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Class A Rating</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Mean PMV Index</div>
            <div className="font-mono text-base font-bold text-cyan-300 tabular-nums">
              {avgPmv > 0 ? `+${avgPmv}` : avgPmv}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Neutral Target (-0.2 to +0.2)</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">PPD Dissatisfied</div>
            <div className="font-mono text-base font-bold text-slate-200 tabular-nums">
              {avgPpd}%
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Below 10% standard</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Active Workforce</div>
            <div className="font-mono text-base font-bold text-white tabular-nums">
              {occupants.length} Persons
            </div>
            <div className="text-[10px] text-slate-500 font-mono">At Workstations</div>
          </div>
        </div>
      </div>

      {/* SUBVIEW 1: ACTIVE OCCUPANTS LIST */}
      {subView === 'occupants' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 animate-fade-in">
          {occupants.map((occ) => (
            <div
              key={occ.id}
              onClick={() => onSelectOccupant && onSelectOccupant(occ.id)}
              className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 hover:border-cyan-500/60 transition-all cursor-pointer shadow-lg group"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-semibold text-white group-hover:text-cyan-300">{occ.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">· {occ.role}</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {occ.comfortPerception}
                </span>
              </div>

              <div className="mt-2 text-xs font-mono text-slate-300 flex flex-col gap-1">
                <div className="flex items-start gap-1 text-slate-300">
                  <span className="text-slate-500 shrink-0">Working on:</span>
                  <span className="text-slate-200 line-clamp-1">{occ.currentTask || 'Focus Work'}</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                  <span>Zone: {occ.zoneId.replace('zone-', '').replace('-', ' ').toUpperCase()}</span>
                  <span className="text-cyan-400 flex items-center gap-1 group-hover:underline">
                    <Eye className="w-3 h-3" />
                    <span>Inspect</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBVIEW 2: ZONE TELEMETRY CARDS */}
      {subView === 'zones' && (
        <div className="space-y-2.5 animate-fade-in">
        {zones.map((zone) => {
          const isOptimalPmv = Math.abs(zone.pmv) <= 0.3;
          return (
            <div
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              className="p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer shadow-lg"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      zone.type === 'server'
                        ? 'bg-blue-400'
                        : isOptimalPmv
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <h4 className="text-xs font-semibold text-white">{zone.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({zone.occupancyCount}/{zone.maxOccupancy} Persons)
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-slate-400">PMV:</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      isOptimalPmv ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {zone.pmv > 0 ? `+${zone.pmv}` : zone.pmv}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">PPD:</span>
                  <span className="text-slate-200 tabular-nums">{zone.ppd}%</span>
                </div>
              </div>

              {/* Environmental Metrics Strip */}
              <div className="grid grid-cols-5 gap-2 mt-2.5 text-center font-mono text-xs">
                <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Thermometer className="w-3 h-3 text-cyan-400" />
                    <span>Temp</span>
                  </div>
                  <div className="mt-0.5 font-bold text-white tabular-nums">
                    {zone.temperature}°C
                  </div>
                  <div className="text-[9px] text-slate-500">Target: {zone.targetTemp}°C</div>
                </div>

                <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    <span>Humidity</span>
                  </div>
                  <div className="mt-0.5 font-bold text-white tabular-nums">{zone.humidity}%</div>
                  <div className="text-[9px] text-slate-500">RH (40-60%)</div>
                </div>

                <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Wind className="w-3 h-3 text-teal-400" />
                    <span>CO2</span>
                  </div>
                  <div
                    className={`mt-0.5 font-bold tabular-nums ${
                      zone.co2 < 700 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {zone.co2}
                  </div>
                  <div className="text-[9px] text-slate-500">ppm</div>
                </div>

                <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>Light</span>
                  </div>
                  <div className="mt-0.5 font-bold text-white tabular-nums">{zone.lux} lx</div>
                  <div className="text-[9px] text-slate-500">{zone.lightingDimmablePercent}% Dim</div>
                </div>

                <div className="p-1.5 rounded bg-slate-950/60 border border-slate-800/60">
                  <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Volume2 className="w-3 h-3 text-purple-400" />
                    <span>Sound</span>
                  </div>
                  <div className="mt-0.5 font-bold text-white tabular-nums">{zone.acoustic}</div>
                  <div className="text-[9px] text-slate-500">dBA</div>
                </div>
              </div>

              {/* Setpoint Slider Controls */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                    <span>Target Temperature:</span>
                    <span className="text-cyan-300 font-semibold">{zone.targetTemp.toFixed(1)}°C</span>
                  </div>
                  <input
                    type="range"
                    min={18.0}
                    max={26.0}
                    step={0.5}
                    value={zone.targetTemp}
                    onChange={(e) => onUpdateZoneTargetTemp(zone.id, parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                    <span>Solar Blinds Position:</span>
                    <span className="text-amber-300 font-semibold">{zone.blindsPositionPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={zone.blindsPositionPercent}
                    onChange={(e) => onUpdateZoneBlinds(zone.id, parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
