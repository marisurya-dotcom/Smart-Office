/**
 * Simulation Controls HUD bar: Time of Day, Speed, Weather Scenarios, and Demand Response.
 */

import React, { useState } from 'react';
import { WeatherCondition, DemandResponseMode, ZoneData } from '../../types/digitalTwin';
import { Sun, Cloud, CloudSun, Flame, Clock, Users, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface SimulationControlsProps {
  timeOfDayHours: number;
  onChangeTimeOfDay: (hours: number) => void;
  timeSpeed: number;
  onChangeTimeSpeed: (speed: number) => void;
  weather: WeatherCondition;
  onChangeWeather: (weather: WeatherCondition) => void;
  drMode: DemandResponseMode;
  onChangeDrMode: (mode: DemandResponseMode) => void;
  occupancyMultiplier: number;
  onChangeOccupancy: (multiplier: number) => void;
  outdoorTemp: number;
  solarIrradiance: number;
  zones?: ZoneData[];
  onApplyOccupancyScenario?: (scenario: 'all-working' | 'lunch-break' | 'evening-standby') => void;
  onToggleRoomOccupancy?: (zoneId: string) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  timeOfDayHours,
  onChangeTimeOfDay,
  timeSpeed,
  onChangeTimeSpeed,
  weather,
  onChangeWeather,
  drMode,
  onChangeDrMode,
  occupancyMultiplier,
  onChangeOccupancy,
  outdoorTemp,
  solarIrradiance,
  zones = [],
  onApplyOccupancyScenario,
  onToggleRoomOccupancy,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format time of day (e.g. 14.5 -> 14:30)
  const hours = Math.floor(timeOfDayHours);
  const minutes = Math.floor((timeOfDayHours - hours) * 60);
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const weatherIcons: Record<WeatherCondition, React.ReactNode> = {
    sunny: <Sun className="w-3.5 h-3.5 text-amber-400" />,
    'partly-cloudy': <CloudSun className="w-3.5 h-3.5 text-sky-400" />,
    overcast: <Cloud className="w-3.5 h-3.5 text-slate-400" />,
    heatwave: <Flame className="w-3.5 h-3.5 text-red-500" />,
  };

  return (
    <div className="absolute top-16 left-6 z-20 w-auto max-w-sm">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 shadow-2xl text-slate-200">
        {/* Primary Row: Time & Playback */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-sm font-semibold tracking-wide tabular-nums text-white">
              {formattedTime}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({hours >= 6 && hours <= 18 ? 'Day' : 'Night'})
            </span>
          </div>

          {/* Quick Speed Selector */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => onChangeTimeSpeed(0)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                timeSpeed === 0 ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pause
            </button>
            <button
              onClick={() => onChangeTimeSpeed(1)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                timeSpeed === 1 ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => onChangeTimeSpeed(5)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                timeSpeed === 5 ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              5x
            </button>
            <button
              onClick={() => onChangeTimeSpeed(30)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                timeSpeed === 30 ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30x
            </button>
          </div>

          {/* Expand toggler */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Expand scenario controls"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Time Scrubber Slider */}
        <div className="mt-2.5">
          <input
            type="range"
            min={0}
            max={23.95}
            step={0.1}
            value={timeOfDayHours}
            onChange={(e) => onChangeTimeOfDay(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Ambient summary metrics */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            {weatherIcons[weather]}
            <span>{outdoorTemp}°C Outdoor</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="tabular-nums">{solarIrradiance} W/m² Solar</span>
          </span>
        </div>

        {/* Expanded Controls Drawer */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3 animate-fade-in text-xs">
            {/* Quick Time Presets */}
            <div>
              <span className="text-[10px] text-slate-400 font-mono block mb-1">Time Presets:</span>
              <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
                <button
                  onClick={() => onChangeTimeOfDay(8.5)}
                  className="px-1.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded text-slate-300 text-center"
                >
                  08:30 Work
                </button>
                <button
                  onClick={() => onChangeTimeOfDay(12.5)}
                  className="px-1.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded text-slate-300 text-center"
                >
                  12:30 Peak
                </button>
                <button
                  onClick={() => onChangeTimeOfDay(16.0)}
                  className="px-1.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded text-slate-300 text-center"
                >
                  16:00 ToU
                </button>
                <button
                  onClick={() => onChangeTimeOfDay(21.5)}
                  className="px-1.5 py-1 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded text-slate-300 text-center"
                >
                  21:30 Night
                </button>
              </div>
            </div>

            {/* Weather Condition */}
            <div>
              <span className="text-[10px] text-slate-400 font-mono block mb-1">Weather Climate:</span>
              <div className="grid grid-cols-4 gap-1">
                {(['sunny', 'partly-cloudy', 'overcast', 'heatwave'] as WeatherCondition[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => onChangeWeather(w)}
                    className={`px-1.5 py-1 rounded text-[11px] capitalize flex items-center justify-center gap-1 border transition-colors ${
                      weather === w
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {w === 'sunny' && 'Sunny'}
                    {w === 'partly-cloudy' && 'Cloudy'}
                    {w === 'overcast' && 'Overcast'}
                    {w === 'heatwave' && 'Heatwave'}
                  </button>
                ))}
              </div>
            </div>

            {/* Demand Response Mode */}
            <div>
              <span className="text-[10px] text-slate-400 font-mono block mb-1">Energy Optimization Mode:</span>
              <select
                value={drMode}
                onChange={(e) => onChangeDrMode(e.target.value as DemandResponseMode)}
                aria-label="Energy Optimization Mode"
                className="w-full px-2 py-1 bg-slate-950 border border-slate-800 text-slate-200 rounded font-mono text-[11px] focus:outline-none focus:border-cyan-500"
              >
                <option value="normal">Normal Operation (Max Comfort)</option>
                <option value="eco-comfort">Eco-Comfort (+1°C drift, -15% light)</option>
                <option value="peak-shave">Peak Shave Mode (Active BESS dispatch)</option>
                <option value="dr-curtailment">Demand Response Curtailment (-30% load)</option>
              </select>
            </div>

            {/* Occupancy Multiplier & Intelligence Scenarios */}
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400" />
                  <span>Workplace Occupancy</span>
                </span>
                <span className="tabular-nums text-slate-200">{Math.round(occupancyMultiplier * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1.0}
                step={0.05}
                value={occupancyMultiplier}
                onChange={(e) => onChangeOccupancy(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              {/* Smart Building Occupancy Presets */}
              {onApplyOccupancyScenario && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">
                    Smart Occupancy Presets:
                  </span>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                    <button
                      onClick={() => onApplyOccupancyScenario('all-working')}
                      className="px-1.5 py-1 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded text-slate-200 hover:text-cyan-300 text-center transition-colors"
                      title="All 12 workstations occupied with active workers"
                    >
                      🏢 All Working
                    </button>
                    <button
                      onClick={() => onApplyOccupancyScenario('lunch-break')}
                      className="px-1.5 py-1 bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded text-slate-200 hover:text-amber-300 text-center transition-colors"
                      title="Meeting room and executive suite vacated - demonstrates auto-dimming & setback"
                    >
                      ☕ Lunch Break
                    </button>
                    <button
                      onClick={() => onApplyOccupancyScenario('evening-standby')}
                      className="px-1.5 py-1 bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded text-slate-200 hover:text-sky-300 text-center transition-colors"
                      title="Only server room active - maximum energy reduction"
                    >
                      🌙 Standby
                    </button>
                  </div>
                </div>
              )}

              {/* Room-by-room Occupancy Toggles */}
              {onToggleRoomOccupancy && zones.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1.5">
                    <span>Room Sensor Automation:</span>
                    <span className="text-cyan-400 text-[9px]">Click to Toggle Vacancy</span>
                  </div>
                  <div className="space-y-1">
                    {zones.map((z) => {
                      const isOcc = z.occupancySensor.isOccupied;
                      return (
                        <button
                          key={z.id}
                          onClick={() => onToggleRoomOccupancy(z.id)}
                          className={`w-full px-2 py-1 rounded text-[11px] font-mono flex items-center justify-between border transition-all ${
                            isOcc
                              ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-cyan-500/40'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOcc ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'
                              }`}
                            />
                            <span className="truncate max-w-[140px]">{z.name}</span>
                          </span>
                          <span className="text-[10px] tabular-nums">
                            {isOcc ? `${z.occupancyCount} Occ · ${z.lightingDimmablePercent}% Lux` : 'VACANT (Eco Setback)'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Simulation Notice Disclaimer */}
              <div className="mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 leading-tight">
                Simulated AI camera & PIR sensors drive automated setback and lighting dimming.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
