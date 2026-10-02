/**
 * Types and interfaces for the Smart Building 3D Digital Twin simulation.
 */

export type ViewMode = 'architectural' | 'energy-flow' | 'thermal-heatmap' | 'airflow-ducts' | 'lighting-lux' | 'occupancy-sensors';

export type CameraPreset = 'isometric' | 'workspace' | 'boardroom' | 'server-room' | 'utility-plant' | 'top-down';

export type WeatherCondition = 'sunny' | 'partly-cloudy' | 'overcast' | 'heatwave';

export type DemandResponseMode = 'normal' | 'eco-comfort' | 'peak-shave' | 'dr-curtailment';

export interface OccupancySensorTelemetry {
  pirDetected: boolean;
  cameraPersonCount: number;
  activityLevel: 'Sedentary' | 'Active' | 'High Activity' | 'Vacant';
  roomUsagePercent: number;
  hvacDemandLevel: 'Normal' | 'Setback Eco' | 'Standby';
  lightingDemandLevel: 'Active' | 'Daylight Harvest' | 'Dimmed Standby' | 'Off';
  isOccupied: boolean;
  energySavingsKw: number;
}

export interface ZoneData {
  id: string;
  name: string;
  type: 'workspace' | 'boardroom' | 'executive' | 'server' | 'utility' | 'breakout';
  temperature: number; // °C
  targetTemp: number; // °C
  humidity: number; // % RH
  co2: number; // ppm
  voc: number; // mg/m³
  lux: number; // lux
  acoustic: number; // dBA
  occupancyCount: number;
  maxOccupancy: number;
  pmv: number; // -3 to +3
  ppd: number; // %
  hvacAirflowRate: number; // CFM
  lightingDimmablePercent: number; // 0 - 100%
  blindsPositionPercent: number; // 0 - 100%
  position3D: [number, number, number];
  dimensions: [number, number, number];
  occupancySensor: OccupancySensorTelemetry;
}

export interface ElectricalLoads {
  hvacKw: number;
  lightingKw: number;
  computersKw: number;
  waterMotorKw: number;
  totalDemandKw: number;
  powerFactor: number;
}

export interface RenewableGridState {
  solarPvKw: number;
  solarIrradiance: number; // W/m²
  solarDailyKwh: number;
  batterySoc: number; // % (0 - 100)
  batteryPowerKw: number; // positive = discharging, negative = charging
  batteryCapacityKwh: number;
  batteryHealthSoH: number; // %
  batteryMode: 'charging' | 'discharging' | 'idle' | 'standby';
  gridImportKw: number; // positive = importing, negative = exporting
  gridCarbonIntensity: number; // g CO2/kWh
  electricityPriceKwh: number; // $ / kWh
  tariffPeriod: 'off-peak' | 'mid-peak' | 'on-peak';
  dailyCostAvoided: number; // $
  carbonAvoidedKg: number; // kg CO2
  cleanEnergyRatio: number; // 0 - 100%
  drEventActive: boolean;
}

export interface SimulationState {
  timeOfDayHours: number; // 0.0 - 24.0 (e.g. 14.5 = 14:30)
  timeSpeed: number; // 0 = paused, 1 = 1x real-time (fast-simulated), 5 = 5x, 30 = 30x
  weather: WeatherCondition;
  outdoorTemp: number; // °C
  outdoorHumidity: number; // %
  outdoorLux: number; // lux
  drMode: DemandResponseMode;
  occupancyMultiplier: number; // 0.0 - 1.0
  activeEngineTab: 'comfort' | 'energy' | 'grid';
  viewMode: ViewMode;
  cameraPreset: CameraPreset;
  selectedEntityId: string | null;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'electrical' | 'hvac' | 'plumbing' | 'renewable' | 'it';
  status: 'optimal' | 'warning' | 'standby';
  loadKw: number;
  healthPercent: number;
  metrics: { label: string; value: string; unit?: string }[];
  description: string;
  position3D: [number, number, number];
}

export interface OccupantAvatar {
  id: string;
  name: string;
  role: string;
  zoneId: string;
  position: [number, number, number];
  rotation: number;
  isSeated: boolean;
  comfortPerception: 'Comfortable' | 'Slightly Warm' | 'Cool' | 'Ideal';
  action?: 'coding' | 'presenting' | 'reviewing' | 'analyzing' | 'troubleshooting' | 'collaborating' | 'coffee';
  currentTask?: string;
  device?: 'dual-monitor' | 'laptop' | 'tablet' | 'smartboard' | 'coffee-mug';
  pose?: 'focused-typing' | 'mouse-review' | 'thinking-leanback' | 'discussion-gesturing' | 'discussion-listening' | 'walking-corridor' | 'presenting' | 'tablet-inspecting' | 'coffee-break';
  activeInScene?: boolean;
}
