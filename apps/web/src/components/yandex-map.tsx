'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface YandexMapMarker {
  id: string;
  title: string;
  price: number;
  listingType: 'SALE' | 'RENT_LONG' | 'RENT_DAILY';
  latitude: number;
  longitude: number;
  imageUrl?: string;
}

interface YandexMapProps {
  properties: YandexMapMarker[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (propertyId: string) => void;
  selectedPropertyId?: string;
  className?: string;
}

declare global {
  interface Window {
    ymaps: any;
  }
}

function formatPrice(price: number, listingType: string): string {
  const formatted = new Intl.NumberFormat('ru-RU').format(price);
  if (listingType === 'SALE') {
    return `${formatted} ₽`;
  } else if (listingType === 'RENT_DAILY') {
    return `${formatted} ₽/сутки`;
  } else {
    return `${formatted} ₽/мес`;
  }
}

export default function YandexMap({
  properties,
  center = [41.2995, 69.2401], // Tashkent coordinates
  zoom = 12,
  onMarkerClick,
  selectedPropertyId,
  className = '',
}: YandexMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!isScriptLoaded || !mapRef.current || !window.ymaps) return;

    const initMap = () => {
      try {
        // Destroy previous map instance if exists
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }

        // Create new map instance
        const map = new window.ymaps.Map(mapRef.current, {
          center,
          zoom,
          controls: ['zoomControl', 'geolocationControl', 'fullscreenControl']
        });

        // Store map instance
        mapInstanceRef.current = map;

        // Create clusterer for better performance with many markers
        const clusterer = new window.ymaps.Clusterer({
          groupByCoordinates: false,
          clusterDisableClickZoom: false,
          clusterHideIconOnBalloonOpen: false,
          geoObjectHideIconOnBalloonOpen: false,
          clusterIconLayout: 'default#imageWithContent',
          clusterIconContentLayout: window.ymaps.templateLayoutFactory.createClass(
            `<div style="
              min-width: 46px;
              height: 46px;
              background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
              border-radius: 23px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 700;
              font-size: 15px;
              box-shadow: 0 3px 12px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
              border: 2px solid white;
              font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
              padding: 0 14px;
              letter-spacing: -0.02em;
              cursor: pointer;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              text-shadow: 0 1px 3px rgba(0,0,0,0.2);
            "
            onmouseover="this.style.transform='scale(1.08)'; this.style.background='linear-gradient(135deg, #1e40af 0%, #2563eb 100%)'; this.style.boxShadow='0 4px 16px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)';"
            onmouseout="this.style.transform='scale(1)'; this.style.background='linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'; this.style.boxShadow='0 3px 12px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';">
              {{ properties.geoObjects.length }}
            </div>`
          ),
          clusterIconContentOffset: [-23, -23]
        });

        // Add markers for each property
        const placemarks: any[] = [];

        properties.forEach((property) => {
          // Create custom placemark with price as content
          const placemark = new window.ymaps.Placemark(
            [property.latitude, property.longitude],
            {
              hintContent: property.title,
              balloonContentHeader: `
                <div style="font-weight: bold; margin-bottom: 5px;">
                  ${formatPrice(property.price, property.listingType)}
                </div>
              `,
              balloonContentBody: `
                <div style="max-width: 250px;">
                  ${property.imageUrl ? `
                    <img src="${property.imageUrl}"
                         alt="${property.title}"
                         style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 8px;"
                    />
                  ` : ''}
                  <div style="font-size: 14px; color: #333;">
                    ${property.title}
                  </div>
                </div>
              `,
              balloonContentFooter: onMarkerClick ? `
                <button
                  onclick="window.dispatchEvent(new CustomEvent('yandexMapMarkerClick', { detail: '${property.id}' }))"
                  style="
                    margin-top: 8px;
                    padding: 6px 12px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                  "
                >
                  Подробнее
                </button>
              ` : ''
            },
            {
              iconLayout: 'default#imageWithContent',
              iconImageHref: '',
              iconImageSize: [1, 1],
              iconImageOffset: [0, 0],
              iconContentOffset: [-35, -42], // Adjust for new design with pointer
              iconContentLayout: window.ymaps.templateLayoutFactory.createClass(
                `<div style="
                  position: relative;
                  cursor: pointer;
                  transform: ${property.id === selectedPropertyId ? 'scale(1.1) translateY(-3px)' : 'scale(1)'};
                  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                  filter: drop-shadow(0 4px 10px rgba(37, 99, 235, 0.25));
                ">
                  <!-- Modern branded marker with clear visibility -->
                  <div style="
                    position: relative;
                    display: inline-block;
                  ">
                    <!-- Main pill body with brand colors -->
                    <div style="
                      background: ${property.id === selectedPropertyId ?
                        'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)' :
                        'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'};
                      color: white;
                      padding: 7px 13px;
                      border-radius: 18px;
                      font-size: 13px;
                      font-weight: 700;
                      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
                      box-shadow: 0 2px 10px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255,255,255,0.2);
                      border: 2px solid white;
                      white-space: nowrap;
                      display: inline-flex;
                      align-items: center;
                      position: relative;
                      letter-spacing: -0.02em;
                      min-width: 55px;
                      justify-content: center;
                    ">
                      <!-- Price with smart formatting -->
                      <span style="text-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                        ${(() => {
                          const priceStr = formatPrice(property.price, property.listingType);
                          // Convert to shorter format
                          if (property.price >= 1000000) {
                            const millions = (property.price / 1000000).toFixed(1).replace('.0', '');
                            return property.listingType === 'RENT_LONG'
                              ? millions + 'М'
                              : '$' + millions + 'M';
                          } else if (property.price >= 1000) {
                            const thousands = Math.round(property.price / 1000);
                            return property.listingType === 'RENT_LONG'
                              ? thousands + 'к'
                              : '$' + thousands + 'K';
                          }
                          return priceStr.replace(' ₽', '').replace('/мес', '');
                        })()}
                      </span>
                    </div>

                    <!-- Modern pin pointer -->
                    <div style="
                      position: absolute;
                      bottom: -8px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 0;
                      height: 0;
                      border-left: 6px solid transparent;
                      border-right: 6px solid transparent;
                      border-top: 8px solid white;
                    "></div>
                    <div style="
                      position: absolute;
                      bottom: -6px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 0;
                      height: 0;
                      border-left: 4px solid transparent;
                      border-right: 4px solid transparent;
                      border-top: 6px solid ${property.id === selectedPropertyId ? '#2563eb' : '#60a5fa'};
                    "></div>

                    <!-- Location dot at the tip -->
                    <div style="
                      position: absolute;
                      bottom: -10px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 4px;
                      height: 4px;
                      background: white;
                      border-radius: 50%;
                      box-shadow: 0 0 0 2px ${property.id === selectedPropertyId ? '#1e40af' : '#3b82f6'};
                    "></div>
                  </div>
                </div>`
              )
            }
          );

          placemarks.push(placemark);
        });

        // Add all placemarks to clusterer
        clusterer.add(placemarks);
        map.geoObjects.add(clusterer);

        // Fit map to show all markers
        if (properties.length > 0) {
          map.setBounds(clusterer.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 40
          });
        }

