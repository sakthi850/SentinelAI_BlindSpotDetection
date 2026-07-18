import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DigitalTwin from './pages/DigitalTwin';
import CameraManagement from './pages/CameraManagement';
import BlindSpotDetection from './pages/BlindSpotDetection';
import RiskIntelligence from './pages/RiskIntelligence';
import CameraOptimization from './pages/CameraOptimization';
import Simulation from './pages/Simulation';
import Reports from './pages/Reports';
import { Camera, Zone, Alert } from './types';
import { DEFAULT_CAMERAS, DEFAULT_ZONES } from './data/defaultCameras';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [cameras, setCameras] = useState<Camera[]>(DEFAULT_CAMERAS);
  const [zones] = useState<Zone[]>(DEFAULT_ZONES);
  
  // Real-time system alert alerts
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 'alert-1',
      timestamp: new Date(Date.now() - 60000 * 10).toLocaleTimeString(),
      message: 'SentinelAI geometric visual analyzer booted successfully.',
      severity: 'low',
      resolved: false
    },
    {
      id: 'alert-2',
      timestamp: new Date(Date.now() - 60000 * 5).toLocaleTimeString(),
      message: 'Hardware Alert: Camera "Executive Corridor Pivot" reports OUTAGE state.',
      severity: 'high',
      resolved: false
    },
    {
      id: 'alert-3',
      timestamp: new Date(Date.now() - 60000 * 2).toLocaleTimeString(),
      message: 'Maintenance Notice: Camera "Back Alley West" offline for routine diagnostics.',
      severity: 'medium',
      resolved: false
    }
  ]);

  const handleAddAlert = (message: string, severity: 'low' | 'medium' | 'high' = 'low') => {
    const newAlert: Alert = {
      id: `alert-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      message,
      severity,
      resolved: false
    };
    setAlerts(prev => [...prev, newAlert]);
  };

  const handleUpdateCameras = (updated: Camera[]) => {
    setCameras(updated);
  };

  const handleImportCameras = (imported: Camera[]) => {
    setCameras(imported);
    handleAddAlert(`Imported custom external camera coordinates dataset. Total sensors: ${imported.length}.`, 'low');
  };

  const handleResetDefaults = () => {
    setCameras(DEFAULT_CAMERAS);
    handleAddAlert('Restored facility database registries to original default values.', 'medium');
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      cameras={cameras} 
      alerts={alerts}
      onReset={handleResetDefaults}
      onImportCameras={handleImportCameras}
    >
      {activeTab === 'dashboard' && (
        <Dashboard 
          cameras={cameras} 
          zones={zones} 
          alerts={alerts} 
          setActiveTab={setActiveTab} 
        />
      )}

      {activeTab === 'twin' && (
        <DigitalTwin 
          cameras={cameras} 
          zones={zones} 
          onUpdateCameras={handleUpdateCameras}
          onAddAlert={handleAddAlert}
        />
      )}

      {activeTab === 'cameras' && (
        <CameraManagement 
          cameras={cameras} 
          zones={zones} 
          onUpdateCameras={handleUpdateCameras}
          onAddAlert={handleAddAlert}
        />
      )}

      {activeTab === 'blindspots' && (
        <BlindSpotDetection 
          cameras={cameras} 
          zones={zones} 
          onUpdateCameras={handleUpdateCameras}
          onAddAlert={handleAddAlert}
        />
      )}

      {activeTab === 'risk' && (
        <RiskIntelligence 
          cameras={cameras} 
          zones={zones} 
        />
      )}

      {activeTab === 'optimization' && (
        <CameraOptimization 
          cameras={cameras} 
          zones={zones} 
          onUpdateCameras={handleUpdateCameras}
          onAddAlert={handleAddAlert}
        />
      )}

      {activeTab === 'simulation' && (
        <Simulation 
          cameras={cameras} 
          zones={zones} 
          onAddAlert={handleAddAlert}
        />
      )}

      {activeTab === 'reports' && (
        <Reports 
          cameras={cameras} 
          zones={zones} 
        />
      )}
    </Layout>
  );
}
