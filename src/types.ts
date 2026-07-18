export type CameraType = 'dome' | 'bullet' | 'ptz' | 'fisheye';
export type CameraStatus = 'active' | 'outage' | 'maintenance';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Camera {
  id: string;
  name: string;
  type: CameraType;
  x: number; // percentage of layout (0-100)
  y: number; // percentage of layout (0-100)
  angle: number; // direction of looking (0-360 degrees)
  fov: number; // field of view (0-360 degrees)
  range: number; // radius of coverage in percentage (5-40)
  resolution: '1080p' | '2K' | '4K';
  status: CameraStatus;
  zone: string;
}

export interface Zone {
  id: string;
  name: string;
  x: number; // bounding box left %
  y: number; // bounding box top %
  width: number; // width %
  height: number; // height %
  baseRisk: RiskLevel;
}

export interface BlindSpot {
  id: string;
  zoneName: string;
  description: string;
  vulnerabilityScore: number; // 0-100
  criticality: 'low' | 'medium' | 'high';
}

export interface SimulationStep {
  x: number;
  y: number;
  timeOffset: number; // seconds
}

export interface SimulationPath {
  id: string;
  name: string;
  description: string;
  steps: SimulationStep[];
}

export interface Alert {
  id: string;
  timestamp: string;
  cameraName?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface OptimizationRecommendation {
  id: string;
  cameraId?: string;
  action: 'reposition' | 'upgrade' | 'add';
  cameraName?: string;
  details: string;
  currentConfig?: string;
  recommendedConfig: string;
  coverageDelta: number; // expected % increase
}
