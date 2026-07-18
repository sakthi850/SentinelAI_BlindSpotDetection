import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  RefreshCw, 
  Upload, 
  Clock, 
  HelpCircle,
  FileCheck2,
  AlertTriangle,
  Info,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Terminal
} from 'lucide-react';
import { Camera, Alert } from '../types';
import { DEFAULT_ZONES } from '../data/defaultCameras';

interface HeaderProps {
  activeTab: string;
  cameras: Camera[];
  alerts: Alert[];
  onReset: () => void;
  onImportCameras: (imported: Camera[]) => void;
}

interface ParseResult {
  cameras: Camera[];
  errors: string[];
  warnings: string[];
  headerMapping: Record<string, string>;
  isScaled: boolean;
  totalParsed: number;
}

// Map common header variations to standardized fields
const normalizeHeader = (h: string): string => {
  const clean = h.trim().toLowerCase().replace(/[\s_%().-]/g, '');
  if (/^(name|label|camera|sensor|id|identifier|title|camname|sensorname)$/.test(clean)) return 'name';
  if (/^(x|posx|coordinatex|coordx|left|longitude|lon|lng|xcoord|xval)$/.test(clean)) return 'x';
  if (/^(y|posy|coordinatey|coordy|top|latitude|lat|ycoord|yval)$/.test(clean)) return 'y';
  if (/^(angle|direction|rotation|pan|tilt|bearing|rot|degree)$/.test(clean)) return 'angle';
  if (/^(fov|fieldofview|anglewidth|beam|width|lens)$/.test(clean)) return 'fov';
  if (/^(range|distance|viewdistance|radius|coveragerange|reach)$/.test(clean)) return 'range';
  if (/^(resolution|res|quality|pixels|videoquality)$/.test(clean)) return 'resolution';
  if (/^(status|state|active|online|operational)$/.test(clean)) return 'status';
  if (/^(zone|room|area|location|placement|sector|facilityzone)$/.test(clean)) return 'zone';
  if (/^(type|hardware|model|category|formfactor|camtype)$/.test(clean)) return 'type';
  return clean;
};

