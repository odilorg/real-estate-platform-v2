"use client";

import { useEffect, useRef, useState } from "react";

interface YandexMapProps {
  center: [number, number];
  zoom?: number;
  width?: string;
  height?: string;
  className?: string;
  onLoad?: (map: any) => void;
}

let ymapsLoaded = false;

export function YandexMap({
  center,
  zoom = 12,
  width = "100%",
  height = "500px",
  className = "",
  onLoad,
}: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = "c225f9dd-d250-475a-9053-2e02e1ccf546";

    const loadYandexMaps = async () => {
      if (ymapsLoaded && (window as any).ymaps) {
        setIsLoaded(true);
        return;
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`;
        script.async = true;
        script.onload = () => {
          (window as any).ymaps.ready(() => {
            ymapsLoaded = true;
            setIsLoaded(true);
            resolve();
          });
        };
        script.onerror = () => {
          setError("Failed to load Yandex Maps");
          reject(new Error("Failed to load Yandex Maps"));
        };
        document.head.appendChild(script);
      });
    };

    loadYandexMaps().catch((err) => {
      console.error("Error loading Yandex Maps:", err);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const initMap = () => {
      const ymaps = (window as any).ymaps;
      if (!ymaps) return;

      try {
        const map = new ymaps.Map(mapRef.current, {
          center: center,
          zoom: zoom,
          controls: ["zoomControl", "fullscreenControl", "geolocationControl"],
        });

        mapInstanceRef.current = map;

        if (onLoad) {
          onLoad(map);
        }
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Failed to initialize map");
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoaded, center, zoom, onLoad]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height }}
      >
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}
        style={{ width, height }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Загрузка карты...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={className}
      style={{ width, height }}
    />
  );
}
