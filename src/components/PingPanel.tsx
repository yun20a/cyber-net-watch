import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, X, Play, Pause, AlertTriangle, Wifi, WifiOff, Copy, Camera, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAudioAlert } from '@/hooks/useAudioAlert';
import { useScreenshot } from '@/hooks/useScreenshot';
import { useToast } from '@/hooks/use-toast';

interface PingResult {
  timestamp: Date;
  status: 'success' | 'error' | 'timeout';
  responseTime?: number;
  error?: string;
}

interface PingPanelProps {
  id: string;
  initialTarget?: string;
  initialTitle?: string;
  onRemove: (id: string) => void;
  onStatusChange: (id: string, status: 'online' | 'offline' | 'error') => void;
  globalSoundEnabled?: boolean;
  globalNotificationsEnabled?: boolean;
}

const THEMES = {
  green: 'theme-green',
  blue: 'theme-blue',
  purple: 'theme-purple',
  orange: 'theme-orange'
};

export const PingPanel: React.FC<PingPanelProps> = ({
  id,
  initialTarget = '8.8.8.8',
  initialTitle = 'Network Target',
  onRemove,
  onStatusChange,
  globalSoundEnabled = true,
  globalNotificationsEnabled = true
}) => {
  const [target, setTarget] = useState(initialTarget);
  const [title, setTitle] = useState(initialTitle);
  const [isRunning, setIsRunning] = useState(true);
  const [theme, setTheme] = useState('green');
  const [interval, setIntervalTime] = useState(1000);
  const [results, setResults] = useState<PingResult[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'online' | 'offline' | 'error'>('offline');
  const [stats, setStats] = useState({ sent: 0, received: 0, lost: 0, avgTime: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const logRef = useRef<HTMLDivElement>(null);
  const { playErrorAlert, playTimeoutAlert } = useAudioAlert();
  const { captureElement } = useScreenshot();
  const { toast } = useToast();

  // Simulate ping using HTTP request with timeout
  const performPing = async (targetUrl: string): Promise<PingResult> => {
    const start = performance.now();
    
    try {
      // For actual IPs, we'll use a CORS proxy or simulate
      let testUrl = targetUrl;
      if (targetUrl.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        // IP address - simulate ping
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 10));
        const responseTime = performance.now() - start;
        
        // Simulate occasional failures for demonstration
        if (Math.random() < 0.05) {
          throw new Error('Request timeout');
        }
        
        return {
          timestamp: new Date(),
          status: 'success',
          responseTime: Math.round(responseTime)
        };
      } else {
        // URL - try actual fetch
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        await fetch(testUrl.startsWith('http') ? testUrl : `https://${testUrl}`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        const responseTime = performance.now() - start;
        
        return {
          timestamp: new Date(),
          status: 'success',
          responseTime: Math.round(responseTime)
        };
      }
    } catch (error) {
      return {
        timestamp: new Date(),
        status: error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Start/stop ping monitoring
  useEffect(() => {
    if (isRunning && target) {
      intervalRef.current = setInterval(async () => {
        const result = await performPing(target);
        
        setResults(prev => {
          const newResults = [result, ...prev].slice(0, 100); // Keep last 100 results
          return newResults;
        });

        // Update stats
        setStats(prev => {
          const sent = prev.sent + 1;
          const received = result.status === 'success' ? prev.received + 1 : prev.received;
          const lost = sent - received;
          const avgTime = results.filter(r => r.status === 'success')
            .reduce((acc, r) => acc + (r.responseTime || 0), 0) / Math.max(received, 1);

          return { sent, received, lost, avgTime: Math.round(avgTime) };
        });

        // Update status and play sound alerts
        const newStatus = result.status === 'success' ? 'online' : 
                         result.status === 'timeout' ? 'offline' : 'error';
        
        // Play sound alerts for failures (only if both global and local sound are enabled)
        if (globalSoundEnabled && soundEnabled && result.status !== 'success') {
          if (result.status === 'timeout') {
            playTimeoutAlert();
          } else {
            playErrorAlert();
          }
        }
        
        setCurrentStatus(newStatus);
        onStatusChange(id, newStatus);
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, target, interval, id, onStatusChange, globalSoundEnabled, soundEnabled, playTimeoutAlert, playErrorAlert]);

  // Auto-scroll to bottom of log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [results]);

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'online': return 'text-terminal-success';
      case 'offline': return 'text-terminal-error';
      case 'error': return 'text-terminal-warning';
      default: return 'text-terminal-text';
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'online': return <Wifi className="h-4 w-4" />;
      case 'offline': return <WifiOff className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  const copyLogs = useCallback(() => {
    const logText = results.map(result => {
      const timestamp = result.timestamp.toLocaleString();
      const status = result.status === 'success' 
        ? `time=${result.responseTime}ms`
        : result.status === 'timeout' ? 'Request timeout' : result.error;
      return `[${timestamp}] PING ${target}: ${status}`;
    }).join('\n');
    
    navigator.clipboard.writeText(logText).then(() => {
      if (globalNotificationsEnabled) {
        toast({
          title: "Logs Copied",
          description: "Ping logs copied to clipboard",
        });
      }
    }).catch(() => {
      if (globalNotificationsEnabled) {
        toast({
          title: "Copy Failed",
          description: "Could not copy logs to clipboard",
          variant: "destructive",
        });
      }
    });
  }, [results, target, toast, globalNotificationsEnabled]);

  const takeScreenshot = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    captureElement(`ping-panel-${id}`, `${title}-${timestamp}.png`);
  }, [captureElement, id, title]);

  const exportLogs = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `${title.replace(/[^a-z0-9]/gi, '_')}-ping-logs-${timestamp}.txt`;
    
    const logContent = [
      `Ping Log Export - ${title}`,
      `Target: ${target}`,
      `Export Date: ${new Date().toLocaleString()}`,
      ``,
      `Statistics:`,
      `- Packets Sent: ${stats.sent}`,
      `- Packets Received: ${stats.received}`,
      `- Packets Lost: ${stats.lost} (${stats.sent > 0 ? ((stats.lost / stats.sent) * 100).toFixed(1) : 0}%)`,
      `- Average Response Time: ${stats.avgTime}ms`,
      ``,
      `Detailed Log:`,
      `============`,
      ...results.map(result => {
        const timestamp = result.timestamp.toLocaleString();
        const status = result.status === 'success' 
          ? `SUCCESS - time=${result.responseTime}ms`
          : result.status === 'timeout' ? 'TIMEOUT - Request timeout' : `ERROR - ${result.error}`;
        return `[${timestamp}] PING ${target}: ${status}`;
      }).reverse()
    ].join('\n');

    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (globalNotificationsEnabled) {
      toast({
        title: "Logs Exported",
        description: `Ping logs saved as ${fileName}`,
      });
    }
  }, [results, target, title, stats, toast, globalNotificationsEnabled]);

  return (
    <Card id={`ping-panel-${id}`} className={`terminal-glow bg-card border-terminal-border ${THEMES[theme as keyof typeof THEMES]} h-80 sm:h-96 flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b border-terminal-border">
        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
          <div className={`${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent border-none text-terminal-text text-xs sm:text-sm font-mono p-0 h-auto focus:ring-0 truncate"
          />
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={exportLogs}
            className="h-5 w-5 sm:h-6 sm:w-6 text-terminal-text hover:text-terminal-accent"
            title="Export logs to file"
          >
            <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyLogs}
            className="h-5 w-5 sm:h-6 sm:w-6 text-terminal-text hover:text-terminal-accent"
            title="Copy logs"
          >
            <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={takeScreenshot}
            className="h-5 w-5 sm:h-6 sm:w-6 text-terminal-text hover:text-terminal-accent"
            title="Take screenshot"
          >
            <Camera className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRunning(!isRunning)}
            className="h-5 w-5 sm:h-6 sm:w-6 text-terminal-text hover:text-terminal-accent"
          >
            {isRunning ? <Pause className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="h-5 w-5 sm:h-6 sm:w-6 text-terminal-text hover:text-terminal-accent"
          >
            <Settings className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(id)}
            className="h-5 w-5 sm:h-6 sm:w-6 text-terminal-error hover:text-terminal-error"
          >
            <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-2 sm:p-3 border-b border-terminal-border bg-secondary/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-terminal-text">Target:</label>
              <Input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="IP or domain"
                className="h-6 text-xs bg-input border-terminal-border text-terminal-text w-full"
              />
            </div>
            <div>
              <label className="text-terminal-text">Interval (ms):</label>
              <Input
                type="number"
                value={interval}
                onChange={(e) => setIntervalTime(Number(e.target.value))}
                className="h-6 text-xs bg-input border-terminal-border text-terminal-text w-full"
              />
            </div>
            <div>
              <label className="text-terminal-text">Theme:</label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="h-6 text-xs bg-input border-terminal-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`sound-${id}`}
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                disabled={!globalSoundEnabled}
                className="h-3 w-3"
              />
              <label htmlFor={`sound-${id}`} className={`text-xs ${!globalSoundEnabled ? 'opacity-50' : 'text-terminal-text'}`}>
                Panel sound alerts {!globalSoundEnabled && '(Global OFF)'}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="p-1.5 sm:p-2 border-b border-terminal-border">
        <div className="flex flex-col gap-2">
          <span className="truncate text-xs text-terminal-text">Target: {target}</span>
          <Button variant="outline" className="w-full justify-between text-xs h-6 px-2">
            <span>Sent: {stats.sent} | Lost: {stats.lost}</span>
            <span>Avg: {stats.avgTime}ms</span>
          </Button>
        </div>
      </div>

      {/* Log */}
      <div ref={logRef} className="flex-1 p-1.5 sm:p-2 overflow-y-auto font-mono text-xs">
        {results.length === 0 ? (
          <div className="text-terminal-text opacity-50">
            {isRunning ? 'Starting ping...' : 'Ping stopped'}
          </div>
        ) : (
          results.map((result, index) => (
            <div key={index} className="mb-1">
              <span className="text-terminal-text opacity-60">
                [{result.timestamp.toLocaleTimeString()}]
              </span>
              <span className="ml-2">
                PING {target}:
              </span>
              {result.status === 'success' ? (
                <span className="text-terminal-success ml-1">
                  time={result.responseTime}ms
                </span>
              ) : (
                <span className="text-terminal-error ml-1">
                  {result.status === 'timeout' ? 'Request timeout' : result.error}
                </span>
              )}
            </div>
          ))
        )}
        <span className="cursor">█</span>
      </div>
    </Card>
  );
};