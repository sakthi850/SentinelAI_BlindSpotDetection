import { Camera, Zone, SimulationPath } from '../types';

export const DEFAULT_ZONES: Zone[] = [
  { id: 'zone-1', name: 'Main Lobby & Entrance', x: 5, y: 5, width: 30, height: 35, baseRisk: 'medium' },
  { id: 'zone-2', name: 'Secure Server Room', x: 40, y: 5, width: 25, height: 35, baseRisk: 'high' },
  { id: 'zone-3', name: 'Executive Offices', x: 70, y: 5, width: 25, height: 35, baseRisk: 'low' },
  { id: 'zone-4', name: 'General Office Floor', x: 5, y: 45, width: 50, height: 50, baseRisk: 'low' },
  { id: 'zone-5', name: 'Loading Dock & Freight', x: 60, y: 45, width: 35, height: 30, baseRisk: 'high' },
  { id: 'zone-6', name: 'Back Alley Lane', x: 60, y: 80, width: 35, height: 15, baseRisk: 'high' }
];

export const DEFAULT_CAMERAS: Camera[] = [
  {
    id: 'cam-1',
    name: 'Main Entrance Dome',
    type: 'dome',
    x: 8,
    y: 8,
    angle: 45,
    fov: 110,
    range: 18,
    resolution: '4K',
    status: 'active',
    zone: 'Main Lobby & Entrance'
  },
  {
    id: 'cam-2',
    name: 'Lobby Reception Desk',
    type: 'bullet',
    x: 32,
    y: 28,
    angle: 220,
    fov: 85,
    range: 15,
    resolution: '1080p',
    status: 'active',
    zone: 'Main Lobby & Entrance'
  },
  {
    id: 'cam-3',
    name: 'Server Room Rack A',
    type: 'dome',
    x: 42,
    y: 8,
    angle: 135,
    fov: 110,
    range: 16,
    resolution: '4K',
    status: 'active',
    zone: 'Secure Server Room'
  },
  {
    id: 'cam-4',
    name: 'Server Room Back Door',
    type: 'bullet',
    x: 62,
    y: 32,
    angle: 200,
    fov: 90,
    range: 14,
    resolution: '2K',
    status: 'active',
    zone: 'Secure Server Room'
  },
  {
    id: 'cam-5',
    name: 'Loading Dock Inner',
    type: 'dome',
    x: 63,
    y: 48,
    angle: 90,
    fov: 120,
    range: 18,
    resolution: '2K',
    status: 'active',
    zone: 'Loading Dock & Freight'
  },
  {
    id: 'cam-6',
    name: 'Loading Dock Gate B',
    type: 'bullet',
    x: 92,
    y: 70,
    angle: 180,
    fov: 90,
    range: 22,
    resolution: '4K',
    status: 'active',
    zone: 'Loading Dock & Freight'
  },
  {
    id: 'cam-7',
    name: 'Back Alley West',
    type: 'bullet',
    x: 62,
    y: 88,
    angle: 0,
    fov: 90,
    range: 24,
    resolution: '2K',
    status: 'maintenance',
    zone: 'Back Alley Lane'
  },
  {
    id: 'cam-8',
    name: 'Back Alley East',
    type: 'bullet',
    x: 92,
    y: 92,
    angle: 270,
    fov: 90,
    range: 25,
    resolution: '1080p',
    status: 'active',
    zone: 'Back Alley Lane'
  },
  {
    id: 'cam-9',
    name: 'Main Office South-West',
    type: 'dome',
    x: 10,
    y: 85,
    angle: 315,
    fov: 110,
    range: 16,
    resolution: '1080p',
    status: 'active',
    zone: 'General Office Floor'
  },
  {
    id: 'cam-10',
    name: 'Main Office Center',
    type: 'dome',
    x: 32,
    y: 65,
    angle: 180,
    fov: 120,
    range: 17,
    resolution: '1080p',
    status: 'active',
    zone: 'General Office Floor'
  },
  {
    id: 'cam-11',
    name: 'Executive Suite Entrance',
    type: 'dome',
    x: 72,
    y: 8,
    angle: 45,
    fov: 90,
    range: 15,
    resolution: '1080p',
    status: 'active',
    zone: 'Executive Offices'
  },
  {
    id: 'cam-12',
    name: 'Executive Corridor Pivot',
    type: 'ptz',
    x: 90,
    y: 30,
    angle: 225,
    fov: 90,
    range: 14,
    resolution: '1080p',
    status: 'outage',
    zone: 'Executive Offices'
  }
];

export const SIMULATION_PATHS: SimulationPath[] = [
  {
    id: 'path-1',
    name: 'Lobby Security Bypass',
    description: 'Intruder forces main doors, moves past receptionist Desk into Executive Area hallway.',
    steps: [
      { x: 3, y: 15, timeOffset: 0 },
      { x: 10, y: 15, timeOffset: 2 },
      { x: 18, y: 15, timeOffset: 4 },
      { x: 26, y: 18, timeOffset: 6 },
      { x: 34, y: 25, timeOffset: 8 },
      { x: 48, y: 25, timeOffset: 10 },
      { x: 60, y: 25, timeOffset: 12 },
      { x: 74, y: 20, timeOffset: 14 },
      { x: 88, y: 15, timeOffset: 16 }
    ]
  },
  {
    id: 'path-2',
    name: 'Freight Gate - Server Intrusion',
    description: 'Infiltration from Back Alley, crossing loading dock floor plan, breaching Server Room back door.',
    steps: [
      { x: 92, y: 92, timeOffset: 0 },
      { x: 78, y: 88, timeOffset: 2 },
      { x: 68, y: 88, timeOffset: 4 },
      { x: 62, y: 78, timeOffset: 6 },
      { x: 65, y: 62, timeOffset: 8 },
      { x: 74, y: 52, timeOffset: 10 },
      { x: 62, y: 38, timeOffset: 12 },
      { x: 50, y: 32, timeOffset: 14 },
      { x: 45, y: 20, timeOffset: 16 },
      { x: 48, y: 10, timeOffset: 18 }
    ]
  },
  {
    id: 'path-3',
    name: 'General Floor Disruption',
    description: 'Path traversal starting from Office south partition, cutting through blind zones towards server lobby.',
    steps: [
      { x: 10, y: 90, timeOffset: 0 },
      { x: 20, y: 85, timeOffset: 2 },
      { x: 30, y: 80, timeOffset: 4 },
      { x: 45, y: 85, timeOffset: 6 },
      { x: 52, y: 70, timeOffset: 8 },
      { x: 50, y: 55, timeOffset: 10 },
      { x: 45, y: 40, timeOffset: 12 },
      { x: 35, y: 35, timeOffset: 14 }
    ]
  }
];
