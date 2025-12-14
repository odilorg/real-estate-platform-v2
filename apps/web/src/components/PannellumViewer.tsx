'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PannellumViewerProps {
  imageUrl: string;
  autoLoad?: boolean;
  autoRotate?: number;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

declare global {
  interface Window {
    pannellum: {
      viewer: (
        container: HTMLElement,
        config: {
          type: string;
          panorama: string;
          autoLoad?: boolean;
          autoRotate?: number;
          compass?: boolean;
          showZoomCtrl?: boolean;
          showFullscreenCtrl?: boolean;
          mouseZoom?: boolean;
          draggable?: boolean;
          hfov?: number;
          minHfov?: number;
          maxHfov?: number;
          pitch?: number;
          yaw?: number;
          keyboardZoom?: boolean;
          friction?: number;
          touchPanSpeedCoeffFactor?: number;
          orientationOnByDefault?: boolean;
        }
      ) => {
        destroy: () => void;
        getYaw: () => number;
        getPitch: () => number;
        setYaw: (yaw: number) => void;
        setPitch: (pitch: number) => void;
        startAutoRotate: (speed?: number) => void;
        stopAutoRotate: () => void;
        lookAt: (pitch: number, yaw: number, hfov?: number) => void;
        on: (event: string, callback: () => void) => void;
      };
    };
  }
}

export default function PannellumViewer({
  imageUrl,
  autoLoad = true,
  autoRotate = 0,
  onLoad,
  onError,
}: PannellumViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const pannellumInstance = useRef<ReturnType<typeof window.pannellum.viewer> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Load Pannellum CSS
    if (!document.getElementById('pannellum-css')) {
      const link = document.createElement('link');
      link.id = 'pannellum-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';
      document.head.appendChild(link);
    }

    // Load Pannellum JS
    const loadPannellum = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.pannellum) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pannellum'));
        document.body.appendChild(script);
      });
    };

    let isMounted = true;

    const initViewer = async () => {
      try {
        await loadPannellum();

        if (!isMounted || !viewerRef.current) return;

        // Destroy existing instance
        if (pannellumInstance.current) {
          pannellumInstance.current.destroy();
          pannellumInstance.current = null;
        }

        // Create new viewer
        pannellumInstance.current = window.pannellum.viewer(viewerRef.current, {
          type: 'equirectangular',
          panorama: imageUrl,
          autoLoad,
          autoRotate: autoRotate !== 0 ? autoRotate : undefined,
          compass: false,
          showZoomCtrl: false,
          showFullscreenCtrl: false,
          mouseZoom: true,
          draggable: true,
          hfov: 100,
          minHfov: 50,
          maxHfov: 120,
          pitch: 0,
          yaw: 0,
          keyboardZoom: true,
          friction: 0.15,
          touchPanSpeedCoeffFactor: 2,
        });

        pannellumInstance.current.on('load', () => {
          if (isMounted) {
            setIsLoading(false);
            setHasError(false);
            onLoad?.();
          }
        });

        pannellumInstance.current.on('error', () => {
          if (isMounted) {
            setIsLoading(false);
            setHasError(true);
            onError?.('Failed to load panorama');
          }
        });
      } catch (error) {
        if (isMounted) {
          setIsLoading(false);
          setHasError(true);
          onError?.('Failed to initialize viewer');
        }
      }
    };

    initViewer();

    return () => {
      isMounted = false;
      if (pannellumInstance.current) {
        pannellumInstance.current.destroy();
        pannellumInstance.current = null;
      }
    };
  }, [imageUrl, autoLoad, autoRotate, onLoad, onError]);

  // Handle autoRotate changes
  useEffect(() => {
    if (pannellumInstance.current) {
      if (autoRotate !== 0) {
        pannellumInstance.current.startAutoRotate(autoRotate);
      } else {
        pannellumInstance.current.stopAutoRotate();
      }
    }
  }, [autoRotate]);

  return (
    <div className="relative w-full h-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-sm">Loading panorama...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center text-white">
            <p className="text-red-400 mb-2">Failed to load panorama</p>
            <p className="text-sm text-gray-400">The image might not be a valid 360° panorama</p>
          </div>
        </div>
      )}

      {/* Pannellum container */}
      <div
        ref={viewerRef}
        className="w-full h-full"
        style={{ minHeight: '300px' }}
      />
    </div>
  );
}
