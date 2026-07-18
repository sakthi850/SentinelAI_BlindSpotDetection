import React from 'react';
import { 
  EyeOff, 
  AlertOctagon, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  PlusCircle, 
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { Camera, Zone, BlindSpot } from '../types';
import { getDynamicBlindSpots, calculateSiteCoverage } from '../utils/geometry';

interface BlindSpotDetectionProps {
  cameras: Camera[];
  zones: Zone[];
  onUpdateCameras: (updated: Camera[]) => void;
  onAddAlert: (msg: string, severity: 'low' | 'medium' | 'high') => void;
}

export default function BlindSpotDetection({ cameras, zones, onUpdateCameras, onAddAlert }: BlindSpotDetectionProps) {
  const blindSpots = getDynamicBlindSpots(cameras, zones);
  const siteCoverage = calculateSiteCoverage(cameras, zones);

  // Quick action: Deploy an automated camera patch to solve a specific zone's blind spot immediately!
  const handleApplyRemediation = (spot: BlindSpot) => {
    // Find the coordinate centers of the room zone
    const targetZone = zones.find(z => z.name === spot.zoneName);
    if (!targetZone) return;

    const defaultX = Math.round(targetZone.x + targetZone.width / 2);
    const defaultY = Math.round(targetZone.y + targetZone.height / 2);

    const backupCam: Camera = {
      id: `cam-patch-${Date.now()}`,
      name: `AI Remediation Node (${targetZone.name.split(' ').slice(-1)[0]})`,
      type: 'dome',
      x: defaultX,
      y: defaultY,
      angle: 90,
      fov: 110, // Wider FOV for quick remediation
      range: 16,
      resolution: '2K',
      status: 'active',
      zone: targetZone.name
    };

    onUpdateCameras([...cameras, backupCam]);
    onAddAlert(`AI Auto-Patch: Successfully deployed "${backupCam.name}" at coordinate [x: ${defaultX}%, y: ${defaultY}%] to cover blind zones!`, 'low');
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      
      {/* Top summary card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl border ${
            blindSpots.length === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse'
          }`}>
            <EyeOff className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-base">Perimeter Blind Spot Audit</h4>
            <p className="text-slate-400 text-xs font-medium">Real-time analysis of facility vulnerability sectors</p>
          </div>
        </div>

        <div className="flex items-center gap-6 divide-l divide-slate-100 pl-6 shrink-0 font-mono text-xs text-slate-500">
          <div className="pl-6">
            <span className="block text-slate-400 text-[10px]">FACILITY COVERAGE</span>
            <span className="text-xl font-bold font-sans text-slate-800">{siteCoverage}%</span>
          </div>
          <div className="pl-6">
            <span className="block text-slate-400 text-[10px]">VULNERABLE BLIND SPOTS</span>
            <span className={`text-xl font-bold font-sans ${blindSpots.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {blindSpots.length} Regions
            </span>
          </div>
        </div>
      </div>

      {/* Main Breakdown Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Identified Blind Zones List */}
        <div className="lg:col-span-2 space-y-4">
          <h5 className="font-sans font-bold text-slate-800 text-sm">Active Coverage Outages & Gaps</h5>

          {blindSpots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-md">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-base">Perfect Security Symmetrical Mesh!</p>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  All active facility zones are monitored. There are currently zero high-threat blind spots.
                </p>
              </div>
            </div>
          ) : (
            blindSpots.map((spot) => (
              <div key={spot.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:border-slate-300 transition-colors">
                <div className="flex-1 flex gap-4">
                  <div className={`p-3 rounded-xl border shrink-0 h-11 w-11 flex items-center justify-center ${
                    spot.criticality === 'high' ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-amber-50 border-amber-100 text-amber-500'
                  }`}>
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{spot.zoneName}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                        spot.criticality === 'high' 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {spot.criticality} risk gap
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">{spot.description}</p>
                    <div className="flex items-center gap-1.5 mt-3 text-[11px] font-mono text-slate-400">
                      <span>Security Vulnerability Score:</span>
                      <span className={`font-bold ${spot.criticality === 'high' ? 'text-rose-500' : 'text-amber-500'}`}>
                        {spot.vulnerabilityScore}/100
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <button
                    onClick={() => handleApplyRemediation(spot)}
                    className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer select-none"
                    title="Deploy an automated camera dome inside this room center to resolve blind spots immediately"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Deploy AI Countermeasure</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Security Audit Guideline Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5 self-start">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
            <Cpu className="w-5 h-5 text-slate-700" />
            <h5 className="font-sans font-bold text-slate-800 text-sm">Automated Patching</h5>
          </div>

          <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
            <p>
              SentinelAI dynamically scans the coordinate matrix of your layout 24/7. When cameras go offline, lens angles drift, or partitions are altered, unmonitored grids trigger alerts.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <span className="font-bold text-slate-700 text-[11px] block">Standard Remediation Steps:</span>
              <ol className="list-decimal pl-4 space-y-1 font-mono text-[10px]">
                <li>Assess the risk criticality of the zone (Server room = top priority).</li>
                <li>Restructure existing camera rotations or FOVs.</li>
                <li>Mount virtual AI dome sensors as emergency backups.</li>
              </ol>
            </div>
            <p>
              Applying an <strong>AI Countermeasure</strong> automatically positions a virtual high-definition dome node directly centered within the unmonitored zone to immediately recover full site integrity.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
