/**
 * Physics and behavior simulation engine for the Smart Building Digital Twin.
 * Computes realistic thermodynamic, electrical, and renewable telemetry.
 */

import {
  ZoneData,
  ElectricalLoads,
  RenewableGridState,
  WeatherCondition,
  DemandResponseMode,
  EquipmentItem,
  OccupantAvatar,
} from '../types/digitalTwin';

/**
 * Calculates Fanger's PMV (Predicted Mean Vote) and PPD (Predicted Percentage Dissatisfied)
 * according to ISO 7730 / ASHRAE 55.
 */
export function calculatePmvPpd(
  tempC: number,
  relativeHumidityPercent: number,
  airVelocityMps: number = 0.15,
  clothingClo: number = 0.6,
  metabolicRateMet: number = 1.1
): { pmv: number; ppd: number } {
  const ta = tempC;
  const tr = tempC; // Mean radiant temperature assumed equal to air temp in balanced indoor space
  const vel = airVelocityMps;
  const rh = relativeHumidityPercent;
  const met = metabolicRateMet * 58.15; // W/m2
  const w = 0; // External work
  const mw = met - w;
  const icl = 0.155 * clothingClo;

  // Saturated vapor pressure at ta in Pa
  const pa = rh * 10 * Math.exp(16.6536 - 4030.183 / (ta + 235));

  // Iterative calculation of surface clothing temperature
  const fcl = icl < 0.078 ? 1.0 + 1.29 * icl : 1.05 + 0.645 * icl;
  const hcf = 12.1 * Math.sqrt(vel);
  const taa = ta + 273;
  const tra = tr + 273;
  let tcla = taa + (35.5 - ta) / (3.5 * (6.45 * icl + 0.1));

  let tcl = tcla;
  for (let i = 0; i < 20; i++) {
    const hcn = 2.38 * Math.pow(Math.abs(100 * tcl - 100 * taa) / 100, 0.25);
    const hc = Math.max(hcf, hcn);
    const xn = (tcla + tra) / 2;
    const xf = (tcla - tra) / 2;
    const rad = 3.96 * Math.pow(10, -8) * fcl * (Math.pow(tcl, 4) - Math.pow(tra, 4));
    const conv = fcl * hc * (tcl - taa);
    tcl = taa + (mw - 3.05 * 0.001 * (5733 - 6.99 * mw - pa) - 0.42 * (mw - 58.15) - 1.7 * 0.00001 * met * (5867 - pa) - 0.0014 * met * (34 - ta) - rad) / (fcl * hc);
  }

  // Thermal sensation index
  const ts = 0.30324 * Math.exp(-0.036 * met) + 0.028;
  const pmvRaw = ts * (mw - 3.05 * 0.001 * (5733 - 6.99 * mw - pa) - 0.42 * (mw - 58.15) - 1.7 * 0.00001 * met * (5867 - pa) - 0.0014 * met * (34 - ta) - 3.96 * Math.pow(10, -8) * fcl * (Math.pow(tcl, 4) - Math.pow(tra, 4)) - fcl * Math.max(hcf, 2.38 * Math.pow(Math.abs(tcl - taa), 0.25)) * (tcl - taa));
  
  const pmv = Math.max(-3.0, Math.min(3.0, Number(pmvRaw.toFixed(2))));
  const ppdRaw = 100.0 - 95.0 * Math.exp(-0.03353 * Math.pow(pmv, 4) - 0.2179 * Math.pow(pmv, 2));
  const ppd = Math.max(5.0, Math.min(100.0, Number(ppdRaw.toFixed(1))));

  return { pmv, ppd };
}

/**
 * Computes outdoor environment (temperature, solar irradiance, lux) based on time of day & weather.
 */