        // Handle marker click events
        if (onMarkerClick) {
          const handleMarkerClick = (event: CustomEvent) => {
            onMarkerClick(event.detail);
          };
          window.addEventListener('yandexMapMarkerClick', handleMarkerClick as any);

          // Cleanup on unmount
          return () => {
            window.removeEventListener('yandexMapMarkerClick', handleMarkerClick as any);
          };
        }

        console.log('[YandexMap] Map initialized successfully with', properties.length, 'properties');
      } catch (error) {
        console.error('[YandexMap] Error initializing map:', error);
        setMapError('Failed to initialize Yandex Maps');
      }
    };

    // Initialize map when Yandex Maps API is ready
    window.ymaps.ready(initMap);

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        } catch (error) {
          console.error('[YandexMap] Error destroying map:', error);
        }
      }
    };
  }, [isScriptLoaded, properties, center, zoom, onMarkerClick, selectedPropertyId]);

  return (
    <>
      <Script
        src="https://api-maps.yandex.ru/2.1/?apikey=c225f9dd-d250-475a-9053-2e02e1ccf546&lang=ru_RU"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('[YandexMap] Yandex Maps script loaded');
          setIsScriptLoaded(true);
        }}
        onError={(e) => {
          console.error('[YandexMap] Failed to load Yandex Maps script:', e);
          setMapError('Failed to load Yandex Maps');
        }}
      />

      <div className={`relative ${className}`}>
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-red-500 text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{mapError}</p>
            </div>
          </div>
        )}

        {!isScriptLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-gray-500 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p>Загрузка карты...</p>
            </div>
          </div>
        )}

        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: '400px' }}
        />
      </div>
    </>
  );
}