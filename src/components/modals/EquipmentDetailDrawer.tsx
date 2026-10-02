/**
 * Detail inspection drawer for 3D equipment assets and zones.
 */

import React from 'react';
import { EquipmentItem, ZoneData, OccupantAvatar } from '../../types/digitalTwin';
import { X, Wrench, Activity, CheckCircle2, Sliders, User } from 'lucide-react';

interface EquipmentDetailDrawerProps {
  entityId: string | null;
  entityType: 'equipment' | 'zone' | 'occupant' | null;
  equipmentList: EquipmentItem[];
  zonesList: ZoneData[];
  occupantsList: OccupantAvatar[];
  onClose: () => void;
  onUpdateZoneTargetTemp?: (zoneId: string, newTarget: number) => void;
}

export const EquipmentDetailDrawer: React.FC<EquipmentDetailDrawerProps> = ({
  entityId,
  entityType,
  equipmentList,
  zonesList,
  occupantsList,
  onClose,
  onUpdateZoneTargetTemp,
}) => {
  if (!entityId || !entityType) return null;

  const equipment = entityType === 'equipment' ? equipmentList.find((e) => e.id === entityId) : null;
  const zone = entityType === 'zone' ? zonesList.find((z) => z.id === entityId) : null;
  const occupant = entityType === 'occupant' ? occupantsList.find((o) => o.id === entityId) : null;

  return (
    <div className="fixed top-16 right-6 z-40 w-96 max-w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-200 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {entityType === 'equipment' && <Wrench className="w-4 h-4 text-cyan-400" />}
          {entityType === 'zone' && <Activity className="w-4 h-4 text-emerald-400" />}
          {entityType === 'occupant' && <User className="w-4 h-4 text-amber-400" />}
          <h3 className="text-sm font-semibold text-white truncate max-w-[240px]">
            {equipment?.name || zone?.name || occupant?.name || 'Inspection Asset'}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Equipment View */}
      {equipment && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Operational Status:</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Optimal Performance</span>
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">{equipment.description}</p>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="text-[11px] font-mono text-cyan-300 font-semibold uppercase tracking-wider mb-1">
              Live Telemetry Metrics
            </div>
            {equipment.metrics.map((m, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">{m.label}:</span>
                <span className="text-white font-semibold tabular-nums">
                  {m.value} {m.unit}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
            <span>Asset Health Index:</span>
            <span className="text-emerald-400 font-bold">{equipment.healthPercent}%</span>
          </div>
        </div>
      )}

      {/* Zone View */}
      {zone && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Temperature</span>
              <span className="text-white font-bold text-base">{zone.temperature}°C</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Humidity</span>
              <span className="text-white font-bold text-base">{zone.humidity}% RH</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">CO2 Level</span>
              <span className="text-emerald-400 font-bold text-base">{zone.co2} ppm</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Illuminance</span>
              <span className="text-amber-300 font-bold text-base">{zone.lux} lx</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">PMV Thermal Vote:</span>
              <span className="text-cyan-300 font-semibold">{zone.pmv > 0 ? `+${zone.pmv}` : zone.pmv}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">PPD Dissatisfied:</span>
              <span className="text-slate-200">{zone.ppd}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Airflow Rate:</span>
              <span className="text-white">{zone.hvacAirflowRate} CFM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Occupancy:</span>
              <span className="text-white">{zone.occupancyCount} / {zone.maxOccupancy} Persons</span>
            </div>
          </div>

          {onUpdateZoneTargetTemp && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-slate-400">Adjust Target Temp:</span>
                <span className="text-cyan-300 font-semibold">{zone.targetTemp}°C</span>
              </div>
              <input
                type="range"
                min={18.0}
                max={26.0}
                step={0.5}
                value={zone.targetTemp}
                onChange={(e) => onUpdateZoneTargetTemp(zone.id, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          )}
        </div>
      )}

      {/* Occupant View */}
      {occupant && (
        <div className="mt-3 space-y-3">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">Current Status:</span>
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Actively Working</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Role / Title:</span>
              <span className="text-white font-semibold">{occupant.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Zone:</span>
              <span className="text-cyan-300 font-semibold">{occupant.zoneId.replace('zone-', '').replace('-', ' ').toUpperCase()}</span>
            </div>
            {occupant.currentTask && (
              <div className="pt-1">
                <span className="text-slate-400 block mb-1">Active Work Task:</span>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed font-sans text-xs">
                  {occupant.currentTask}
                </div>
              </div>
            )}
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Primary Device:</span>
              <span className="text-amber-300 capitalize">{occupant.device || (occupant.isSeated ? 'Dual-Monitor Workstation' : 'Tablet')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Thermal Comfort Vote:</span>
              <span className="text-emerald-400 font-semibold">{occupant.comfortPerception}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Posture & Motion:</span>
              <span className="text-slate-300">
                {occupant.isSeated
                  ? 'Seated Typing at Ergonomic Workstation'
                  : occupant.action === 'presenting'
                  ? 'Presenting with gestures at Display Screen'
                  : occupant.action === 'troubleshooting'
                  ? 'Inspecting Server Racks with Diagnostic Tablet'
                  : 'Standing / Collaborating'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
