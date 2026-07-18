import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  RefreshCw, 
  Zap, 
  ArrowRight, 
  PlusCircle, 
  ShieldCheck, 
  HelpCircle,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Camera, Zone, OptimizationRecommendation } from '../types';
import { calculateSiteCoverage, calculateOverallSecurityScore } from '../utils/geometry';

interface CameraOptimizationProps {
  cameras: Camera[];
  zones: Zone[];
  onUpdateCameras: (updated: Camera[]) => void;
  onAddAlert: (msg: string, severity: 'low' | 'medium' | 'high') => void;
}

export default function CameraOptimization({ cameras, zones, onUpdateCameras, onAddAlert }: CameraOptimizationProps) {
  const [loading, setLoading] = useState(false);
  const [engineUsed, setEngineUsed] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [appliedRecIds, setAppliedRecIds] = useState<string[]>([]);

  const securityScore = calculateOverallSecurityScore(cameras, zones);
  const siteCoverage = calculateSiteCoverage(cameras, zones);

  // Calls the server-side API proxy to execute Gemini reasoning on our camera coordinate layout
  const handleQueryAIOptimizer = async () => {
    setLoading(true);
    setRecommendations([]);
    setEngineUsed(null);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameras, zones })
      });
      const data = await res.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
        setEngineUsed(data.engine || 'Gemini Core Optimizer');
      } else {
        alert('Could not fetch recommendations: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error connecting to SentinelAI backend server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Applies the specific recommendation directly to our camera list state!
  const handleApplySingleRecommendation = (rec: OptimizationRecommendation) => {
    let updatedCams = [...cameras];

    try {
      const config = JSON.parse(rec.recommendedConfig);

      if (rec.action === 'reposition' && rec.cameraId) {
        updatedCams = cameras.map(c => {
          if (c.id === rec.cameraId) {
            return {
              ...c,
              x: config.x !== undefined ? config.x : c.x,
              y: config.y !== undefined ? config.y : c.y,
              angle: config.angle !== undefined ? config.angle : c.angle,
              range: config.range !== undefined ? config.range : c.range,
              fov: config.fov !== undefined ? config.fov : c.fov
            };
          }
          return c;
        });
        onAddAlert(`Applied AI repositions to camera "${rec.cameraName || 'Sensor'}"`, 'low');
      } else if (rec.action === 'upgrade' && rec.cameraId) {
        updatedCams = cameras.map(c => {
          if (c.id === rec.cameraId) {
            return {
              ...c,
              status: 'active',
              fov: config.fov !== undefined ? config.fov : c.fov,
              resolution: '4K' // Upgrade resolution automatically
            };
          }
          return c;
        });
        onAddAlert(`AI upgrade completed: Camera "${rec.cameraName || 'Sensor'}" restored to online and upgraded to 4K.`, 'low');
      } else if (rec.action === 'add') {
        const newCam: Camera = {
          id: `cam-ai-${Date.now()}`,
          name: config.name || `Cam - AI Placement`,
          type: config.type || 'dome',
          x: config.x !== undefined ? config.x : 50,
          y: config.y !== undefined ? config.y : 50,
          angle: config.angle !== undefined ? config.angle : 90,
          fov: config.fov !== undefined ? config.fov : 90,
          range: config.range !== undefined ? config.range : 15,
          resolution: config.resolution || '4K',
          status: 'active',
          zone: config.zone || 'General Office Floor'
        };
        updatedCams = [...cameras, newCam];
        onAddAlert(`AI installation executed: Placed new camera node "${newCam.name}" at coordinate [x: ${newCam.x}%, y: ${newCam.y}%]`, 'low');
      }

      onUpdateCameras(updatedCams);
      setAppliedRecIds([...appliedRecIds, rec.id]);
    } catch (e: any) {
      alert('Error parsing recommendation adjustments: ' + e.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      
      {/* Metrics Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-2xl text-white shadow-md">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-base">AI Camera Optimization Panel</h4>
            <p className="text-slate-400 text-xs font-medium">Coordinate level site security calculations using Gemini</p>
          </div>
        </div>

        <div className="flex items-center gap-6 divide-l divide-slate-100 pl-6 shrink-0 font-mono text-xs">
          <div className="pl-6">
            <span className="block text-slate-400 text-[10px]">CURRENT SECURITY</span>
            <span className="text-xl font-bold font-sans text-slate-800">{securityScore}/100</span>
          </div>
          <div className="pl-6">
            <span className="block text-slate-400 text-[10px]">COVERAGE MATRIX</span>
            <span className="text-xl font-bold font-sans text-cyan-600">{siteCoverage}%</span>
          </div>
        </div>
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Recommendation lists column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-sans font-bold text-slate-800 text-sm">Security Refinement Strategy</h5>
            {engineUsed && (
              <span className="text-[10px] font-mono font-bold bg-cyan-50 border border-cyan-100 text-cyan-700 px-2.5 py-0.5 rounded-full">
                AI Engine: {engineUsed}
              </span>
            )}
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
              <RefreshCw className="w-10 h-10 text-cyan-500 animate-spin" />
              <div>
                <p className="font-bold text-slate-800 text-base">Gemini analyzing layout vectors...</p>
                <p className="text-slate-400 text-xs mt-1">Measuring focal length equations and corridor blind grids.</p>
              </div>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
              <Cpu className="w-12 h-12 text-slate-300" />
              <div>
                <p className="font-bold text-slate-700 text-sm">AI Optimization Blueprint Ready</p>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  Click the button below to parse your active {cameras.length} camera nodes and get suggestions.
                </p>
              </div>
              <button
                onClick={handleQueryAIOptimizer}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs shadow-md transition-colors cursor-pointer"
              >
                Query AI Optimizer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => {
                const isApplied = appliedRecIds.includes(rec.id);
                return (
                  <div key={rec.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:border-slate-300 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm">
                          {rec.action === 'add' ? 'Install New Camera' : rec.action === 'upgrade' ? 'Repair & Upgrade Sensor' : `Reposition "${rec.cameraName}"`}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded">
                          +{rec.coverageDelta}% Coverage
                        </span>
                      </div>

                      <p className="text-slate-500 text-xs leading-relaxed mt-2">{rec.details}</p>
                      
                      {rec.currentConfig && (
                        <div className="text-[11px] font-mono text-slate-400 mt-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="font-bold text-slate-500">Current Setup:</span> {rec.currentConfig}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                      <button
                        onClick={() => handleApplySingleRecommendation(rec)}
                        disabled={isApplied}
                        className={`w-full md:w-auto px-4 py-2.5 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all select-none ${
                          isApplied 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                            : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm cursor-pointer'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Applied Blueprint</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-300" />
                            <span>Apply Blueprint</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Informative advice sidebar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 self-start">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <Cpu className="w-5 h-5 text-slate-700" />
            <h5 className="font-sans font-bold text-slate-800 text-sm">Site Math Rules</h5>
          </div>

          <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
            <p>
              Our Gemini solver uses site topology vectors to detect visual gaps and optimize security profiles.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="font-bold text-slate-700 text-[11px] block">Solver Directives:</span>
              <ul className="list-disc pl-4 space-y-1 font-mono text-[10px]">
                <li>Prioritize Server Rooms & Loading Bays.</li>
                <li>Minimize overlapping fields (eliminate camera redundancy).</li>
                <li>Recommend optimal lens degrees (Dome, Bullet, PTZ, Fisheye).</li>
              </ul>
            </div>
            <p>
              Once a blueprint is applied, our simulator moves, repairs, or adds camera hardware coordinates in real-time, instantly adjusting security index readings.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
