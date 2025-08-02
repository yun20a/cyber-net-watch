import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

export const useScreenshot = () => {
  const { toast } = useToast();

  const downloadImage = useCallback((canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  const captureElement = useCallback(async (elementId: string, filename: string) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        toast({
          title: "Error",
          description: "Element not found for screenshot",
          variant: "destructive",
        });
        return;
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      downloadImage(canvas, filename);
      
      toast({
        title: "Screenshot Captured",
        description: `${filename} downloaded successfully`,
      });
    } catch (error) {
      console.error('Screenshot failed:', error);
      toast({
        title: "Screenshot Failed",
        description: "Could not capture screenshot",
        variant: "destructive",
      });
    }
  }, [downloadImage, toast]);

  const captureFullScreen = useCallback(async () => {
    try {
      const canvas = await html2canvas(document.body, {
        backgroundColor: '#000000',
        scale: 1.5,
        logging: false,
        useCORS: true,
        height: window.innerHeight,
        width: window.innerWidth,
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      downloadImage(canvas, `netwatch-full-${timestamp}.png`);
      
      toast({
        title: "Full Screen Captured",
        description: "Screenshot downloaded successfully",
      });
    } catch (error) {
      console.error('Full screen capture failed:', error);
      toast({
        title: "Screenshot Failed",
        description: "Could not capture full screen",
        variant: "destructive",
      });
    }
  }, [downloadImage, toast]);

  return { captureElement, captureFullScreen };
};