export function computeOutdoorConditions(timeHours: number, weather: WeatherCondition) {
  // Peak heat around 15:00, coolest at 05:00
  const normalizedHour = (timeHours - 5 + 24) % 24;
  const tempWave = Math.sin((normalizedHour / 24) * 2 * Math.PI - Math.PI / 2); // -1 at 5am, +1 at 15pm
  
  let baseTemp = 24;
  let tempSwing = 7;
  let weatherIrradianceFactor = 1.0;

  switch (weather) {
    case 'sunny':
      baseTemp = 26;
      tempSwing = 8;
      weatherIrradianceFactor = 1.0;
      break;
    case 'partly-cloudy':
      baseTemp = 23;
      tempSwing = 6;
      weatherIrradianceFactor = 0.72;
      break;
    case 'overcast':
      baseTemp = 20;
      tempSwing = 4;
      weatherIrradianceFactor = 0.35;
      break;
    case 'heatwave':
      baseTemp = 33;
      tempSwing = 9;
      weatherIrradianceFactor = 0.95;
      break;
  }

  const outdoorTemp = Number((baseTemp + tempWave * (tempSwing / 2)).toFixed(1));

  // Sun elevation: sunrise ~ 6:00, peak 12:30, sunset ~ 19:30
  let solarIrradiance = 0;
  let outdoorLux = 50; // Night moonlight/ambient

  if (timeHours >= 6.0 && timeHours <= 19.5) {
    const sunProgress = (timeHours - 6.0) / (19.5 - 6.0); // 0 to 1
    const sunCurve = Math.sin(sunProgress * Math.PI); // 0 -> 1 -> 0
    solarIrradiance = Math.round(sunCurve * 950 * weatherIrradianceFactor);
    outdoorLux = Math.round(sunCurve * 75000 * weatherIrradianceFactor + 300);
  }

  return { outdoorTemp, solarIrradiance, outdoorLux };
}

/**
 * Computes dynamic Time of Use (ToU) electricity price and period.
 */
export function computeTariff(timeHours: number): {
  priceKwh: number;
  period: 'off-peak' | 'mid-peak' | 'on-peak';
} {
  // On-Peak: 14:00 - 19:00 ($0.32/kWh)
  // Mid-Peak: 07:00 - 14:00 & 19:00 - 22:00 ($0.18/kWh)
  // Off-Peak: 22:00 - 07:00 ($0.09/kWh)
  if (timeHours >= 14.0 && timeHours < 19.0) {
    return { priceKwh: 0.32, period: 'on-peak' };
  } else if ((timeHours >= 7.0 && timeHours < 14.0) || (timeHours >= 19.0 && timeHours < 22.0)) {
    return { priceKwh: 0.18, period: 'mid-peak' };
  } else {
    return { priceKwh: 0.09, period: 'off-peak' };
  }
}

/**
 * Initial building zones setup with realistic 3D coordinates.
 */
