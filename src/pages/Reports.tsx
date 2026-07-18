import React from 'react';
import { 
  FileText, 
  Printer, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  ClipboardCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { Camera, Zone } from '../types';
import { 
  calculateSiteCoverage, 
  calculateOverallSecurityScore, 
  getDynamicBlindSpots 
} from '../utils/geometry';

interface ReportsProps {
  cameras: Camera[];
  zones: Zone[];
}

export default function Reports({ cameras, zones }: ReportsProps) {
  const securityScore = calculateOverallSecurityScore(cameras, zones);
  const siteCoverage = calculateSiteCoverage(cameras, zones);
  const blindSpots = getDynamicBlindSpots(cameras, zones);
  
  const activeCount = cameras.filter(c => c.status === 'active').length;
  const offlineCount = cameras.filter(c => c.status === 'outage').length;
  const maintenanceCount = cameras.filter(c => c.status === 'maintenance').length;

  // Grade converter based on security index
  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-emerald-500 bg-emerald-50 border-emerald-100', text: 'Secure Mesh' };
    if (score >= 80) return { grade: 'A', color: 'text-emerald-500 bg-emerald-50 border-emerald-100', text: 'Highly Monitored' };
    if (score >= 70) return { grade: 'B', color: 'text-cyan-600 bg-cyan-50 border-cyan-100', text: 'Satisfactory' };
    if (score >= 55) return { grade: 'C', color: 'text-amber-500 bg-amber-50 border-amber-100', text: 'Vulnerable' };
    return { grade: 'D', color: 'text-rose-500 bg-rose-50 border-rose-100', text: 'Critical Gaps' };
  };

  const auditGrade = getGrade(securityScore);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm print:shadow-none print:border-none">
      
      {/* Report Header block */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-5 h-5 text-cyan-600" />
            <h1 className="font-sans font-bold text-slate-900 text-lg md:text-xl tracking-tight">SentinelAI Security Audit</h1>
          </div>
          <p className="text-slate-400 text-xs font-mono">Site audit index and engineering coverage certificate</p>
        </div>

        <button
          onClick={handlePrint}
          className="print:hidden px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl flex items-center gap-2 shadow transition-all cursor-pointer select-none"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save PDF</span>
        </button>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 bg-slate-50/50 rounded-2xl border border-slate-100 px-6 font-mono text-[11px] text-slate-500">
        <div>
          <span className="block text-slate-400 text-[10px]">FACILITY</span>
          <span className="font-bold text-slate-700">HQ Building Floor 1</span>
        </div>
        <div>
          <span className="block text-slate-400 text-[10px]">DATE EXECUTED</span>
          <span className="font-bold text-slate-700">{new Date().toLocaleDateString()}</span>
        </div>
        <div>
          <span className="block text-slate-400 text-[10px]">TOTAL CAMERAS</span>
          <span className="font-bold text-slate-700">{cameras.length} Installed</span>
        </div>
        <div>
          <span className="block text-slate-400 text-[10px]">INTEGRITY LEVEL</span>
          <span className="font-bold text-slate-700">Enterprise Certified</span>
        </div>
      </div>

      {/* Layout Score Breakdown Row */}
      <div className="flex flex-col md:flex-row items-center gap-6 justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center font-bold text-3xl font-sans shrink-0 ${auditGrade.color}`}>
            {auditGrade.grade}
          </div>
          <div>
            <h3 className="font-sans font-bold text-slate-800 text-base">Facility Integrity Grade: {auditGrade.text}</h3>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Calculated dynamically through camera density, sensor active parameters, and overlapping visual boundaries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 divide-l divide-slate-200 pl-6 shrink-0 font-mono text-xs">
          <div className="pl-6">
            <span className="block text-slate-400 text-[10px]">INTEGRITY INDEX</span>
            <span className="text-xl font-bold font-sans text-slate-800">{securityScore}/100</span>
          </div>
          <div className="pl-6">
            <span className="block text-slate-400 text-[10px]">TOTAL COVERAGE</span>
            <span className="text-xl font-bold font-sans text-cyan-600">{siteCoverage}%</span>
          </div>
        </div>
      </div>

      {/* Section: Zone by Zone Table breakdown */}
      <div className="space-y-4">
        <h3 className="font-sans font-bold text-slate-800 text-sm">Zone Coverage Breakdown</h3>
        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[10px] border-b border-slate-100 font-mono font-bold text-slate-500 uppercase">
                <th className="p-4 pl-6">Zone Name</th>
                <th className="p-4">Assigned Base Risk</th>
                <th className="p-4">Cameras Active</th>
                <th className="p-4 text-right pr-6">Coverage Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {zones.map((zone) => {
                const zoneCoverage = calculateSiteCoverage(cameras, [zone]);
                const camsCount = cameras.filter(c => c.zone === zone.name && c.status === 'active').length;
                return (
                  <tr key={zone.id}>
                    <td className="p-4 pl-6 text-slate-800 font-semibold">{zone.name}</td>
                    <td className="p-4 uppercase font-bold text-slate-500">
                      <span className={`${
                        zone.baseRisk === 'high' ? 'text-rose-600' : zone.baseRisk === 'medium' ? 'text-amber-500' : 'text-slate-500'
                      }`}>
                        {zone.baseRisk}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{camsCount} Active</td>
                    <td className="p-4 text-right font-mono pr-6 font-bold text-slate-800">
                      {zoneCoverage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prioritized action plan checklist */}
      <div className="space-y-4 border-t border-slate-100 pt-6">
        <h3 className="font-sans font-bold text-slate-800 text-sm">Remediation Roadmap Checklist</h3>
        <div className="space-y-3">
          {offlineCount > 0 && (
            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 flex gap-3 text-xs leading-normal">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <p className="font-bold text-rose-800">Resolve hardware offline outages ({offlineCount} active outages)</p>
                <p className="text-rose-700/80 mt-1">
                  Offline cameras leave server corridors and building corridors completely blind. Power on maintenance nodes immediately.
                </p>
              </div>
            </div>
          )}

          {blindSpots.length > 0 ? (
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 flex gap-3 text-xs leading-normal">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <p className="font-bold text-amber-800">Patch security perimeter gaps ({blindSpots.length} active blind spots)</p>
                <p className="text-amber-700/80 mt-1">
                  Adjust active dome angles in unmonitored regions or run the AI Optimizer to align overlapping coverage arcs.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex gap-3 text-xs leading-normal">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-emerald-800">All facility zones secure</p>
                <p className="text-emerald-700/80 mt-1">
                  The facility currently has 100% active blind spot eradication. Excellent security integrity maintenance.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
