import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface AddPanelButtonProps {
  onAddPanel: (target: string, title: string) => void;
}

export const AddPanelButton: React.FC<AddPanelButtonProps> = ({ onAddPanel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (target && title) {
      onAddPanel(target, title);
      setTarget('');
      setTitle('');
      setIsOpen(false);
    }
  };

  const presets = [
    { target: '1.1.1.1', title: 'Cloudflare DNS' },
    { target: '8.8.4.4', title: 'Google DNS Alt' },
    { target: 'github.com', title: 'GitHub' },
    { target: 'google.com', title: 'Google' },
    { target: '192.168.1.1', title: 'Local Router' },
    { target: '127.0.0.1', title: 'Localhost' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="h-96 w-80 border-2 border-dashed border-terminal-border hover:border-terminal-accent text-terminal-text hover:text-terminal-accent transition-colors"
        >
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-8 w-8" />
            <span className="text-lg font-mono">Add Ping Panel</span>
            <span className="text-xs opacity-60">Monitor new target</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-terminal-border">
        <DialogHeader>
          <DialogTitle className="text-terminal-text font-mono">Add New Ping Panel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-terminal-text">Panel Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Home Router, VPS Server"
              className="bg-input border-terminal-border text-terminal-text"
              required
            />
          </div>
          <div>
            <Label htmlFor="target" className="text-terminal-text">Target (IP or Domain)</Label>
            <Input
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g., 192.168.1.1, google.com"
              className="bg-input border-terminal-border text-terminal-text"
              required
            />
          </div>
          
          {/* Quick presets */}
          <div>
            <Label className="text-terminal-text">Quick Presets:</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {presets.map((preset, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTarget(preset.target);
                    setTitle(preset.title);
                  }}
                  className="text-xs justify-start border-terminal-border hover:border-terminal-accent text-terminal-text"
                >
                  {preset.title}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="border-terminal-border text-terminal-text hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90"
            >
              Add Panel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};