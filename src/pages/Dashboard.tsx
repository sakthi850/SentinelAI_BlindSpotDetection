import React from 'react';
import { 
  ShieldCheck, 
  Percent, 
  EyeOff, 
  Video, 
  TrendingDown, 
  AlertTriangle,
  Activity,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { Camera, Zone, Alert } from '../types';
import { 
  calculateSiteCoverage, 
  calculateOverallSecurityScore, 
  getDynamicBlindSpots 
} from '../utils/geometry';

interface DashboardProps {
  cameras: Camera[];
  zones: Zone[];
  alerts: Alert[];
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ cameras, zones, alerts, setActiveTab }: DashboardProps) {
  const securityScore = calculateOverallSecurityScore(cameras, zones);
  const coveragePercent = calculateSiteCoverage(cameras, zones);
  const blindSpots = getDynamicBlindSpots(cameras, zones);
  const activeCameras = cameras.filter(c => c.status === 'active').length;
  const maintenanceCameras = cameras.filter(c => c.status === 'maintenance').length;
  const offlineCameras = cameras.filter(c => c.status === 'outage').length;

  // Calculate dynamic overall risk score based on gaps
  const riskScore = Math.min(100, Math.max(0, 100 - securityScore));

  const statCards = [
    {
      title: 'Security Score',
      value: `${securityScore}/100`,
      desc: 'Overall asset security status',
      icon: ShieldCheck,
      color: securityScore >= 80 ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : securityScore >= 60 ? 'text-amber-500 bg-amber-50 border-amber-100' : 'text-rose-500 bg-rose-50 border-rose-100',
    },
    {
      title: 'Physical Coverage',
      value: `${coveragePercent}%`,
      desc: 'Active camera FOV overlaps',
      icon: Percent,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
    },
    {
      title: 'Active Blind Spots',
      value: blindSpots.length.toString(),
      desc: 'Vulnerable perimeter gaps',
      icon: EyeOff,
      color: blindSpots.length > 0 ? 'text-rose-600 bg-rose-50 border-rose-100 animate-pulse' : 'text-slate-500 bg-slate-50 border-slate-100',
    },
    {
      title: 'Active Cameras',
      value: `${activeCameras}/${cameras.length}`,
      desc: `${offlineCameras} Offline • ${maintenanceCameras} Maintenance`,
      icon: Video,
      color: offlineCameras > 0 ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none">
          <svg className="w-full h-full text-cyan-400" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="50,0 100,0 100,100 10,100" />
          </svg>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                SentinelAI Platform
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <h3 className="text-2xl font-sans font-bold text-white tracking-tight">Enterprise Safety Command</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Real-time multi-angle physical intelligence feed. Use the AI Camera Optimizer to automatically resolve blind zones.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('optimization')}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-600 hover:to-indigo-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer select-none"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Run AI Security Optimizer</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-1">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{card.title}</span>
                <span className="text-2xl font-sans font-bold text-slate-800 tracking-tight mt-1">{card.value}</span>
                <span className="text-slate-400 text-xs mt-1 font-medium">{card.desc}</span>
              </div>
              <div className={`p-4 rounded-2xl border ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Coverage Analysis & Live Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Coverage by Zone */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-sans font-bold text-slate-800 text-base">Facility Coverage Matrix</h4>
              <p className="text-slate-400 text-xs font-medium">Geometric breakdown per facility zone</p>
            </div>
            <button 
              onClick={() => setActiveTab('twin')}
              className="text-cyan-600 hover:text-cyan-700 font-medium text-xs flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Launch Twin Builder</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {zones.map((zone) => {
              // Calculate specific coverage for this single zone
              const zoneCoverage = calculateSiteCoverage(cameras, [zone]);
              
              let statusText = 'Secure';
              let statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
              if (zoneCoverage < 40) {
                statusText = 'Critical';
                statusStyle = 'bg-rose-50 text-rose-700 border-rose-100';
              } else if (zoneCoverage < 75) {
                statusText = 'Vulnerable';
                statusStyle = 'bg-amber-50 text-amber-700 border-amber-100';
              }

              return (
                <div key={zone.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-sm text-slate-800">{zone.name}</span>
                      <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${statusStyle}`}>
                        {statusText}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            zoneCoverage >= 75 ? 'bg-emerald-500' : zoneCoverage >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${zoneCoverage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-600 w-10 text-right">{zoneCoverage}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-500 shrink-0 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                    <div>
                      <span className="block text-slate-400 text-[10px]">BASE RISK</span>
                      <span className={`font-bold uppercase ${
                        zone.baseRisk === 'high' ? 'text-rose-600' : zone.baseRisk === 'medium' ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        {zone.baseRisk}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">CAMERAS</span>
                      <span className="font-bold text-slate-700">
                        {cameras.filter(c => c.zone === zone.name).length} Nodes
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live System Logs & Threats */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-sans font-bold text-slate-800 text-base">Security Activity log</h4>
              <p className="text-slate-400 text-xs font-medium">Real-time system health alerts</p>
            </div>
            <span className="p-1 text-slate-400 hover:text-slate-600 cursor-help" title="These logs update in real-time based on simulation status or hardware events.">
              <HelpCircle className="w-4 h-4" />
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-96">
            {alerts.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Activity className="w-8 h-8 text-slate-300" />
                <span className="text-xs">No active event streams yet.</span>
              </div>
            ) : (
              alerts.slice().reverse().map((alert) => (
                <div key={alert.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex gap-3">
                  <div className="mt-0.5">
                    {alert.severity === 'high' ? (
                      <XCircle className="w-4 h-4 text-rose-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-700 font-medium leading-normal">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">{alert.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
