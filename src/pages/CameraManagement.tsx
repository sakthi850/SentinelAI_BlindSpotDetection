import React, { useState } from 'react';
import { 
  Camera, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Power, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench,
  VideoOff,
  Video
} from 'lucide-react';
import { Camera as CameraType, CameraType as HardwareType, CameraStatus, Zone } from '../types';

interface CameraManagementProps {
  cameras: CameraType[];
  zones: Zone[];
  onUpdateCameras: (updated: CameraType[]) => void;
  onAddAlert: (msg: string, severity: 'low' | 'medium' | 'high') => void;
}

export default function CameraManagement({ cameras, zones, onUpdateCameras, onAddAlert }: CameraManagementProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Add new camera inline form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCamName, setNewCamName] = useState('');
  const [newCamType, setNewCamType] = useState<HardwareType>('dome');
  const [newCamZone, setNewCamZone] = useState('Main Lobby & Entrance');
  const [newCamRes, setNewCamRes] = useState<'1080p' | '2K' | '4K'>('1080p');

  const filteredCameras = cameras.filter(cam => {
    const matchesSearch = cam.name.toLowerCase().includes(search.toLowerCase()) || 
                          cam.zone.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (id: string) => {
    const updated = cameras.map(cam => {
      if (cam.id === id) {
        const nextStatus: CameraStatus = cam.status === 'active' ? 'outage' : 'active';
        onAddAlert(`Toggled camera "${cam.name}" to operational state: ${nextStatus.toUpperCase()}`, nextStatus === 'active' ? 'low' : 'high');
        return { ...cam, status: nextStatus };
      }
      return cam;
    });
    onUpdateCameras(updated);
  };

  const handleDeleteCamera = (id: string) => {
    const target = cameras.find(c => c.id === id);
    onUpdateCameras(cameras.filter(cam => cam.id !== id));
    if (target) {
      onAddAlert(`Removed security camera "${target.name}" from network registers`, 'medium');
    }
  };

  const handleCreateCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamName.trim()) return;

    // Default coordinate near center of chosen zone
    const chosenZone = zones.find(z => z.name === newCamZone) || zones[0];
    const defaultX = Math.round(chosenZone.x + chosenZone.width / 2);
    const defaultY = Math.round(chosenZone.y + chosenZone.height / 2);

    const newCam: CameraType = {
      id: `cam-${Date.now()}`,
      name: newCamName,
      type: newCamType,
      x: defaultX,
      y: defaultY,
      angle: 90,
      fov: 90,
      range: 15,
      resolution: newCamRes,
      status: 'active',
      zone: newCamZone
    };

    onUpdateCameras([...cameras, newCam]);
    setNewCamName('');
    setShowAddForm(false);
    onAddAlert(`Registered new ${newCamType.toUpperCase()} node "${newCamName}" at coordinate (${defaultX}%, ${defaultY}%)`, 'low');
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      
      {/* Search and Filters control toolbar */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cameras by label or facility room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/10 focus:border-cyan-500"
            />
          </div>

          {/* Status selector filter */}
          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none appearance-none font-medium text-slate-600 min-w-[150px]"
            >
              <option value="all">All Operational States</option>
              <option value="active">Active Online</option>
              <option value="outage">Active Outages</option>
              <option value="maintenance">Maintenance Slates</option>
            </select>
            <Filter className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Trigger inline uploader form */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Camera</span>
        </button>
      </div>

      {/* Add Camera Modal Form */}
      {showAddForm && (
        <form onSubmit={handleCreateCamera} className="bg-white p-6 rounded-2xl border border-cyan-100 shadow-lg flex flex-col gap-4 animate-fade-in">
          <h4 className="font-sans font-bold text-slate-800 text-base">Register New Optical Sensor Node</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sensor Label</label>
              <input
                type="text"
                placeholder="e.g. Server Aisle 3 Entrance"
                value={newCamName}
                onChange={(e) => setNewCamName(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Hardware Form</label>
              <select
                value={newCamType}
                onChange={(e) => setNewCamType(e.target.value as HardwareType)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none"
              >
                <option value="dome">Dome (Indoor Ceiling)</option>
                <option value="bullet">Bullet (Outdoor Lane)</option>
                <option value="ptz">PTZ (Active Scanning Patrol)</option>
                <option value="fisheye">Fisheye 360 (Omnidirectional)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Facility Zone</label>
              <select
                value={newCamZone}
                onChange={(e) => setNewCamZone(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none"
              >
                {zones.map(z => (
                  <option key={z.id} value={z.name}>{z.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Visual Resolution</label>
              <select
                value={newCamRes}
                onChange={(e) => setNewCamRes(e.target.value as any)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none"
              >
                <option value="1080p">1080p Full HD</option>
                <option value="2K">2K Quad HD</option>
                <option value="4K">4K Ultra HD</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold text-xs transition-all shadow cursor-pointer"
            >
              Register Camera
            </button>
          </div>
        </form>
      )}

      {/* Camera Inventory Table Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Camera Node Info</th>
                <th className="py-4 px-6">Hardware Type</th>
                <th className="py-4 px-6">Resolution</th>
                <th className="py-4 px-6">Co-ordinates</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCameras.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No camera registers matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredCameras.map((cam) => {
                  let statusBadge = '';
                  let statusIcon = null;

                  if (cam.status === 'active') {
                    statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
                  } else if (cam.status === 'outage') {
                    statusBadge = 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse';
                    statusIcon = <AlertTriangle className="w-4 h-4 text-rose-500" />;
                  } else {
                    statusBadge = 'bg-amber-50 text-amber-700 border-amber-100';
                    statusIcon = <Wrench className="w-4 h-4 text-amber-500" />;
                  }

                  return (
                    <tr key={cam.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Label & Location */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg border ${
                            cam.status === 'active' ? 'bg-cyan-50 border-cyan-100 text-cyan-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}>
                            <Video className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800">{cam.name}</span>
                            <span className="text-xs text-slate-400 font-medium">{cam.zone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-6 font-mono text-xs text-slate-600 capitalize">
                        {cam.type}
                      </td>

                      {/* Res */}
                      <td className="py-4 px-6">
                        <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {cam.resolution}
                        </span>
                      </td>

                      {/* Coords */}
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">
                        x: {cam.x}% • y: {cam.y}%
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${statusBadge}`}>
                          {statusIcon}
                          <span className="capitalize">{cam.status}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {/* Toggle active / outage */}
                          <button
                            onClick={() => handleToggleStatus(cam.id)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              cam.status === 'active'
                                ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title={cam.status === 'active' ? 'Force offline alert' : 'Power on / Activate feed'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteCamera(cam.id)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Decommission sensor node"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
