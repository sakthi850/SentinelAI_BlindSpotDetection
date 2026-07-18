import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Camera, 
  EyeOff, 
  ShieldAlert, 
  Sparkles, 
  FlaskConical, 
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Camera as CameraType } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cameras: CameraType[];
}

export default function Sidebar({ activeTab, setActiveTab, cameras }: SidebarProps) {
  const offlineCount = cameras.filter(c => c.status !== 'active').length;

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'twin', name: 'Digital Twin', icon: Building2, badge: null },
    { id: 'cameras', name: 'Camera Management', icon: Camera, badge: offlineCount > 0 ? { text: offlineCount.toString(), type: 'error' } : null },
    { id: 'blindspots', name: 'Blind Spot Detection', icon: EyeOff, badge: null },
    { id: 'risk', name: 'Risk Intelligence', icon: ShieldAlert, badge: null },
    { id: 'optimization', name: 'Camera Optimization', icon: Sparkles, badge: { text: 'AI', type: 'sparkle' } },
    { id: 'simulation', name: 'Simulation', icon: FlaskConical, badge: null },
    { id: 'reports', name: 'Reports', icon: FileText, badge: null },
  ];

  return (
    <aside className="w-68 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-gradient-to-tr from-cyan-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-cyan-500/10">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-sans font-bold tracking-tight text-lg text-white leading-none">SentinelAI</h1>
          <span className="text-[10px] font-mono font-medium tracking-widest text-cyan-400 uppercase">Defense-Grade AI</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 group font-medium text-sm text-left ${
                isActive 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                <span>{item.name}</span>
              </div>
              
              {item.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                  item.badge.type === 'error' 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse'
                }`}>
                  {item.badge.text}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Health Summary Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
          <span>SYSTEM INTEGRITY</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            SECURE
          </span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="text-[11px] text-slate-400 leading-tight">
            Ready to load custom camera datasets.
          </div>
        </div>
      </div>
    </aside>
  );
}
