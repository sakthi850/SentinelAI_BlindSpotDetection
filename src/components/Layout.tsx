import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Camera, Alert } from '../types';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cameras: Camera[];
  alerts: Alert[];
  onReset: () => void;
  onImportCameras: (imported: Camera[]) => void;
  children: React.ReactNode;
}

export default function Layout({ 
  activeTab, 
  setActiveTab, 
  cameras, 
  alerts, 
  onReset, 
  onImportCameras, 
  children 
}: LayoutProps) {
  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden text-slate-800">
      {/* Sidebar - Persistent left navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        cameras={cameras} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Navigation */}
        <Header 
          activeTab={activeTab} 
          cameras={cameras} 
          alerts={alerts} 
          onReset={onReset} 
          onImportCameras={onImportCameras} 
        />

        {/* Tab/Page Router Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-6 md:p-8 min-h-full flex flex-col gap-6 md:gap-8 max-w-[1600px] mx-auto w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