export const INITIAL_ZONES: ZoneData[] = [
  {
    id: 'zone-open-office',
    name: 'Open Workspace Pods',
    type: 'workspace',
    temperature: 22.4,
    targetTemp: 22.5,
    humidity: 45,
    co2: 560,
    voc: 0.11,
    lux: 540,
    acoustic: 44,
    occupancyCount: 16,
    maxOccupancy: 20,
    pmv: -0.12,
    ppd: 5.6,
    hvacAirflowRate: 1450,
    lightingDimmablePercent: 65,
    blindsPositionPercent: 30,
    position3D: [-3, 0, -2],
    dimensions: [18, 3.5, 12],
    occupancySensor: {
      pirDetected: true,
      cameraPersonCount: 16,
      activityLevel: 'Active',
      roomUsagePercent: 80,
      hvacDemandLevel: 'Normal',
      lightingDemandLevel: 'Daylight Harvest',
      isOccupied: true,
      energySavingsKw: 2.4,
    },
  },
  {
    id: 'zone-boardroom',
    name: 'Executive Boardroom',
    type: 'boardroom',
    temperature: 21.8,
    targetTemp: 22.0,
    humidity: 44,
    co2: 680,
    voc: 0.14,
    lux: 480,
    acoustic: 38,
    occupancyCount: 6,
    maxOccupancy: 10,
    pmv: -0.18,
    ppd: 6.1,
    hvacAirflowRate: 680,
    lightingDimmablePercent: 80,
    blindsPositionPercent: 50,
    position3D: [9, 0, -5],
    dimensions: [9, 3.5, 7],
    occupancySensor: {
      pirDetected: true,
      cameraPersonCount: 6,
      activityLevel: 'High Activity',
      roomUsagePercent: 60,
      hvacDemandLevel: 'Normal',
      lightingDemandLevel: 'Active',
      isOccupied: true,
      energySavingsKw: 1.1,
    },
  },
  {
    id: 'zone-executive',
    name: 'Focus & Executive Suite',
    type: 'executive',
    temperature: 22.6,
    targetTemp: 22.5,
    humidity: 46,
    co2: 510,
    voc: 0.08,
    lux: 510,
    acoustic: 34,
    occupancyCount: 2,
    maxOccupancy: 4,
    pmv: 0.05,
    ppd: 5.1,
    hvacAirflowRate: 380,
    lightingDimmablePercent: 70,
    blindsPositionPercent: 25,
    position3D: [9, 0, 3],
    dimensions: [9, 3.5, 6],
    occupancySensor: {
      pirDetected: true,
      cameraPersonCount: 2,
      activityLevel: 'Sedentary',
      roomUsagePercent: 50,
      hvacDemandLevel: 'Normal',
      lightingDemandLevel: 'Daylight Harvest',
      isOccupied: true,
      energySavingsKw: 0.8,
    },
  },
  {
    id: 'zone-server',
    name: 'IT & Data Center',
    type: 'server',
    temperature: 19.5,
    targetTemp: 19.0,
    humidity: 40,
    co2: 410,
    voc: 0.05,
    lux: 280,
    acoustic: 62,
    occupancyCount: 0,
    maxOccupancy: 2,
    pmv: -0.85,
    ppd: 21.0,
    hvacAirflowRate: 2100,
    lightingDimmablePercent: 20,
    blindsPositionPercent: 100,
    position3D: [-11, 0, -5],
    dimensions: [6, 3.5, 7],
    occupancySensor: {
      pirDetected: false,
      cameraPersonCount: 0,
      activityLevel: 'Vacant',
      roomUsagePercent: 0,
      hvacDemandLevel: 'Normal', // Continuous CRAC cooling for servers
      lightingDemandLevel: 'Dimmed Standby',
      isOccupied: false,
      energySavingsKw: 0.5,
    },
  },
  {
    id: 'zone-breakout',
    name: 'Social Lounge & Cafe',
    type: 'breakout',
    temperature: 23.1,
    targetTemp: 23.0,
    humidity: 48,
    co2: 590,
    voc: 0.16,
    lux: 420,
    acoustic: 52,
    occupancyCount: 4,
    maxOccupancy: 12,
    pmv: 0.22,
    ppd: 6.4,
    hvacAirflowRate: 520,
    lightingDimmablePercent: 85,
    blindsPositionPercent: 0,
    position3D: [-11, 0, 3],
    dimensions: [6, 3.5, 6],
    occupancySensor: {
      pirDetected: true,
      cameraPersonCount: 4,
      activityLevel: 'Active',
      roomUsagePercent: 33,
      hvacDemandLevel: 'Normal',
      lightingDemandLevel: 'Active',
      isOccupied: true,
      energySavingsKw: 0.6,
    },
  },
];

/**
 * Initial building equipment list with spatial positions.
 */