export default function Header({ activeTab, cameras, alerts, onReset, onImportCameras }: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Advanced Importer Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTabTitle = (tab: string) => {
    return tab.charAt(0).toUpperCase() + tab.slice(1).replace('twin', 'Digital Twin').replace('cameras', 'Camera Management').replace('blindspots', 'Blind Spot Detection').replace('risk', 'Risk Intelligence').replace('optimization', 'Camera Optimization');
  };

  // Helper to parse any string into numeric value, stripping symbols like % or px
  const parseNum = (val: any): number => {
    if (val === undefined || val === null) return NaN;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? NaN : num;
  };

  // Dynamic Zone matching based on coordinates
  const getZoneForCoords = (x: number, y: number): string => {
    for (const zone of DEFAULT_ZONES) {
      if (x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height) {
        return zone.name;
      }
    }
    // Fallback to closest zone center
    let minDistance = Infinity;
    let closestZone = 'General Office Floor';
    for (const zone of DEFAULT_ZONES) {
      const cx = zone.x + zone.width / 2;
      const cy = zone.y + zone.height / 2;
      const dist = Math.pow(x - cx, 2) + Math.pow(y - cy, 2);
      if (dist < minDistance) {
        minDistance = dist;
        closestZone = zone.name;
      }
    }
    return closestZone;
  };

  // Highly robust parser accepting CSV or JSON text
  const parseDataset = (rawText: string, isJson: boolean): ParseResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const headerMapping: Record<string, string> = {};
    const finalCameras: Camera[] = [];
    let rawRows: any[] = [];

    if (isJson) {
      try {
        const parsed = JSON.parse(rawText);
        if (Array.isArray(parsed)) {
          rawRows = parsed;
        } else if (parsed && typeof parsed === 'object') {
          // If wrapped in an envelope object, look for any array field
          let foundArray = false;
          for (const key of Object.keys(parsed)) {
            if (Array.isArray(parsed[key])) {
              rawRows = parsed[key];
              foundArray = true;
              warnings.push(`Auto-extracted camera array from JSON property: "${key}"`);
              break;
            }
          }
          if (!foundArray) {
            throw new Error('JSON is not an array of camera objects, nor does it contain a nested camera array.');
          }
        } else {
          throw new Error('Invalid JSON format.');
        }
      } catch (err: any) {
        throw new Error(`JSON format error: ${err.message}`);
      }
    } else {
      // Process CSV
      const lines = rawText.split(/\r?\n/);
      const firstLine = lines.find(l => l.trim().length > 0) || '';
      if (!firstLine) {
        throw new Error('CSV is empty or missing headers.');
      }

      // Detect delimiter based on character occurrences in the header line
      const delimiters = [',', ';', '\t', '|'];
      let chosenDelimiter = ',';
      let maxCount = -1;
      delimiters.forEach(delim => {
        const count = (firstLine.match(new RegExp('\\' + delim, 'g')) || []).length;
        if (count > maxCount) {
          maxCount = count;
          chosenDelimiter = delim;
        }
      });

      // Split line respecting double quotes
      const splitLine = (line: string): string[] => {
        const result: string[] = [];
        let cell = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === chosenDelimiter && !inQuotes) {
            result.push(cell.trim());
            cell = '';
          } else {
            cell += char;
          }
        }
        result.push(cell.trim());
        return result;
      };

      const rawHeaders = splitLine(firstLine).map(h => h.replace(/^["']|["']$/g, '').trim());
      rawHeaders.forEach(h => {
        headerMapping[h] = normalizeHeader(h);
      });

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cells = splitLine(line).map(c => c.replace(/^["']|["']$/g, '').trim());
        const rowObj: any = {};
        rawHeaders.forEach((header, idx) => {
          rowObj[headerMapping[header] || header] = cells[idx];
        });
        rawRows.push(rowObj);
      }
    }

    // Now normalize keys and values
    const normalizedRows = rawRows.map((row) => {
      const norm: any = {};
      Object.keys(row).forEach(key => {
        const standardKey = normalizeHeader(key);
        norm[standardKey] = row[key];
      });
      return norm;
    });

    // Handle coordinate range checking and normalization
    const xCoords = normalizedRows.map(r => parseNum(r.x)).filter(v => !isNaN(v));
    const yCoords = normalizedRows.map(r => parseNum(r.y)).filter(v => !isNaN(v));

    const minX = xCoords.length ? Math.min(...xCoords) : 0;
    const maxX = xCoords.length ? Math.max(...xCoords) : 100;
    const minY = yCoords.length ? Math.min(...yCoords) : 0;
    const maxY = yCoords.length ? Math.max(...yCoords) : 100;

    // Scale if coordinates lie outside standard 0-100 range
    const isScaled = (minX < 0 || maxX > 100 || minY < 0 || maxY > 100);
    if (isScaled) {
      warnings.push(`Coordinates auto-scaled: X bounds [${minX}, ${maxX}] and Y bounds [${minY}, ${maxY}] translated to map percentages.`);
    }

    const hasAnyCoords = xCoords.length > 0 && yCoords.length > 0;
    if (!hasAnyCoords) {
      warnings.push('No spatial coordinates detected. Nodes placed symmetrically on a workspace grid layout.');
    }

    normalizedRows.forEach((row, idx) => {
      let rawX = parseNum(row.x);
      let rawY = parseNum(row.y);

      let x = 50;
      let y = 50;

      if (hasAnyCoords) {
        if (isScaled) {
          x = maxX === minX ? 50 : Math.round(10 + ((rawX - minX) / (maxX - minX)) * 80);
          y = maxY === minY ? 50 : Math.round(10 + ((rawY - minY) / (maxY - minY)) * 80);
        } else {
          x = isNaN(rawX) ? 50 : Math.max(0, Math.min(100, Math.round(rawX)));
          y = isNaN(rawY) ? 50 : Math.max(0, Math.min(100, Math.round(rawY)));
        }
      } else {
        // distribute sequentially on grid
        x = 10 + (idx % 5) * 20;
        y = 10 + Math.floor(idx / 5) * 20;
      }

      // Hardware form normalizer
      let type: 'dome' | 'bullet' | 'ptz' | 'fisheye' = 'dome';
      const rawType = String(row.type || '').toLowerCase();
      if (rawType.includes('bullet') || rawType.includes('lane') || rawType.includes('outdoor')) type = 'bullet';
      else if (rawType.includes('ptz') || rawType.includes('sweep') || rawType.includes('active') || rawType.includes('patrol')) type = 'ptz';
      else if (rawType.includes('fisheye') || rawType.includes('omni') || rawType.includes('360')) type = 'fisheye';

      // Status normalizer
      let status: 'active' | 'outage' | 'maintenance' = 'active';
      const rawStatus = String(row.status || '').toLowerCase();
      if (rawStatus.includes('out') || rawStatus.includes('off') || rawStatus.includes('fail') || rawStatus.includes('down')) status = 'outage';
      else if (rawStatus.includes('maint') || rawStatus.includes('repair') || rawStatus.includes('inspect')) status = 'maintenance';

      // Resolution normalizer
      let resolution: '1080p' | '2K' | '4K' = '1080p';
      const rawRes = String(row.resolution || '').toLowerCase();
      if (rawRes.includes('4k') || rawRes.includes('2160') || rawRes.includes('3840')) resolution = '4K';
      else if (rawRes.includes('2k') || rawRes.includes('1440') || rawRes.includes('1080')) resolution = '2K';

      // Custom or calculated zone
      const zone = row.zone ? String(row.zone).trim() : getZoneForCoords(x, y);

      finalCameras.push({
        id: row.id || `imported-${Date.now()}-${idx}`,
        name: row.name ? String(row.name).trim() : `Security Camera ${idx + 1}`,
        type,
        x,
        y,
        angle: isNaN(parseNum(row.angle)) ? 90 : parseNum(row.angle),
        fov: isNaN(parseNum(row.fov)) ? 90 : parseNum(row.fov),
        range: isNaN(parseNum(row.range)) ? 15 : parseNum(row.range),
        resolution,
        status,
        zone
      });
    });

    if (finalCameras.length === 0) {
      throw new Error('No valid cameras could be parsed from the provided input.');
    }

    return {
      cameras: finalCameras,
      errors,
      warnings,
      headerMapping,
      isScaled,
      totalParsed: finalCameras.length
    };
  };

  const handleTextParse = () => {
    if (!importText.trim()) {
      setLocalError('Please paste some CSV text or JSON data.');
      return;
    }

    try {
      const isJson = importText.trim().startsWith('{') || importText.trim().startsWith('[');
      const res = parseDataset(importText, isJson);
      setParseResult(res);
      setLocalError(null);
    } catch (err: any) {
      setLocalError(err.message);
      setParseResult(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const isJson = file.name.endsWith('.json');
        const res = parseDataset(text, isJson);
        setParseResult(res);
        setLocalError(null);
      } catch (err: any) {
        setLocalError(`File parse error: ${err.message}`);
        setParseResult(null);
      }
    };
    reader.readAsText(file);
  };

  const executeImport = () => {
    if (parseResult && parseResult.cameras.length > 0) {
      onImportCameras(parseResult.cameras);
      setShowImportModal(false);
      setParseResult(null);
      setImportText('');
    }
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

        {/* Load Dataset Button */}
        <div className="relative">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-sm"
            title="Import custom camera coordinates CSV or JSON dataset"
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

      {/* Advanced Load Dataset Modal Overlay */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-600" />
                <div>
                  <h3 className="font-sans font-bold text-slate-800 text-sm">Smart Dataset Loader</h3>
                  <p className="text-slate-400 text-[11px] font-medium">Load, parse, and coordinate-scale any camera dataset</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowImportModal(false);
                  setParseResult(null);
                  setImportText('');
                  setLocalError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!parseResult ? (
                <>
                  {/* Supported Format guidelines */}
                  <div className="bg-cyan-50/50 border border-cyan-100 rounded-xl p-4 flex gap-3 text-xs leading-normal">
                    <Info className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold text-cyan-800">Highly Flexible Header Auto-Detection:</span>
                      <p className="text-cyan-700">
                        Our layout intelligence system automatically maps and resolves columns named <strong>name</strong> (or <em>camera</em>), <strong>x</strong> (or <em>latitude</em>, <em>left</em>), <strong>y</strong> (or <em>longitude</em>, <em>top</em>), <strong>angle</strong>, <strong>fov</strong>, <strong>range</strong>, <strong>type</strong>, and <strong>status</strong>.
                      </p>
                      <p className="text-cyan-600/90 text-[11px] italic">
                        💡 Absolute coordinates (like pixels or geo-coordinates) are automatically scaled and centered onto Floor 1 parameters.
                      </p>
                    </div>
                  </div>

                  {/* Dual upload panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File Drop Area */}
                    <div 
                      onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragOver={(e) => e.preventDefault()}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all ${
                        dragActive 
                          ? 'border-cyan-500 bg-cyan-50/20' 
                          : 'border-slate-200 hover:border-cyan-400 hover:bg-slate-50/50'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) processFile(file);
                        }} 
                        accept=".csv,.json" 
                        className="hidden" 
                      />
                      <div className="p-3 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl">
                        <Upload className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <span className="block font-bold text-slate-700 text-xs">Drag & Drop Dataset</span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">or click to browse from system</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap justify-center mt-2">
                        <span className="text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">.CSV</span>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">.JSON</span>
                      </div>
                    </div>

                    {/* Raw Text Paste Area */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Paste raw text or copy/paste:</span>
                        <span className="text-[10px] font-mono text-slate-400">CSV or JSON</span>
                      </div>
                      <textarea
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="Camera, X, Y, Range, FOV, Status&#10;Reception Desk, 32, 28, 15, 85, active&#10;Secure Server Room, 42, 8, 16, 110, outage"
                        className="flex-1 w-full h-32 border border-slate-200 rounded-2xl p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-500 bg-slate-50/30"
                      />
                    </div>
                  </div>

                  {localError && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 flex gap-2 text-xs text-rose-700 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{localError}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={handleTextParse}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs cursor-pointer shadow-md"
                    >
                      Parse Input Dataset
                    </button>
                  </div>
                </>
              ) : (
                /* Mapping and Live Preview Screen */
                <div className="space-y-6">
                  {/* Overview Stats */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="font-sans font-bold text-slate-800 text-sm">
                        Parsed {parseResult.totalParsed} Security Nodes Successfully
                      </span>
                    </div>
                    {parseResult.isScaled && (
                      <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                        Coordinates Auto-Scaled
                      </span>
                    )}
                  </div>

                  {/* Warnings & Scaling Notes */}
                  {parseResult.warnings.length > 0 && (
                    <div className="space-y-1.5">
                      {parseResult.warnings.map((w, idx) => (
                        <div key={idx} className="bg-amber-50/60 border border-amber-100 rounded-lg px-3 py-2 flex gap-2 text-[11px] text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Column mappings visual display */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <span className="block font-bold text-slate-700 text-xs mb-2">Column Header Auto-Mappings:</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(parseResult.headerMapping).map((userHeader) => (
                        <div key={userHeader} className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-mono text-slate-600">
                          <span className="font-semibold text-slate-400">{userHeader}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-cyan-600">{parseResult.headerMapping[userHeader]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Table Preview */}
                  <div className="space-y-2">
                    <span className="block font-bold text-slate-700 text-xs">Live Database Preview (First 5 records):</span>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] text-slate-500 font-bold">
                            <th className="p-3 pl-4">Camera Label</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Position</th>
                            <th className="p-3">Angle / FOV</th>
                            <th className="p-3">Calculated Zone</th>
                            <th className="p-3 pr-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {parseResult.cameras.slice(0, 5).map((cam, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 pl-4 font-bold text-slate-800">{cam.name}</td>
                              <td className="p-3 capitalize font-mono text-[11px] text-slate-500">{cam.type}</td>
                              <td className="p-3 font-mono text-slate-600">x: {cam.x}% • y: {cam.y}%</td>
                              <td className="p-3 font-mono text-slate-500">{cam.angle}° / {cam.fov}°</td>
                              <td className="p-3 text-slate-600 text-[11px] font-sans">{cam.zone}</td>
                              <td className="p-3 pr-4 text-right">
                                <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border ${
                                  cam.status === 'active' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : cam.status === 'outage'
                                    ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  {cam.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions footer inside modal */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <button
                      onClick={() => {
                        setParseResult(null);
                        setLocalError(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear & Upload New Dataset
                    </button>
                    <button
                      onClick={executeImport}
                      className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white rounded-xl font-bold text-xs shadow-md shadow-cyan-600/15 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Import Dataset</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

