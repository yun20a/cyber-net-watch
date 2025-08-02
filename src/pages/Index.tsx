import React, { useState, useCallback } from 'react';
import { PingPanel } from '@/components/PingPanel';
import { AddPanelButton } from '@/components/AddPanelButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Wifi, WifiOff, AlertTriangle, Camera } from 'lucide-react';
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
            toast({
              title: "Connection Lost",
              description: `${panel.title} (${panel.target}) is ${status}`,
              variant: "destructive",
            });
          }
        }
      }
      return { ...prev, [id]: status };
    });
  }, [panels, toast]);

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
    <div className="min-h-screen bg-background p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="terminal-glow p-2 rounded border border-terminal-border">
              {getStatusIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-mono font-bold text-terminal-accent terminal-text-glow">
                NETWORK PING MONITOR
              </h1>
              <p className="text-terminal-text text-sm">
                Real-time network connectivity monitoring system
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={captureFullScreen}
              className="border-terminal-border text-terminal-text hover:text-terminal-accent"
            >
              <Camera className="h-4 w-4 mr-1" />
              Full Screenshot
            </Button>
            <Badge variant="outline" className="border-terminal-border">
              <span className="text-terminal-success">{onlineCount}</span>
              <span className="text-terminal-text mx-1">/</span>
              <span className="text-terminal-text">{totalCount}</span>
            </Badge>
            <Badge 
              variant="outline" 
              className={`border-terminal-border ${
                getOverallStatus() === 'online' ? 'text-terminal-success' :
                getOverallStatus() === 'offline' ? 'text-terminal-error' : 'text-terminal-warning'
              }`}
            >
              SYSTEM {getOverallStatus().toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {panels.map(panel => (
          <PingPanel
            key={panel.id}
            id={panel.id}
            initialTarget={panel.target}
            initialTitle={panel.title}
            onRemove={removePanel}
            onStatusChange={handleStatusChange}
          />
        ))}
        <AddPanelButton onAddPanel={addPanel} />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-terminal-text opacity-60 text-xs font-mono">
        <p>NETWORK MONITORING SYSTEM BY MR0D12 v1.0 | Real-time ping diagnostics</p>
        <p className="cursor">Press CTRL+C to terminate_</p>
      </div>
    </div>
  );
};

export default Index;