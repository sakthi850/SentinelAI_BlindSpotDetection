import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Activity, 
  UserX, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  RefreshCw,
  EyeOff,
  Video
} from 'lucide-react';
import { Camera, Zone, SimulationPath, SimulationStep } from '../types';
import { SIMULATION_PATHS } from '../data/defaultCameras';
import { isPointMonitored } from '../utils/geometry';

interface SimulationProps {
  cameras: Camera[];
  zones: Zone[];
  onAddAlert: (msg: string, severity: 'low' | 'medium' | 'high') => void;
}

export default function Simulation({ cameras, zones, onAddAlert }: SimulationProps) {
  const [selectedPathId, setSelectedPathId] = useState<string>(SIMULATION_PATHS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [intruderPos, setIntruderPos] = useState<SimulationStep | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const selectedPath = SIMULATION_PATHS.find(p => p.id === selectedPathId) || SIMULATION_PATHS[0];

  const handleStartSimulation = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setCurrentStepIndex(0);
    setIntruderPos(selectedPath.steps[0]);
    onAddAlert(`COMMENCING THREAT INTRUSION SIMULATION: "${selectedPath.name}"`, 'medium');
  };

  const handleStopSimulation = () => {
    setIsPlaying(false);
    setIntruderPos(null);
    setCurrentStepIndex(0);
    if (timerRef.current) clearInterval(timerRef.current);
    onAddAlert(`Threat intrusion simulation aborted by operator.`, 'low');
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= selectedPath.steps.length) {
            setIsPlaying(false);
            setIntruderPos(null);
            onAddAlert(`Simulation Completed: "${selectedPath.name}" path run terminated.`, 'low');
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          const nextStep = selectedPath.steps[nextIndex];
          setIntruderPos(nextStep);

          // Calculate if the intruder is currently monitored
          const { monitored, byCameraId } = isPointMonitored(nextStep.x, nextStep.y, cameras);
          if (monitored) {
            const cam = cameras.find(c => c.id === byCameraId);
            onAddAlert(`[Simulation Check]: Intruder monitored at position (${nextStep.x}%, ${nextStep.y}%) by "${cam?.name || 'CCTV'}"`, 'low');
          } else {
            onAddAlert(`[SIMULATION BREACH]: Intruder traversed unmonitored blind zone at (${nextStep.x}%, ${nextStep.y}%)!`, 'high');
          }

          return nextIndex;
        });
      }, 1500); // 1.5 seconds per step
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, selectedPath, cameras]);

  // Check current intruder monitor status for display
  const currentStatus = intruderPos ? isPointMonitored(intruderPos.x, intruderPos.y, cameras) : { monitored: false, byCameraId: undefined };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
      
      {/* Simulation Display Floor Map */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col select-none relative overflow-hidden">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h4 className="font-sans font-bold text-slate-100 text-base">Live Intrusion Path Simulator</h4>
            <p className="text-slate-500 text-xs font-mono">Dynamic threat vector replication space</p>
          </div>

          <div className="flex items-center gap-2">
            {isPlaying && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono font-bold text-rose-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                SIMULATING INTRUDER
              </span>
            )}
          </div>
        </div>

        {/* Dynamic floor layout rendering */}
        <div className="flex-1 min-h-[350px] relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
          
          {/* Zones */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {zones.map(z => (
              <div
                key={z.id}
                className="absolute border border-slate-700 flex flex-col justify-between p-2 font-mono text-[9px] uppercase tracking-wider bg-slate-900/10"
                style={{
                  left: `${z.x}%`,
                  top: `${z.y}%`,
                  width: `${z.width}%`,
                  height: `${z.height}%`
                }}
              >
                <span className="text-slate-400 font-bold">{z.name}</span>
              </div>
            ))}
          </div>

          {/* SVG Camera Coverage & Trajectory path line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Draw complete planned trajectory line */}
            <path
              d={selectedPath.steps.map((s, idx) => `${idx === 0 ? 'M' : 'L'} ${s.x}% ${s.y}%`).join(' ')}
              className="stroke-cyan-500/20 stroke-2 fill-none stroke-dasharray-[5,5]"
              strokeDasharray="6,4"
            />

            {/* Cameras rendering */}
            {cameras.map(cam => {
              if (cam.status !== 'active') return null;
              
              if (cam.fov >= 350) {
                return (
                  <circle
                    key={cam.id}
                    cx={`${cam.x}%`}
                    cy={`${cam.y}%`}
                    r={`${cam.range}%`}
                    className="fill-emerald-500/5 stroke-emerald-500/10"
                  />
                );
              }

              // Draw wedges
              const { x, y, angle, fov, range } = cam;
              const startAngle = angle - fov / 2;
              const endAngle = angle + fov / 2;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = x + range * Math.cos(startRad);
              const y1 = y + range * Math.sin(startRad);
              const x2 = x + range * Math.cos(endRad);
              const y2 = y + range * Math.sin(endRad);
              const largeArcFlag = fov > 180 ? 1 : 0;
              const path = `M ${x} ${y} L ${x1} ${y1} A ${range} ${range} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              return (
                <path
                  key={cam.id}
                  d={path}
                  className="fill-emerald-500/5 stroke-emerald-500/10"
                />
              );
            })}
          </svg>

          {/* Render static camera icons */}
          {cameras.map(cam => {
            const isOffline = cam.status !== 'active';
            return (
              <div
                key={cam.id}
                className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full flex items-center justify-center border text-white ${
                  isOffline ? 'bg-slate-700 border-slate-600' : 'bg-slate-800 border-slate-700'
                }`}
                style={{ left: `${cam.x}%`, top: `${cam.y}%` }}
              >
                <Video className="w-2.5 h-2.5 text-slate-400" />
              </div>
            );
          })}

          {/* INTRUDER AVATAR DOT */}
          {intruderPos && (
            <div 
              className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                currentStatus.monitored 
                  ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 shadow-lg shadow-emerald-500/30' 
                  : 'bg-rose-500/30 border-2 border-rose-500 text-rose-500 shadow-lg shadow-rose-500/50 animate-ping'
              }`}
              style={{
                left: `${intruderPos.x}%`,
                top: `${intruderPos.y}%`,
                zIndex: 40
              }}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.monitored ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel sidebar */}
      <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex flex-col shrink-0 justify-between gap-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Activity className="w-5 h-5 text-slate-700" />
            <h5 className="font-sans font-bold text-slate-800 text-base">Simulation Deck</h5>
          </div>

          {/* Select Simulation Path */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Infiltration Trajectory</label>
            <select
              value={selectedPathId}
              onChange={(e) => setSelectedPathId(e.target.value)}
              disabled={isPlaying}
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/10 disabled:bg-slate-50 disabled:text-slate-400"
            >
              {SIMULATION_PATHS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-slate-400 text-xs mt-2 italic leading-normal">
              {selectedPath.description}
            </p>
          </div>

          {/* Simulation Diagnostics Status Card */}
          {intruderPos ? (
            <div className={`p-4 rounded-xl border flex gap-3 ${
              currentStatus.monitored 
                ? 'bg-emerald-50 border-emerald-100' 
                : 'bg-rose-50 border-rose-100 animate-pulse'
            }`}>
              <div className="shrink-0 mt-0.5">
                {currentStatus.monitored ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <UserX className="w-5 h-5 text-rose-600" />
                )}
              </div>
              <div>
                <span className={`block font-bold text-xs uppercase ${currentStatus.monitored ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {currentStatus.monitored ? 'Captured / Tracking' : 'Slipped: Blind Zone'}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  {currentStatus.monitored ? (
                    <>Intruder successfully tracked on live security monitors by <strong>{cameras.find(c => c.id === currentStatus.byCameraId)?.name}</strong>.</>
                  ) : (
                    <>Intruder navigated behind coverage vectors! Gaps exist in this room coordinate.</>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 p-4 rounded-xl text-center text-xs text-slate-400">
              Select an entry trajectory above and launch the simulation to analyze grid capture ratios.
            </div>
          )}
        </div>

        {/* Start / Stop action CTA buttons */}
        <div className="space-y-2">
          {isPlaying ? (
            <button
              onClick={handleStopSimulation}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-500/15 flex items-center justify-center gap-2 cursor-pointer transition-colors select-none"
            >
              <Square className="w-4 h-4 fill-white text-white" />
              <span>Abort Simulation</span>
            </button>
          ) : (
            <button
              onClick={handleStartSimulation}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors select-none"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Commence Simulation</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