export const INITIAL_EQUIPMENT: EquipmentItem[] = [
  {
    id: 'equip-mdp',
    name: 'Main Electrical Distribution Panel (MDP)',
    category: 'electrical',
    status: 'optimal',
    loadKw: 48.6,
    healthPercent: 99.2,
    position3D: [-13, 1.6, -7.5],
    metrics: [
      { label: 'Bus Voltage', value: '480', unit: 'V 3-Phase' },
      { label: 'Current', value: '62.4', unit: 'A' },
      { label: 'Power Factor', value: '0.98', unit: 'Lagging' },
      { label: 'THD (Harmonics)', value: '1.8', unit: '%' },
      { label: 'Enclosure Temp', value: '31.2', unit: '°C' },
    ],
    description: 'Central low-voltage switchgear distributing power to HVAC chillers, lighting buses, IT rack subpanels, and mechanical booster pumps.',
  },
  {
    id: 'equip-hvac-unit',
    name: 'Rooftop Variable Refrigerant HVAC Unit',
    category: 'hvac',
    status: 'optimal',
    loadKw: 22.4,
    healthPercent: 97.8,
    position3D: [-8, 4.2, -6],
    metrics: [
      { label: 'Cooling Capacity', value: '45.0', unit: 'TR' },
      { label: 'COP Efficiency', value: '4.2', unit: 'COP' },
      { label: 'Supply Air Temp', value: '13.8', unit: '°C' },
      { label: 'Return Air Temp', value: '23.2', unit: '°C' },
      { label: 'Variable Speed', value: '68', unit: '%' },
    ],
    description: 'High-efficiency heat pump with variable speed magnetic-bearing compressor and economizer cycle for free-cooling when ambient temp allows.',
  },
  {
    id: 'equip-water-pump',
    name: 'Potable & HVAC Booster Pump Station',
    category: 'plumbing',
    status: 'optimal',
    loadKw: 4.2,
    healthPercent: 98.4,
    position3D: [-13.5, 0.8, -3],
    metrics: [
      { label: 'Discharge Pressure', value: '58.5', unit: 'PSI' },
      { label: 'Flow Rate', value: '42.0', unit: 'GPM' },
      { label: 'VFD Speed', value: '1720', unit: 'RPM' },
      { label: 'Vibration RMS', value: '1.1', unit: 'mm/s' },
      { label: 'Motor Winding Temp', value: '48.2', unit: '°C' },
    ],
    description: 'Dual vertical multistage centrifugal pumps with Variable Frequency Drives maintaining constant pressure across multi-fixture plumbing and hydronic loops.',
  },
  {
    id: 'equip-solar-pv',
    name: 'Monocrystalline Rooftop Solar Array',
    category: 'renewable',
    status: 'optimal',
    loadKw: 31.8,
    healthPercent: 99.5,
    position3D: [2, 4.3, 0],
    metrics: [
      { label: 'Array Capacity', value: '42.0', unit: 'kWp' },
      { label: 'Inverter Efficiency', value: '98.4', unit: '%' },
      { label: 'DC Voltage', value: '640', unit: 'V' },
      { label: 'Tilt Angle', value: '22', unit: '° South' },
      { label: 'Module Temp', value: '38.4', unit: '°C' },
    ],
    description: '108 high-efficiency Tier 1 bifacial solar PV modules capturing direct and albedo irradiance to provide green on-site energy.',
  },
  {
    id: 'equip-bess-battery',
    name: 'Lithium Iron Phosphate BESS Rack',
    category: 'renewable',
    status: 'optimal',
    loadKw: 12.0,
    healthPercent: 99.1,
    position3D: [-13.5, 1.4, 1.5],
    metrics: [
      { label: 'Pack Capacity', value: '100', unit: 'kWh' },
      { label: 'State of Charge', value: '78', unit: '%' },
      { label: 'Cell Balance Delta', value: '12', unit: 'mV' },
      { label: 'Cycle Life Count', value: '342', unit: 'Cycles' },
      { label: 'C-Rate', value: '0.25', unit: 'C' },
    ],
    description: 'Industrial modular battery energy storage unit executing peak shaving, frequency regulation, and solar surplus storage with safe LFP chemistry.',
  },
  {
    id: 'equip-server-rack',
    name: 'Enterprise IT Server Cluster (Rack A & B)',
    category: 'it',
    status: 'optimal',
    loadKw: 14.5,
    healthPercent: 99.9,
    position3D: [-11, 1.8, -5],
    metrics: [
      { label: 'Compute Load', value: '74', unit: '%' },
      { label: 'Rack PUE', value: '1.18', unit: 'PUE' },
      { label: 'Intake Air Temp', value: '19.8', unit: '°C' },
      { label: 'Exhaust Air Temp', value: '32.4', unit: '°C' },
      { label: 'Dual Redundant PSU', value: 'Active', unit: 'A+B' },
    ],
    description: 'High-density blade servers running cloud workloads, building telemetry database, and local edge computing clusters.',
  },
];

/**
 * Occupants for the 3D scene (sitting and standing avatars).
 */
