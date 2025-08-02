import React, { useState, useCallback } from 'react';
import { PingPanel } from '@/components/PingPanel';
import { AddPanelButton } from '@/components/AddPanelButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, WifiOff, AlertTriangle, Camera, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScreenshot } from '@/hooks/useScreenshot';

interface Panel {
  id: string;
  target: string;
  title: string;
}

const Index = () => {
  const [panels, setPanels] = useState<Panel[]>([
    { id: '1', target: '192.168.1.1', title: 'Local Gateway' },
    { id: '2', target: '8.8.8.8', title: 'Google DNS' }
  ]);
  const [panelStatuses, setPanelStatuses] = useState<Record<string, 'online' | 'offline' | 'error'>>({});
  const [globalSoundEnabled, setGlobalSoundEnabled] = useState(true);
  const { toast } = useToast();
  const { captureFullScreen } = useScreenshot();

  const addPanel = useCallback((target: string, title: string) => {
    const newPanel = {
      id: Date.now().toString(),
      target,
      title
    };
    setPanels(prev => [...prev, newPanel]);
  }, []);

  const removePanel = useCallback((id: string) => {
    setPanels(prev => prev.filter(panel => panel.id !== id));
    setPanelStatuses(prev => {
      const newStatuses = { ...prev };
      delete newStatuses[id];
      return newStatuses;
    });
  }, []);

  const handleStatusChange = useCallback((id: string, status: 'online' | 'offline' | 'error') => {
    setPanelStatuses(prev => {
      const oldStatus = prev[id];
      if (oldStatus && oldStatus !== status) {
        const panel = panels.find(p => p.id === id);
        if (panel) {
          if (status === 'offline' || status === 'error') {
            // Only show notification if global sound is enabled (inverted logic)
            if (globalSoundEnabled) {
              toast({
                title: "Connection Lost",
                description: `${panel.title} (${panel.target}) is ${status}`,
                variant: "destructive",
              });
            }
          }
        }
      }
      return { ...prev, [id]: status };
    });
  }, [panels, toast, globalSoundEnabled]);

  const getOverallStatus = () => {
    const statuses = Object.values(panelStatuses);
    if (statuses.some(s => s === 'error')) return 'error';
    if (statuses.some(s => s === 'offline')) return 'offline';
    if (statuses.every(s => s === 'online')) return 'online';
    return 'unknown';
  };

  const getStatusIcon = () => {
    const status = getOverallStatus();
    switch (status) {
      case 'online': return <Wifi className="h-5 w-5 text-terminal-success" />;
      case 'offline': return <WifiOff className="h-5 w-5 text-terminal-error" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-terminal-warning" />;
      default: return <Activity className="h-5 w-5 text-terminal-text" />;
    }
  };

  const onlineCount = Object.values(panelStatuses).filter(s => s === 'online').length;
  const totalCount = panels.length;

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="terminal-glow p-1.5 sm:p-2 rounded border border-terminal-border">
              {getStatusIcon()}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-mono font-bold text-terminal-accent terminal-text-glow">
                NETWORK PING MONITOR
              </h1>
              <p className="text-terminal-text text-xs sm:text-sm">
                Real-time network connectivity monitoring system
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGlobalSoundEnabled(!globalSoundEnabled)}
                className={`border-terminal-border text-xs ${!globalSoundEnabled ? 'text-terminal-success' : 'text-terminal-error'} hover:text-terminal-accent`}
                title={!globalSoundEnabled ? 'Mute all sound alerts' : 'Enable all sound alerts'}
              >
                {!globalSoundEnabled ? <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> : <VolumeX className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                <span className="hidden sm:inline">{!globalSoundEnabled ? 'Sound ON' : 'Sound OFF'}</span>
                <span className="sm:hidden">{!globalSoundEnabled ? 'ON' : 'OFF'}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={captureFullScreen}
                className="border-terminal-border text-terminal-text hover:text-terminal-accent text-xs"
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Full Screenshot</span>
                <span className="sm:hidden">Screenshot</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-terminal-border text-xs">
                <span className="text-terminal-success">{onlineCount}</span>
                <span className="text-terminal-text mx-1">/</span>
                <span className="text-terminal-text">{totalCount}</span>
              </Badge>
              <Badge 
                variant="outline" 
                className={`border-terminal-border text-xs ${
                  getOverallStatus() === 'online' ? 'text-terminal-success' :
                  getOverallStatus() === 'offline' ? 'text-terminal-error' : 'text-terminal-warning'
                }`}
              >
                <span className="hidden sm:inline">SYSTEM </span>{getOverallStatus().toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
        {panels.map(panel => (
              <PingPanel
                key={panel.id}
                id={panel.id}
                initialTarget={panel.target}
                initialTitle={panel.title}
                onRemove={removePanel}
                onStatusChange={handleStatusChange}
                globalSoundEnabled={globalSoundEnabled}
                globalNotificationsEnabled={globalSoundEnabled}
              />
        ))}
        <AddPanelButton onAddPanel={addPanel} />
      </div>

      {/* Footer */}
      <div className="mt-6 sm:mt-8 text-center text-terminal-text opacity-60 text-xs sm:text-sm font-mono px-2">
        <p className="break-words">NETWORK MONITORING SYSTEM BY MR0D12 v1.0 | Real-time ping diagnostics</p>
        <p className="cursor hidden sm:block">Press CTRL+C to terminate_</p>
      </div>
    </div>
  );
};

export default Index;