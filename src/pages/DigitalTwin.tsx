import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Settings2, 
  Plus, 
  Trash2, 
  Move, 
  Maximize2, 
  RotateCw, 
  Sliders, 
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Camera, Zone, CameraType, CameraStatus } from '../types';
import { isPointMonitored } from '../utils/geometry';

interface DigitalTwinProps {
  cameras: Camera[];
  zones: Zone[];
  onUpdateCameras: (updated: Camera[]) => void;
  onAddAlert: (msg: string, severity: 'low' | 'medium' | 'high') => void;
}

export default function DigitalTwin({ cameras, zones, onUpdateCameras, onAddAlert }: DigitalTwinProps) {
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCameraId, setDraggedCameraId] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Filter state for coverage cones
  const [showCoverageCones, setShowCoverageCones] = useState(true);
  const [showBlindGrid, setShowBlindGrid] = useState(true);

  // Selected camera instance
  const selectedCamera = cameras.find(c => c.id === selectedCameraId);

  // Arc path formula for SVG field of view display
  const getCoveragePath = (cam: Camera) => {
    const { x, y, angle, fov, range } = cam;
    if (fov >= 360) return null; // Handle full circle separately

    const startAngle = angle - fov / 2;
    const endAngle = angle + fov / 2;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // range is coordinate percent. We can scale it for rendering.
    const x1 = x + range * Math.cos(startRad);
    const y1 = y + range * Math.sin(startRad);
    const x2 = x + range * Math.cos(endRad);
    const y2 = y + range * Math.sin(endRad);

    const largeArcFlag = fov > 180 ? 1 : 0;

    return `M ${x} ${y} L ${x1} ${y1} A ${range} ${range} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  // Convert click coordinates to canvas percentage (0-100)
  const getCoordsFromEvent = (e: React.MouseEvent) => {
    if (!mapContainerRef.current) return { x: 0, y: 0 };
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { 
      x: Math.max(0, Math.min(100, Math.round(x))), 
      y: Math.max(0, Math.min(100, Math.round(y))) 
    };
  };

  // Drag-and-drop mechanics
  const handleMapMouseDown = (e: React.MouseEvent) => {
    // If we clicked on a camera node, do not add a new camera, just set dragging
    const target = e.target as HTMLElement;
    const camNode = target.closest('[data-camera-id]');
    
    if (camNode) {
      const id = camNode.getAttribute('data-camera-id')!;
      setDraggedCameraId(id);
      setSelectedCameraId(id);
      setIsDragging(true);
      e.stopPropagation();
    }
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedCameraId) return;
    const coords = getCoordsFromEvent(e);
    
    const updated = cameras.map(c => {
      if (c.id === draggedCameraId) {
        return { ...c, x: coords.x, y: coords.y };
      }
      return c;
    });
    onUpdateCameras(updated);
  };

  const handleMapMouseUp = () => {
    if (isDragging && draggedCameraId) {
      const cam = cameras.find(c => c.id === draggedCameraId);
      if (cam) {
        onAddAlert(`Repositioned camera "${cam.name}" to coordinate [x: ${cam.x}%, y: ${cam.y}%]`, 'low');
      }
    }
    setIsDragging(false);
    setDraggedCameraId(null);
  };

  // Click on background map empty area to add a camera
  const handleMapClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-camera-id]') || isDragging) return;

    const coords = getCoordsFromEvent(e);
    
    // Auto-detect which zone they clicked in
    let clickedZoneName = 'General Office Floor';
    for (const zone of zones) {
      if (coords.x >= zone.x && coords.x <= zone.x + zone.width &&
          coords.y >= zone.y && coords.y <= zone.y + zone.height) {
        clickedZoneName = zone.name;
        break;
      }
    }

    const newCam: Camera = {
      id: `cam-${Date.now()}`,
      name: `Cam - Node ${cameras.length + 1}`,
      type: 'dome',
      x: coords.x,
      y: coords.y,
      angle: 90,
      fov: 90,
      range: 15,
      resolution: '1080p',
      status: 'active',
      zone: clickedZoneName
    };

    onUpdateCameras([...cameras, newCam]);
    setSelectedCameraId(newCam.id);
    onAddAlert(`Added new CCTV node "${newCam.name}" in ${clickedZoneName}`, 'low');
  };

  // Delete Selected Camera
  const handleDeleteCamera = (id: string) => {
    const cam = cameras.find(c => c.id === id);
    onUpdateCameras(cameras.filter(c => c.id !== id));
    setSelectedCameraId(null);
    if (cam) {
      onAddAlert(`Dismantled camera node "${cam.name}"`, 'medium');
    }
  };

  // Modify Selected Camera field values
  const handleUpdateCameraField = (field: keyof Camera, value: any) => {
    if (!selectedCameraId) return;
    const updated = cameras.map(c => {
      if (c.id === selectedCameraId) {
        return { ...c, [field]: value };
      }
      return c;
    });
    onUpdateCameras(updated);
  };

  // Pre-calculate sampling grid for blind spot dots overlay
  const blindGridPoints: { x: number; y: number }[] = [];
  if (showBlindGrid) {
    // Generate a simple grid (step size of 4%)
    for (let x = 4; x <= 96; x += 4) {
      for (let y = 4; y <= 96; y += 4) {
        // Find if this grid coordinate falls inside any designated facility zones
        const inZone = zones.some(z => 
          x >= z.x && x <= z.x + z.width &&
          y >= z.y && y <= z.y + z.height
        );
        if (inZone) {
          const { monitored } = isPointMonitored(x, y, cameras);
          if (!monitored) {
            blindGridPoints.push({ x, y });
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
      
      {/* 2D Floor Plan Canvas Frame */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col select-none relative overflow-hidden">
        
        {/* Floor Plan Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h4 className="font-sans font-bold text-slate-100 text-base">Facility Digital Twin</h4>
            <p className="text-slate-500 text-xs font-mono">Interactive node model map editor</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCoverageCones(!showCoverageCones)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                showCoverageCones 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Cones: {showCoverageCones ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={() => setShowBlindGrid(!showBlindGrid)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                showBlindGrid 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Blind spots: {showBlindGrid ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Tip Banner */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl flex items-center gap-2 text-xs text-slate-400 mb-4">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Click anywhere to ADD a camera. Drag nodes to MOVE them. Click nodes to SELECT & configure them.</span>
        </div>

        {/* The SVG Layout Workspace */}
        <div 
          ref={mapContainerRef}
          onMouseDown={handleMapMouseDown}
          onMouseMove={handleMapMouseMove}
          onMouseUp={handleMapMouseUp}
          onClick={handleMapClick}
          className="flex-1 min-h-[350px] relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden cursor-crosshair shadow-inner"
        >
          {/* 1. Zone bounding boxes rendering */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            {zones.map(z => (
              <div
                key={z.id}
                className="absolute border border-slate-700/60 flex flex-col justify-between p-2 font-mono text-[9px] uppercase tracking-wider bg-slate-900/10"
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.width}%`,
                  height: `${z.height}%`
                }}
              >
                <span className="text-slate-500 font-bold">{z.name}</span>
                <span className={`text-[8px] font-bold text-right ${
                  z.baseRisk === 'high' ? 'text-rose-400' : z.baseRisk === 'medium' ? 'text-amber-400' : 'text-slate-600'
                }`}>
                  Risk: {z.baseRisk}
                </span>
              </div>
            ))}
          </div>

          {/* SVG Canvas for overlays */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* 2. Blind spot sampled dots */}
            {showBlindGrid && blindGridPoints.map((pt, i) => (
              <circle
                key={`blind-${i}`}
                cx={`${pt.x}%`}
                cy={`${pt.y}%`}
                r="3"
                className="fill-rose-500/25 stroke-rose-500/10 animate-pulse"
              />
            ))}

            {/* 3. Coverage wedges / cones for active cameras */}
            {showCoverageCones && cameras.map(cam => {
              if (cam.status !== 'active') return null;
              
              const isSelected = cam.id === selectedCameraId;

              if (cam.fov >= 350) {
                // Fisheye 360 circle
                return (
                  <circle
                    key={cam.id}
                    cx={`${cam.x}%`}
                    cy={`${cam.y}%`}
                    r={`${cam.range}%`}
                    className={`fill-emerald-500/10 stroke-dashed ${
                      isSelected ? 'stroke-cyan-400 stroke-2' : 'stroke-emerald-500/30'
                    }`}
                  />
                );
              }

              const path = getCoveragePath(cam);
              if (!path) return null;

              return (
                <path
                  key={cam.id}
                  d={path}
                  className={`transition-all duration-100 ${
                    isSelected 
                      ? 'fill-cyan-500/15 stroke-cyan-400 stroke-2' 
                      : 'fill-emerald-500/8 stroke-emerald-500/20'
                  }`}
                />
              );
            })}
          </svg>

          {/* 4. Active Interactive Node icons layer */}
          {cameras.map(cam => {
            const isSelected = cam.id === selectedCameraId;
            const isOffline = cam.status !== 'active';
            
            return (
              <button
                key={cam.id}
                data-camera-id={cam.id}
                className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full flex items-center justify-center transition-all ${
                  isOffline 
                    ? cam.status === 'outage'
                      ? 'bg-rose-500 border-2 border-rose-200 text-white shadow-rose-500/40 animate-pulse'
                      : 'bg-amber-500 border-2 border-amber-200 text-white shadow-amber-500/40'
                    : isSelected
                      ? 'bg-cyan-500 border-2 border-white text-white scale-110 shadow-lg shadow-cyan-500/50'
                      : 'bg-emerald-500 hover:bg-emerald-600 border-2 border-emerald-200 text-white hover:scale-105 shadow shadow-emerald-500/30'
                }`}
                style={{
                  left: `${cam.x}%`,
                  top: `${cam.y}%`,
                  zIndex: isSelected ? 30 : 20
                }}
                title={`${cam.name} [${cam.status.toUpperCase()}]`}
              >
                <Video className="w-3.5 h-3.5" style={{ transform: cam.fov < 350 ? `rotate(${cam.angle - 90}deg)` : 'none' }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera Configuration Properties Sidebar Panel */}
      <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex flex-col shrink-0">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
          <Settings2 className="w-5 h-5 text-slate-700" />
          <h5 className="font-sans font-bold text-slate-800 text-base">Node Properties</h5>
        </div>

        {selectedCamera ? (
          <div className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Camera Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Camera Label</label>
                <input
                  type="text"
                  value={selectedCamera.name}
                  onChange={(e) => handleUpdateCameraField('name', e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Angle Direction */}
              {selectedCamera.fov < 350 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lense Angle</label>
                    <span className="text-xs font-mono font-bold text-slate-700">{selectedCamera.angle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedCamera.angle}
                    onChange={(e) => handleUpdateCameraField('angle', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-ew-resize accent-cyan-500"
                  />
                </div>
              )}

              {/* Field Of View */}
              {selectedCamera.fov < 350 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Field of View (FOV)</label>
                    <span className="text-xs font-mono font-bold text-slate-700">{selectedCamera.fov}°</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    value={selectedCamera.fov}
                    onChange={(e) => handleUpdateCameraField('fov', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-ew-resize accent-cyan-500"
                  />
                </div>
              )}

              {/* View Range */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">View Radius / Range</label>
                  <span className="text-xs font-mono font-bold text-slate-700">{selectedCamera.range}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={selectedCamera.range}
                  onChange={(e) => handleUpdateCameraField('range', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-ew-resize accent-cyan-500"
                />
              </div>

              {/* Type, Status, Zone row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Hardware Type</label>
                  <select
                    value={selectedCamera.type}
                    onChange={(e) => handleUpdateCameraField('type', e.target.value as CameraType)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="dome">Dome</option>
                    <option value="bullet">Bullet</option>
                    <option value="ptz">PTZ Motorized</option>
                    <option value="fisheye">Fisheye 360</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Live Status</label>
                  <select
                    value={selectedCamera.status}
                    onChange={(e) => {
                      const val = e.target.value as CameraStatus;
                      handleUpdateCameraField('status', val);
                      if (val !== 'active') {
                        handleUpdateCameraField('fov', selectedCamera.fov);
                      }
                    }}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="outage">Outage</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Resolution & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Resolution</label>
                  <select
                    value={selectedCamera.resolution}
                    onChange={(e) => handleUpdateCameraField('resolution', e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="1080p">1080p Full HD</option>
                    <option value="2K">2K Quad HD</option>
                    <option value="4K">4K Ultra HD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Assigned Zone</label>
                  <select
                    value={selectedCamera.zone}
                    onChange={(e) => handleUpdateCameraField('zone', e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:outline-none"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.name}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={() => handleDeleteCamera(selectedCamera.id)}
              className="w-full py-2.5 mt-6 border border-rose-200 hover:border-rose-300 text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <Trash2 className="w-4 h-4" />
              <span>Dismantle Camera Node</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 border border-dashed border-slate-200 rounded-xl p-4 text-center">
            <Sliders className="w-8 h-8 text-slate-300" />
            <div>
              <p className="text-xs font-medium text-slate-700">No camera node selected</p>
              <p className="text-[11px] text-slate-400 mt-1">Select a camera node on the 2D layout to customize details.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