export const INITIAL_OCCUPANTS: OccupantAvatar[] = [
  // 1. Open Workspace Pod 1 - North Workstations (Facing South +Z)
  {
    id: 'occ-1',
    name: 'Elena Vance',
    role: 'Lead Architect',
    zoneId: 'zone-open-office',
    position: [-5.7, 0, -6.45],
    rotation: 0,
    isSeated: true,
    comfortPerception: 'Ideal',
    action: 'coding',
    currentTask: 'Drafting 3D BIM parametric HVAC ducts & structural model',
    device: 'dual-monitor',
    pose: 'focused-typing',
    activeInScene: true,
  },
  {
    id: 'occ-2',
    name: 'Marcus Chen',
    role: 'Senior Data Engineer',
    zoneId: 'zone-open-office',
    position: [-3.3, 0, -6.45],
    rotation: 0,
    isSeated: true,
    comfortPerception: 'Comfortable',
    action: 'analyzing',
    currentTask: 'Streaming BACnet telemetry pipelines & anomaly detection',
    device: 'dual-monitor',
    pose: 'mouse-review',
    activeInScene: true,
  },

  // 2. Open Workspace Pod 1 - South Workstations (Facing North -Z)
  {
    id: 'occ-3',
    name: 'Sophia Reyes',
    role: 'AI Product Lead',
    zoneId: 'zone-open-office',
    position: [-5.7, 0, -4.55],
    rotation: Math.PI,
    isSeated: true,
    comfortPerception: 'Ideal',
    action: 'reviewing',
    currentTask: 'Validating PMV thermal satisfaction models & ASHRAE scores',
    device: 'laptop',
    pose: 'thinking-leanback',
    activeInScene: true,
  },
  {
    id: 'occ-4',
    name: 'Tariq Al-Mansoor',
    role: 'Energy Systems Specialist',
    zoneId: 'zone-open-office',
    position: [-3.3, 0, -4.55],
    rotation: Math.PI,
    isSeated: true,
    comfortPerception: 'Comfortable',
    action: 'coding',
    currentTask: 'Optimizing solar PV inverter MPPT curves & BESS arbitration',
    device: 'dual-monitor',
    pose: 'focused-typing',
    activeInScene: true,
  },

  // 3. Open Workspace Pod 2 - North Workstation
  {
    id: 'occ-5',
    name: 'Maya Lin',
    role: 'UI/UX Designer',
    zoneId: 'zone-open-office',
    position: [0.3, 0, -6.45],
    rotation: 0,
    isSeated: true,
    comfortPerception: 'Ideal',
    action: 'analyzing',
    currentTask: 'Prototyping spatial 3D digital twin HUD interface',
    device: 'dual-monitor',
    pose: 'mouse-review',
    activeInScene: true,
  },

  // 4. Executive & Focus Suite (Zone 3)
  {
    id: 'occ-6',
    name: 'Olivia Martin',
    role: 'VP Technology & Facilities',
    zoneId: 'zone-executive',
    position: [11.5, 0, 6.9],
    rotation: Math.PI,
    isSeated: true,
    comfortPerception: 'Ideal',
    action: 'reviewing',
    currentTask: 'Reviewing quarterly EUI decarbonization & net-zero targets',
    device: 'laptop',
    pose: 'focused-typing',
    activeInScene: true,
  },

  // 5. Boardroom / Meeting Room (Zone 2) - Seated around table
  {
    id: 'occ-7',
    name: 'Lucas Scott',
    role: 'Enterprise Solutions Director',
    zoneId: 'zone-boardroom',
    position: [10.0, 0, -4.5],
    rotation: Math.PI,
    isSeated: true,
    comfortPerception: 'Comfortable',
    action: 'collaborating',
    currentTask: 'Evaluating BESS battery peak-shaving ROI proposal',
    device: 'tablet',
    pose: 'mouse-review',
    activeInScene: true,
  },
  {
    id: 'occ-8',
    name: 'Amara Diallo',
    role: 'Sustainability Director',
    zoneId: 'zone-boardroom',
    position: [13.0, 0, -4.5],
    rotation: Math.PI,
    isSeated: true,
    comfortPerception: 'Ideal',
    action: 'collaborating',
    currentTask: 'Analyzing Scope 1 & 2 avoided carbon metrics on presentation',
    device: 'laptop',
    pose: 'focused-typing',
    activeInScene: true,
  },

  // 6. Discussion Duo near Meeting Room glass partition
  {
    id: 'occ-9',
    name: 'James Wilson',
    role: 'Full-Stack Developer',
    zoneId: 'zone-open-office',
    position: [4.0, 0, -4.6],
    rotation: Math.PI * 0.35,
    isSeated: false,
    comfortPerception: 'Comfortable',
    action: 'coffee',
    currentTask: 'Discussing real-time energy flow UI with cybersecurity lead',
    device: 'coffee-mug',
    pose: 'discussion-listening',
    activeInScene: true,
  },
  {
    id: 'occ-10',
    name: 'Nadia Petrov',
    role: 'Cybersecurity Specialist',
    zoneId: 'zone-open-office',
    position: [4.9, 0, -4.0],
    rotation: -Math.PI * 0.65,
    isSeated: false,
    comfortPerception: 'Comfortable',
    action: 'troubleshooting',
    currentTask: 'Explaining smart meter OT encryption architecture on tablet',
    device: 'tablet',
    pose: 'discussion-gesturing',
    activeInScene: true,
  },

  // 7. Walking Employee in central circulation corridor
  {
    id: 'occ-11',
    name: 'David Kim',
    role: 'DevOps Lead',
    zoneId: 'zone-open-office',
    position: [-1.2, 0, 0.0],
    rotation: Math.PI / 2,
    isSeated: false,
    comfortPerception: 'Ideal',
    action: 'coffee',
    currentTask: 'Walking to meeting room with laptop & deployment log',
    device: 'laptop',
    pose: 'walking-corridor',
    activeInScene: true,
  },

  // 8. Specialist in Server & Utility Room (Zone 4)
  {
    id: 'occ-12',
    name: 'Dr. Aris Thorne',
    role: 'Electrical & Facilities Specialist',
    zoneId: 'zone-server',
    position: [-9.2, 0, -4.8],
    rotation: -Math.PI / 4,
    isSeated: false,
    comfortPerception: 'Ideal',
    action: 'troubleshooting',
    currentTask: 'Inspecting server rack thermal delta-T & PDU harmonic balance',
    device: 'tablet',
    pose: 'tablet-inspecting',
    activeInScene: true,
  },
];

