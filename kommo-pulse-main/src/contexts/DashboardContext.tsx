import React, { createContext, useContext, useState, useEffect } from 'react';

interface DashboardSettings {
  layout: 'grid' | 'list';
  showMetrics: boolean;
  showCharts: boolean;
  showHeatmap: boolean;
  showFunnel: boolean;
  showCommunication: boolean;
  showStageAnalysis: boolean;
  refreshInterval: number; // in seconds
  autoRefresh: boolean;
}

interface DashboardContextType {
  settings: DashboardSettings;
  updateSettings: (newSettings: Partial<DashboardSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: DashboardSettings = {
  layout: 'grid',
  showMetrics: true,
  showCharts: true,
  showHeatmap: true,
  showFunnel: true,
  showCommunication: true,
  showStageAnalysis: true,
  refreshInterval: 300, // 5 minutes
  autoRefresh: false,
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: React.ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<DashboardSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<DashboardSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboard-settings', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dashboard-settings');
    }
  };

  return (
    <DashboardContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </DashboardContext.Provider>
  );
};
