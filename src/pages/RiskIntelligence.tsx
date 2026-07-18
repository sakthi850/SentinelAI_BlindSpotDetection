import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Flame, 
  TrendingUp, 
  Moon, 
  CloudLightning, 
  Compass, 
  ShieldCheck,
  AlertTriangle,
  Radio,
  EyeOff
} from 'lucide-react';
import { Camera, Zone } from '../types';
import { calculateSiteCoverage } from '../utils/geometry';

interface RiskIntelligenceProps {
  cameras: Camera[];
  zones: Zone[];
}

type ThreatPreset = 'normal' | 'after-hours' | 'weather' | 'high-alert';

export default function RiskIntelligence({ cameras, zones }: RiskIntelligenceProps) {
  const [activePreset, setActivePreset] = useState<ThreatPreset>('normal');

  // Multipliers for threat scores based on preset
  const getPresetMultipliers = (preset: ThreatPreset) => {
    switch (preset) {
      case 'after-hours':
        return { lobby: 1.4, server: 1.8, office: 1.1, dock: 1.6, alley: 1.9, label: 'After-Hours Vault Lockup', desc: 'Slightly higher intrusion risks at backdoors & gates.' };
      case 'weather':
        return { lobby: 1.2, server: 1.0, office: 1.0, dock: 1.5, alley: 1.8, label: 'Severe Weather / Visual Squeeze', desc: 'Degraded visibility on outdoor bullet ranges.' };
      case 'high-alert':
        return { lobby: 2.0, server: 2.0, office: 1.8, dock: 2.0, alley: 2.0, label: 'ACTIVE THREAT / SITE PROTOCOL', desc: 'Maximum alert. Immediate response required.' };
      default:
        return { lobby: 1.0, server: 1.0, office: 1.0, dock: 1.0, alley: 1.0, label: 'Normal Daytime Shift', desc: 'Standard business operational safety conditions.' };
    }
  };

  const presetConfig = getPresetMultipliers(activePreset);

  const calculateThreatIndex = (zone: Zone, multiplier: number) => {
    const coverage = calculateSiteCoverage(cameras, [zone]);
    
    // Risk base weight
    const baseWeight = zone.baseRisk === 'high' ? 75 : zone.baseRisk === 'medium' ? 45 : 20;
    
    // Safety buffer offered by coverage
    const safetyBuffer = coverage; 
    
    // Threat score: (baseWeight * multiplier) - safety contribution
    const score = Math.round(Math.max(5, Math.min(100, (baseWeight * multiplier) - (safetyBuffer * 0.5))));
    return score;
  };

  const presets = [
    { id: 'normal', name: 'Normal Shift', icon: Compass, color: 'border-slate-200 text-slate-700 bg-slate-50' },
    { id: 'after-hours', name: 'Night Vault', icon: Moon, color: 'border-indigo-100 text-indigo-700 bg-indigo-50/50' },
    { id: 'weather', name: 'Severe Storm', icon: CloudLightning, color: 'border-amber-100 text-amber-700 bg-amber-50/50' },
    { id: 'high-alert', name: 'Site Threat', icon: Flame, color: 'border-rose-100 text-rose-700 bg-rose-50/50 animate-pulse' },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      
      {/* Preset controller block */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-base">Active Threat Profiler</h4>
            <p className="text-slate-400 text-xs font-medium">Select a situation matrix to recalculate structural vulnerabilities</p>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-bold text-slate-600">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-ping" />
            <span>PROFILER ENGINE ACTIVE</span>
          </div>
        </div>

        {/* Preset Selector Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {presets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setActivePreset(preset.id as ThreatPreset)}
                className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  isSelected 
                    ? 'ring-2 ring-cyan-500 border-cyan-500 bg-cyan-50/10 text-cyan-700' 
                    : preset.color
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold font-sans uppercase tracking-wider">{preset.name}</span>
              </button>
            );
          })}
        </div>

        {/* Current profile description */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 flex items-center gap-2">
          <span className="font-bold text-slate-700 font-sans">{presetConfig.label}:</span>
          <span>{presetConfig.desc}</span>
        </div>
      </div>

      {/* Threat Indexes Output Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => {
          let multiplier = 1.0;
          if (zone.name.includes('Lobby')) multiplier = presetConfig.lobby;
          else if (zone.name.includes('Server')) multiplier = presetConfig.server;
          else if (zone.name.includes('Executive')) multiplier = presetConfig.office;
          else if (zone.name.includes('Loading')) multiplier = presetConfig.dock;
          else if (zone.name.includes('Alley')) multiplier = presetConfig.alley;

          const threatIndex = calculateThreatIndex(zone, multiplier);
          const coverage = calculateSiteCoverage(cameras, [zone]);

          let meterColor = 'bg-emerald-500';
          let textColor = 'text-emerald-600';
          let bgBox = 'bg-emerald-50/30 border-emerald-100';
          if (threatIndex > 65) {
            meterColor = 'bg-rose-500';
            textColor = 'text-rose-600';
            bgBox = 'bg-rose-50/30 border-rose-100';
          } else if (threatIndex > 35) {
            meterColor = 'bg-amber-500';
            textColor = 'text-amber-600';
            bgBox = 'bg-amber-50/30 border-amber-100';
          }

          return (
            <div key={zone.id} className={`p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-6`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">{zone.name}</span>
                  <span className={`text-xs font-mono font-bold ${textColor}`}>
                    Threat: {threatIndex}%
                  </span>
                </div>

                {/* Meter Display */}
                <div className="space-y-1.5">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${meterColor}`} style={{ width: `${threatIndex}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>LOW EXPOSURE</span>
                    <span>HIGH SUSCEPTIBILITY</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Assessment box */}
              <div className={`p-3.5 rounded-xl border text-xs leading-normal ${bgBox}`}>
                {threatIndex > 65 ? (
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-rose-800">
                      <strong>Critical Vulnerability!</strong> Low visual coverage ({coverage}%) combined with active hazard levels. Immediate sensor repositioning recommended.
                    </p>
                  </div>
                ) : threatIndex > 35 ? (
                  <div className="flex gap-2">
                    <EyeOff className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-amber-800">
                      <strong>Elevated Risk.</strong> Coverage coverage is moderate ({coverage}%). Recommended to set camera PTZ sweeps to higher refresh intervals.
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-emerald-800">
                      <strong>Site Secure.</strong> Thick overlapping lens cones ({coverage}%) suppress threats. No urgent actions necessary.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