/**
 * Step simulation tick: given current state and delta time, return updated telemetries.
 */
export function simulateTick(
  prevZones: ZoneData[],
  prevRenewable: RenewableGridState,
  timeHours: number,
  weather: WeatherCondition,
  drMode: DemandResponseMode,
  occupancyMultiplier: number,
  deltaSec: number
): {
  zones: ZoneData[];
  loads: ElectricalLoads;
  renewable: RenewableGridState;
} {
  const { outdoorTemp, solarIrradiance, outdoorLux } = computeOutdoorConditions(timeHours, weather);
  const tariff = computeTariff(timeHours);

  // 1. Compute Zone Thermal & Environmental physics
  const isBusinessHours = timeHours >= 7.5 && timeHours <= 18.5;
  const targetOccFactor = isBusinessHours ? occupancyMultiplier : 0.15;

  let totalHvacKw = 0;
  let totalLightingKw = 0;
  let totalComputersKw = 9.2; // Base servers
  let totalWaterKw = 2.8;

  const updatedZones = prevZones.map((z) => {
    // 1. Occupancy & Sensor Determination
    const isRoomOccupied = z.occupancyCount > 0;
    const currentOcc = z.occupancyCount;

    // Daylight harvesting: lux coming through windows reduces electrical lighting demand
    const windowLuxFactor = z.type === 'server' ? 0.05 : z.type === 'boardroom' ? 0.6 : 0.8;
    const daylightContribution = (outdoorLux * 0.008 * windowLuxFactor * (1 - z.blindsPositionPercent / 100));
    const targetLux = 500;
    const artificialLuxNeeded = Math.max(80, targetLux - daylightContribution);
    let lightingPercent = Math.min(100, Math.max(15, Math.round((artificialLuxNeeded / targetLux) * 100)));

    // Occupancy-based automatic lighting setback
    let lightingDemandLevel: 'Active' | 'Daylight Harvest' | 'Dimmed Standby' | 'Off' = 'Active';
    if (!isRoomOccupied && z.type !== 'server') {
      // Room is vacant -> Automatically dim lights to 10% standby security mode
      lightingPercent = 10;
      lightingDemandLevel = 'Dimmed Standby';
    } else if (daylightContribution > 180) {
      lightingDemandLevel = 'Daylight Harvest';
    }

    // Occupancy-based HVAC Demand & Setback
    let effectiveTargetTemp = z.targetTemp;
    let effectiveAirflowRate = z.hvacAirflowRate;
    let hvacDemandLevel: 'Normal' | 'Setback Eco' | 'Standby' = 'Normal';

    if (!isRoomOccupied && z.type !== 'server') {
      // Room is vacant -> Relax cooling setpoint by +2.5°C to save energy
      effectiveTargetTemp = z.targetTemp + 2.5;
      effectiveAirflowRate = Math.round(z.hvacAirflowRate * 0.25); // Throttled minimum CFM
      hvacDemandLevel = 'Setback Eco';
    }

    // Load shedding adjustments in DR or Eco modes
    let effectiveLightingPercent = lightingPercent;
    if (drMode === 'eco-comfort') {
      effectiveTargetTemp += 1.0;
      effectiveLightingPercent = Math.round(lightingPercent * 0.85);
    } else if (drMode === 'peak-shave' || drMode === 'dr-curtailment') {
      effectiveTargetTemp += 1.8;
      effectiveLightingPercent = Math.round(lightingPercent * 0.70);
    }

    // Thermal delta T
    const deltaT = outdoorTemp - z.temperature;
    const internalHeatGain = (currentOcc * 0.12) + (z.type === 'server' ? 8.5 : 0.8);
    // Cooling power required to reach effectiveTargetTemp
    const tempError = z.temperature - effectiveTargetTemp;
    const coolingDemand = Math.max(0, tempError * 2.2 + deltaT * 0.35 + internalHeatGain);

    // Apply gentle drift toward target with HVAC cooling
    const hvacCoolingRate = Math.min(coolingDemand, 8.0);
    const netTempChange = (deltaT * 0.08 + internalHeatGain * 0.1 - hvacCoolingRate * 0.18) * (deltaSec / 60);
    const newTemp = Number(Math.max(18.0, Math.min(28.0, z.temperature + netTempChange)).toFixed(1));

    // CO2 dynamics
    const co2Production = currentOcc * 22; // ppm/hr
    const freshAirVentilation = (effectiveAirflowRate / 1000) * 18;
    const netCo2 = Math.round(Math.max(420, Math.min(1200, z.co2 + (co2Production - freshAirVentilation) * (deltaSec / 120))));

    // Humidity dynamics
    const targetHumidity = 45;
    const netHumidity = Math.round(Math.max(35, Math.min(65, z.humidity + (targetHumidity - z.humidity) * 0.02)));

    // PMV & PPD calculation
    const { pmv, ppd } = calculatePmvPpd(newTemp, netHumidity, 0.14, 0.6, 1.1);

    // Energy loads of this zone
    const zoneHvacKw = Math.max(0.4, coolingDemand * 0.95 * (isRoomOccupied || z.type === 'server' ? 1.0 : 0.35));
    const zoneLightKw = (z.dimensions[0] * z.dimensions[2] * 0.007) * (effectiveLightingPercent / 100);
    const zonePcKw = currentOcc * 0.22;

    totalHvacKw += zoneHvacKw;
    totalLightingKw += zoneLightKw;
    totalComputersKw += zonePcKw;

    // Simulated energy savings from occupancy-based setback
    const baselineZoneKw = (coolingDemand * 0.95) + (z.dimensions[0] * z.dimensions[2] * 0.007 * 0.85);
    const energySavingsKw = Number(Math.max(0, baselineZoneKw - (zoneHvacKw + zoneLightKw)).toFixed(1));

    const activityLevel: 'Sedentary' | 'Active' | 'High Activity' | 'Vacant' = !isRoomOccupied
      ? 'Vacant'
      : currentOcc > z.maxOccupancy * 0.5
      ? 'High Activity'
      : currentOcc > 2
      ? 'Active'
      : 'Sedentary';

    return {
      ...z,
      temperature: newTemp,
      targetTemp: effectiveTargetTemp,
      hvacAirflowRate: effectiveAirflowRate,
      humidity: netHumidity,
      co2: netCo2,
      occupancyCount: currentOcc,
      pmv,
      ppd,
      lightingDimmablePercent: effectiveLightingPercent,
      lux: Math.round((effectiveLightingPercent / 100) * targetLux + daylightContribution),
      occupancySensor: {
        pirDetected: isRoomOccupied,
        cameraPersonCount: currentOcc,
        activityLevel,
        roomUsagePercent: Math.round((currentOcc / (z.maxOccupancy || 1)) * 100),
        hvacDemandLevel,
        lightingDemandLevel,
        isOccupied: isRoomOccupied,
        energySavingsKw,
      },
    };
  });

  // Water pump load depends on occupancy and lunch/morning peak
  const isMealPeak = (timeHours >= 8.0 && timeHours <= 9.0) || (timeHours >= 12.0 && timeHours <= 13.5);
  totalWaterKw = 2.4 + (targetOccFactor * 2.8) * (isMealPeak ? 1.6 : 0.9);

  // Overall building loads
  const totalDemand = Number((totalHvacKw + totalLightingKw + totalComputersKw + totalWaterKw).toFixed(1));
  const loads: ElectricalLoads = {
    hvacKw: Number(totalHvacKw.toFixed(1)),
    lightingKw: Number(totalLightingKw.toFixed(1)),
    computersKw: Number(totalComputersKw.toFixed(1)),
    waterMotorKw: Number(totalWaterKw.toFixed(1)),
    totalDemandKw: totalDemand,
    powerFactor: 0.98,
  };

  // 2. Solar PV Generation
  // 42 kWp solar array with 98% inverter efficiency
  const solarPvKw = Number(((solarIrradiance / 1000) * 42.0 * 0.98).toFixed(1));
  const addedSolarKwh = (solarPvKw * (deltaSec / 3600));

  // 3. Battery Energy Storage System (BESS) Arbitration logic
  // Max inverter power: 25 kW, Capacity: 100 kWh
  let batteryPowerKw = 0; // + = discharging, - = charging
  let batteryMode: 'charging' | 'discharging' | 'idle' | 'standby' = 'idle';
  let nextSoc = prevRenewable.batterySoc;

  const solarSurplus = solarPvKw - totalDemand;

  if (solarSurplus > 2.0 && nextSoc < 98.0) {
    // Mode A: Solar surplus -> Charge battery
    const chargeRate = Math.min(20.0, solarSurplus, (100.0 - nextSoc) * 2);
    batteryPowerKw = -Number(chargeRate.toFixed(1));
    batteryMode = 'charging';
  } else if ((tariff.period === 'on-peak' || drMode === 'dr-curtailment' || drMode === 'peak-shave') && nextSoc > 15.0) {
    // Mode B: Peak Tariff or Demand Response -> Discharge battery to shave peak
    const deficit = Math.max(0, totalDemand - solarPvKw);
    const dischargeRate = Math.min(25.0, deficit, (nextSoc - 15.0) * 1.5);
    batteryPowerKw = Number(dischargeRate.toFixed(1));
    batteryMode = dischargeRate > 0.5 ? 'discharging' : 'idle';
  } else if (tariff.period === 'off-peak' && nextSoc < 60.0 && timeHours < 5.0) {
    // Mode C: Night off-peak cheap grid charging
    batteryPowerKw = -10.0;
    batteryMode = 'charging';
  } else {
    batteryMode = 'idle';
    batteryPowerKw = 0;
  }

  // Update SoC
  const deltaEnergyKwh = (-batteryPowerKw) * (deltaSec / 3600); // positive if charging
  nextSoc = Math.max(10.0, Math.min(100.0, nextSoc + (deltaEnergyKwh / 100.0) * 100));

  // 4. Grid Import / Export Balance
  // Grid = TotalDemand - Solar - BatteryDischarge
  const netGridKw = totalDemand - solarPvKw - batteryPowerKw;
  const gridImportKw = Number(netGridKw.toFixed(1));

  // Carbon Intensity (dynamic: cleaner during midday with regional solar, dirtier at night)
  const baseGridCarbon = 360; // g CO2/kWh
  const gridCarbonIntensity = Math.round(baseGridCarbon - (solarIrradiance > 200 ? 120 : 0));

  // Clean energy ratio
  const cleanKw = Math.min(totalDemand, solarPvKw + Math.max(0, batteryPowerKw));
  const cleanEnergyRatio = totalDemand > 0 ? Math.round((cleanKw / totalDemand) * 100) : 100;

  // Carbon and cost avoided accumulating
  const cleanKwhInterval = (cleanKw * (deltaSec / 3600));
  const addedCarbonAvoided = (cleanKwhInterval * (gridCarbonIntensity / 1000));
  const addedCostAvoided = cleanKwhInterval * tariff.priceKwh;

  const updatedRenewable: RenewableGridState = {
    ...prevRenewable,
    solarPvKw,
    solarIrradiance,
    solarDailyKwh: Number((prevRenewable.solarDailyKwh + addedSolarKwh).toFixed(2)),
    batterySoc: Number(nextSoc.toFixed(1)),
    batteryPowerKw,
    batteryMode,
    gridImportKw,
    gridCarbonIntensity,
    electricityPriceKwh: tariff.priceKwh,
    tariffPeriod: tariff.period,
    cleanEnergyRatio,
    carbonAvoidedKg: Number((prevRenewable.carbonAvoidedKg + addedCarbonAvoided).toFixed(2)),
    dailyCostAvoided: Number((prevRenewable.dailyCostAvoided + addedCostAvoided).toFixed(2)),
    drEventActive: drMode === 'dr-curtailment',
  };

  return {
    zones: updatedZones,
    loads,
    renewable: updatedRenewable,
  };
}
