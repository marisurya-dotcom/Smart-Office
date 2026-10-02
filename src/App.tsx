/**
 * Smart Office 3D Digital Twin - Main Application Container.
 * Integrates 3D WebGL isometric cutaway view with Comfort, Energy,
 * and Grid & Renewable intelligence engines.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ViewMode,
  CameraPreset,
  WeatherCondition,
  DemandResponseMode,
  ZoneData,
  ElectricalLoads,
  RenewableGridState,
  EquipmentItem,
  OccupantAvatar,
} from './types/digitalTwin';
import {
  INITIAL_ZONES,
  INITIAL_EQUIPMENT,
  INITIAL_OCCUPANTS,
  simulateTick,
  computeOutdoorConditions,
} from './utils/simulationEngine';
import { OfficeScene } from './components/3d/OfficeScene';
import { TopNavigation } from './components/hud/TopNavigation';
import { SimulationControls } from './components/hud/SimulationControls';
import { EnergyFlowDiagram } from './components/hud/EnergyFlowDiagram';
import { ComfortEnginePanel } from './components/engines/ComfortEnginePanel';
import { EnergyEnginePanel } from './components/engines/EnergyEnginePanel';
import { GridRenewablePanel } from './components/engines/GridRenewablePanel';
import { EquipmentDetailDrawer } from './components/modals/EquipmentDetailDrawer';
import { Zap, ChevronRight, Layers, SlidersHorizontal, Info } from 'lucide-react';

export default function App() {
  // Simulation Clock & Environment States
  const [timeOfDayHours, setTimeOfDayHours] = useState(13.5); // 13:30 (Daytime Solar Peak)
  const [timeSpeed, setTimeSpeed] = useState(1);
  const [weather, setWeather] = useState<WeatherCondition>('sunny');
  const [drMode, setDrMode] = useState<DemandResponseMode>('normal');
  const [occupancyMultiplier, setOccupancyMultiplier] = useState(0.85);

  // View & UI Navigation States
  const [activeEngineTab, setActiveEngineTab] = useState<'comfort' | 'energy' | 'grid'>('comfort');
  const [viewMode, setViewMode] = useState<ViewMode>('architectural');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [showEnergyFlowOverlay, setShowEnergyFlowOverlay] = useState(false);
  const [isEngineDrawerOpen, setIsEngineDrawerOpen] = useState(true);

  // Telemetry & Entity Data
  const [zones, setZones] = useState<ZoneData[]>(INITIAL_ZONES);
  const [equipment, setEquipment] = useState<EquipmentItem[]>(INITIAL_EQUIPMENT);
  const [occupants, setOccupants] = useState<OccupantAvatar[]>(INITIAL_OCCUPANTS);

  const [loads, setLoads] = useState<ElectricalLoads>({
    hvacKw: 24.6,
    lightingKw: 8.4,
    computersKw: 14.8,
    waterMotorKw: 4.2,
    totalDemandKw: 52.0,
    powerFactor: 0.98,
  });

  const [renewable, setRenewable] = useState<RenewableGridState>({
    solarPvKw: 31.8,
    solarIrradiance: 840,
    solarDailyKwh: 142.5,
    batterySoc: 78.0,
    batteryPowerKw: 12.0, // Discharging to shave grid
    batteryCapacityKwh: 100,
    batteryHealthSoH: 99.2,
    batteryMode: 'discharging',
    gridImportKw: 8.2,
    gridCarbonIntensity: 240,
    electricityPriceKwh: 0.18,
    tariffPeriod: 'mid-peak',
    dailyCostAvoided: 34.2,
    carbonAvoidedKg: 78.4,
    cleanEnergyRatio: 84,
    drEventActive: false,
  });

  // Selected asset for inspection
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<'equipment' | 'zone' | 'occupant' | null>(null);

  // Compute outdoor ambient metrics
  const { outdoorTemp, solarIrradiance } = computeOutdoorConditions(timeOfDayHours, weather);

  // Simulation Clock Tick Loop
  useEffect(() => {
    if (timeSpeed === 0) return;

    const interval = setInterval(() => {
      setTimeOfDayHours((prevHours) => {
        // Advance clock by (timeSpeed * 10 seconds per tick)
        const stepHours = (10 * timeSpeed) / 3600;
        let nextHours = prevHours + stepHours;
        if (nextHours >= 24) nextHours = 0;
        return nextHours;
      });

      // Update simulation physics
      setZones((prevZones) => {
        const result = simulateTick(
          prevZones,
          renewable,
          timeOfDayHours,
          weather,
          drMode,
          occupancyMultiplier,
          10 * timeSpeed
        );
        setLoads(result.loads);
        setRenewable(result.renewable);
        return result.zones;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeSpeed, timeOfDayHours, weather, drMode, occupancyMultiplier]);

  // Handle entity selection from 3D scene or UI
  const handleSelectEntity = (id: string, type: 'zone' | 'equipment' | 'occupant') => {
    setSelectedEntityId(id);
    setSelectedEntityType(type);
  };

  // Trigger simulated Demand Response Peak Event
  const handleTriggerDrEvent = () => {
    if (drMode === 'dr-curtailment') {
      setDrMode('normal');
      setRenewable((r) => ({ ...r, drEventActive: false }));
    } else {
      setDrMode('dr-curtailment');
      setRenewable((r) => ({ ...r, drEventActive: true }));
    }
  };

  // Update target temperature for a zone
  const handleUpdateZoneTargetTemp = (zoneId: string, newTarget: number) => {
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, targetTemp: newTarget } : z))
    );
  };

  // Update blinds position for a zone
  const handleUpdateZoneBlinds = (zoneId: string, newBlinds: number) => {
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, blindsPositionPercent: newBlinds } : z))
    );
  };

  // Toggle individual room occupancy (for smart sensor automation demo)
  const handleToggleRoomOccupancy = (zoneId: string) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id === zoneId) {
          const isCurrentlyOccupied = z.occupancyCount > 0;
          const newCount = isCurrentlyOccupied ? 0 : Math.round(z.maxOccupancy * 0.75);
          return {
            ...z,
            occupancyCount: newCount,
            occupancySensor: {
              ...z.occupancySensor,
              isOccupied: !isCurrentlyOccupied,
              pirDetected: !isCurrentlyOccupied,
              cameraPersonCount: newCount,
              activityLevel: !isCurrentlyOccupied ? 'Active' : 'Vacant',
            },
          };
        }
        return z;
      })
    );
  };

  // Quick Occupancy Scenario Presets
  const handleApplyOccupancyScenario = (scenario: 'all-working' | 'lunch-break' | 'evening-standby') => {
    if (scenario === 'all-working') {
      setTimeOfDayHours(11.0);
      setOccupancyMultiplier(1.0);
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          occupancyCount: Math.round(z.maxOccupancy * 0.8),
          occupancySensor: {
            ...z.occupancySensor,
            isOccupied: true,
            pirDetected: true,
            cameraPersonCount: Math.round(z.maxOccupancy * 0.8),
            activityLevel: 'Active',
          },
        }))
      );
    } else if (scenario === 'lunch-break') {
      setTimeOfDayHours(12.5);
      setZones((prev) =>
        prev.map((z) => {
          if (z.id === 'zone-boardroom' || z.id === 'zone-executive') {
            return {
              ...z,
              occupancyCount: 0,
              occupancySensor: {
                ...z.occupancySensor,
                isOccupied: false,
                pirDetected: false,
                cameraPersonCount: 0,
                activityLevel: 'Vacant',
              },
            };
          }
          return z;
        })
      );
    } else if (scenario === 'evening-standby') {
      setTimeOfDayHours(21.0);
      setOccupancyMultiplier(0.1);
      setZones((prev) =>
        prev.map((z) => {
          if (z.type !== 'server') {
            return {
              ...z,
              occupancyCount: 0,
              occupancySensor: {
                ...z.occupancySensor,
                isOccupied: false,
                pirDetected: false,
                cameraPersonCount: 0,
                activityLevel: 'Vacant',
              },
            };
          }
          return z;
        })
      );
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* 1. TOP BAR CONTRACT */}
      <TopNavigation
        activeEngineTab={activeEngineTab}
        onChangeEngineTab={(tab) => {
          setActiveEngineTab(tab);
          setIsEngineDrawerOpen(true);
        }}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        cameraPreset={cameraPreset}
        onChangeCameraPreset={setCameraPreset}
        timeSpeed={timeSpeed}
        onToggleTimeSpeed={() => setTimeSpeed(timeSpeed > 0 ? 0 : 1)}
        onTriggerDrEvent={handleTriggerDrEvent}
        isDrActive={drMode === 'dr-curtailment'}
      />

      {/* 2. MAIN 3D VIEWPORT CANVAS */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <OfficeScene
          viewMode={viewMode}
          cameraPreset={cameraPreset}
          timeOfDayHours={timeOfDayHours}
          zones={zones}
          loads={loads}
          renewable={renewable}
          occupants={occupants}
          selectedEntityId={selectedEntityId}
          onSelectEntity={handleSelectEntity}
        />

        {/* 3. SIMULATION CONTROLS FLOATING HUD (Top Left) */}
        <SimulationControls
          timeOfDayHours={timeOfDayHours}
          onChangeTimeOfDay={setTimeOfDayHours}
          timeSpeed={timeSpeed}
          onChangeTimeSpeed={setTimeSpeed}
          weather={weather}
          onChangeWeather={setWeather}
          drMode={drMode}
          onChangeDrMode={setDrMode}
          occupancyMultiplier={occupancyMultiplier}
          onChangeOccupancy={setOccupancyMultiplier}
          outdoorTemp={outdoorTemp}
          solarIrradiance={solarIrradiance}
          zones={zones}
          onApplyOccupancyScenario={handleApplyOccupancyScenario}
          onToggleRoomOccupancy={handleToggleRoomOccupancy}
        />

        {/* 4. ELECTRICAL ENERGY FLOW TOGGLE BUTTON & MODAL (Mandatory Architecture) */}
        <div className="absolute top-16 right-6 z-20 flex flex-col items-end gap-2">
          <button
            onClick={() => setShowEnergyFlowOverlay(!showEnergyFlowOverlay)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border shadow-2xl backdrop-blur-md transition-all ${
              showEnergyFlowOverlay
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900/90 text-slate-200 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Electrical Energy Flow</span>
            <span className="text-[10px] font-mono text-cyan-400">({loads.totalDemandKw} kW)</span>
          </button>

          {/* Quick Layer Switch Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 text-[11px] font-mono">
            <button
              onClick={() => setViewMode('architectural')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                viewMode === 'architectural' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Architectural
            </button>
            <button
              onClick={() => setViewMode('energy-flow')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                viewMode === 'energy-flow' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Energy Cables
            </button>
            <button
              onClick={() => setViewMode('thermal-heatmap')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                viewMode === 'thermal-heatmap' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PMV Heatmap
            </button>
            <button
              onClick={() => setViewMode('airflow-ducts')}
              className={`px-2 py-1 rounded-lg transition-colors ${
                viewMode === 'airflow-ducts' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              HVAC Ducts
            </button>
          </div>
        </div>

        {/* Floating Energy Flow Diagram Dialog */}
        {showEnergyFlowOverlay && (
          <div className="absolute top-32 right-6 z-30 w-[440px] max-w-[calc(100vw-3rem)] animate-slide-in">
            <EnergyFlowDiagram
              loads={loads}
              renewable={renewable}
              onSelectEquipment={(id) => handleSelectEntity(id, 'equipment')}
            />
          </div>
        )}

        {/* 5. ACTIVE INTELLIGENCE ENGINE DOCK (Bottom Drawer) */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ${
            isEngineDrawerOpen ? 'translate-y-0' : 'translate-y-[calc(100%-44px)]'
          }`}
        >
          <div className="max-w-6xl mx-auto px-4">
            {/* Drawer Handle */}
            <div className="flex justify-between items-center bg-slate-900/95 backdrop-blur-xl border-t border-x border-slate-800 rounded-t-xl px-4 py-2 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white uppercase tracking-wider">
                  Engine: {activeEngineTab.toUpperCase()}
                </span>
                <span>·</span>
                <span className="text-slate-400">
                  {activeEngineTab === 'comfort' && 'ASHRAE 55 Occupant Thermal Perception & Air Quality'}
                  {activeEngineTab === 'energy' && 'Power Distribution, EUI & Subsystem Loads'}
                  {activeEngineTab === 'grid' && 'Solar Photovoltaics & Battery Energy Storage (BESS)'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEngineDrawerOpen(!isEngineDrawerOpen)}
                  className="hover:text-white font-mono text-[11px] underline"
                >
                  {isEngineDrawerOpen ? 'Minimize Engine Dock' : 'Expand Engine Dock'}
                </button>
              </div>
            </div>

            {/* Engine Body Content */}
            <div className="bg-slate-950/95 backdrop-blur-2xl border-x border-slate-800 p-4 max-h-[360px] overflow-y-auto shadow-2xl">
              {activeEngineTab === 'comfort' && (
                <ComfortEnginePanel
                  zones={zones}
                  occupants={occupants}
                  onUpdateZoneTargetTemp={handleUpdateZoneTargetTemp}
                  onUpdateZoneBlinds={handleUpdateZoneBlinds}
                  onSelectZone={(zId) => handleSelectEntity(zId, 'zone')}
                  onSelectOccupant={(occId) => handleSelectEntity(occId, 'occupant')}
                />
              )}

              {activeEngineTab === 'energy' && (
                <EnergyEnginePanel
                  loads={loads}
                  drMode={drMode}
                  onChangeDrMode={setDrMode}
                  onSelectEquipment={(eqId) => handleSelectEntity(eqId, 'equipment')}
                />
              )}

              {activeEngineTab === 'grid' && (
                <GridRenewablePanel
                  renewable={renewable}
                  onTriggerDrEvent={handleTriggerDrEvent}
                  onSelectEquipment={(eqId) => handleSelectEntity(eqId, 'equipment')}
                />
              )}
            </div>

            {/* Bottom Status & Simulation Disclaimer Strip */}
            <div className="bg-slate-950 border-t border-slate-800/80 px-4 py-2 text-[11px] font-mono text-slate-500 flex flex-wrap items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-cyan-400/80" />
                <span>Simulation Digital Twin · Continuous thermodynamic & electrical state machine</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <span>Building Area: 864 m²</span>
                <span>·</span>
                <span>Active Loads: 4 Feeders</span>
                <span>·</span>
                <span>BESS Capacity: 100 kWh</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. EQUIPMENT & ZONE INSPECTION DRAWER */}
        <EquipmentDetailDrawer
          entityId={selectedEntityId}
          entityType={selectedEntityType}
          equipmentList={equipment}
          zonesList={zones}
          occupantsList={occupants}
          onClose={() => {
            setSelectedEntityId(null);
            setSelectedEntityType(null);
          }}
          onUpdateZoneTargetTemp={handleUpdateZoneTargetTemp}
        />
      </div>
    </div>
  );
}
