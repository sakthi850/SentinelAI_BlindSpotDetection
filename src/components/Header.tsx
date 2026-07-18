import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  RefreshCw, 
  Upload, 
  Clock, 
  HelpCircle,
  FileCheck2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Camera, Alert } from '../types';

interface HeaderProps {
  activeTab: string;
  cameras: Camera[];
  alerts: Alert[];
  onReset: () => void;
  onImportCameras: (imported: Camera[]) => void;
}

export default function Header({ activeTab, cameras, alerts, onReset, onImportCameras }: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTabTitle = (tab: string) => {
    return tab.charAt(0).toUpperCase() + tab.slice(1).replace('twin', 'Digital Twin').replace('cameras', 'Camera Management').replace('blindspots', 'Blind Spot Detection').replace('risk', 'Risk Intelligence').replace('optimization', 'Camera Optimization');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        
        // Let's support parsing either structured JSON or simple CSV list
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            // Validate properties
            const validated = parsed.filter(item => item.name && typeof item.x === 'number' && typeof item.y === 'number');
            if (validated.length > 0) {
              onImportCameras(validated as Camera[]);
              setImportError(null);
              alert(`Successfully loaded ${validated.length} cameras!`);
            } else {
              setImportError('Invalid JSON format. Expected an array of camera objects.');
            }
          }
        } else {
          // Parse CSV
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const imported: Camera[] = [];

          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim());
            const row: any = {};
            headers.forEach((h, idx) => {
              row[h] = values[idx];
            });

            if (row.name && row.x !== undefined && row.y !== undefined) {
              imported.push({
                id: row.id || `imported-${Date.now()}-${i}`,
                name: row.name,
                type: (row.type as any) || 'dome',
                x: parseFloat(row.x),
                y: parseFloat(row.y),
                angle: parseFloat(row.angle || '0'),
                fov: parseFloat(row.fov || '90'),
                range: parseFloat(row.range || '15'),
                resolution: (row.resolution as any) || '1080p',
                status: (row.status as any) || 'active',
                zone: row.zone || 'General Office Floor'
              });
            }
          }

          if (imported.length > 0) {
            onImportCameras(imported);
            setImportError(null);
            alert(`Successfully loaded ${imported.length} cameras from CSV dataset!`);
          } else {
            setImportError('Could not parse any valid cameras. Ensure headers include: name, x, y, angle, fov, range.');
          }
        }
      } catch (err: any) {
        setImportError(`Parse error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const unreadAlerts = alerts.filter(a => !a.resolved);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 select-none">
      {/* Tab/Page Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-sans font-bold text-slate-800 tracking-tight">
          {formatTabTitle(activeTab)}
        </h2>
        <span className="hidden md:inline px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Site: Headquarters Floor 1
        </span>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Real-time clocks */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-500 border-r border-slate-200 pr-4">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>UTC: {time.toISOString().substring(11, 19)}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-cyan-50/40 px-2 py-1 rounded-md border border-cyan-100/30 text-cyan-700">
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
            <span>LOCAL: {time.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Upload Dataset Button */}
        <div className="relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv,.json" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Import custom camera coordinates (CSV or JSON)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Load Dataset</span>
          </button>
        </div>

        {/* Reset System State Button */}
        <button 
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          title="Restore original facility configurations"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset defaults</span>
        </button>

        {/* Live Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {/* Alert Dropdown list */}
          {showNotificationDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-700">Alert Center</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold font-mono">
                  {unreadAlerts.length} Active
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">
                    No active system alerts or events.
                  </div>
                ) : (
                  alerts.slice().reverse().map((alert) => (
                    <div key={alert.id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex gap-3 transition-colors">
                      <div className="mt-0.5 shrink-0">
                        {alert.severity === 'high' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                        ) : (
                          <Info className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-700 font-medium leading-tight">{alert.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[9px] font-mono text-slate-400">{alert.timestamp}</span>
                          <span className={`text-[9px] font-mono px-1 rounded uppercase font-bold ${
                            alert.severity === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
