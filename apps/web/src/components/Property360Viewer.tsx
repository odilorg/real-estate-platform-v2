'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Maximize2, Minimize2, RotateCw, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

// Dynamic import - SSR disabled for Pannellum
const PannellumViewer = dynamic(() => import('./PannellumViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-white" />
    </div>
  ),
});

interface Property360Tour {
  id: string;
  url: string;
  roomName?: string;
  description?: string;
}

interface Property360ViewerProps {
  tours: Property360Tour[];
}

export function Property360Viewer({ tours }: Property360ViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // All hooks must be called before any early returns
  const toursLength = tours?.length || 0;

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? toursLength - 1 : prev - 1));
    setIsLoading(true);
  }, [toursLength]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev === toursLength - 1 ? 0 : prev + 1));
    setIsLoading(true);
  }, [toursLength]);

  const toggleAutoRotate = useCallback(() => {
    setAutoRotate(prev => (prev === 0 ? -2 : 0));
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const selectTour = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setIsLoading(true);
  }, []);

  // Handle escape key for fullscreen
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Early return for empty tours - AFTER all hooks
  if (!tours || tours.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-100 rounded-lg">
        <div className="text-gray-400 mb-3">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500">No 360° tours available</p>
      </div>
    );
  }

  const currentTour = tours[currentIndex];

  return (
    <div className="space-y-4" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Main Viewer */}
      <div
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${
          isFullscreen
            ? 'fixed inset-0 z-50 rounded-none'
            : 'aspect-video'
        }`}
      >
        {/* Pannellum Viewer */}
        <PannellumViewer
          key={currentTour.id}
          imageUrl={currentTour.url}
          autoRotate={autoRotate}
          onLoad={handleLoad}
        />

        {/* Overlay Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none z-20">
          {/* Room Info */}
          <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-3 rounded-lg pointer-events-auto max-w-xs">
            {currentTour.roomName && (
              <p className="font-semibold text-sm">{currentTour.roomName}</p>
            )}
            {currentTour.description && (
              <p className="text-xs text-gray-300 mt-1 line-clamp-2">{currentTour.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Drag to look around
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={toggleAutoRotate}
              className={`p-2.5 rounded-full shadow-lg transition-all ${
                autoRotate !== 0
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white'
              }`}
              title={autoRotate !== 0 ? 'Stop auto-rotate' : 'Auto-rotate'}
              aria-label="Toggle auto-rotate"
            >
              <RotateCw className={`w-5 h-5 ${autoRotate !== 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg hover:bg-white transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-gray-900" />
              ) : (
                <Maximize2 className="w-5 h-5 text-gray-900" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        {tours.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-colors z-20"
              aria-label="Previous panorama"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-colors z-20"
              aria-label="Next panorama"
            >
              <ChevronRight className="w-6 h-6 text-gray-900" />
            </button>
          </>
        )}

        {/* Tour Counter */}
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium z-20">
          {currentIndex + 1} / {tours.length}
        </div>

        {/* Zoom Hint */}
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs z-20">
          Scroll to zoom
        </div>

        {/* Close Fullscreen Button */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full shadow-lg transition-colors z-30"
            aria-label="Exit fullscreen"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Loading indicator during tour switch */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-center text-white">
              <Loader2 className="w-10 h-10 animate-spin mx-auto" />
            </div>
          </div>
        )}
      </div>

      {/* Room Thumbnails */}
      {tours.length > 1 && !isFullscreen && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {tours.map((tour, idx) => (
            <button
              key={tour.id}
              onClick={() => selectTour(idx)}
              className={`relative rounded-lg overflow-hidden aspect-video transition-all duration-200 ${
                idx === currentIndex
                  ? 'ring-2 ring-blue-600 ring-offset-2 scale-105 shadow-lg'
                  : 'opacity-70 hover:opacity-100 hover:scale-102'
              }`}
              title={tour.roomName || `Room ${idx + 1}`}
            >
              <Image
                src={tour.url}
                alt={tour.roomName || `Panorama ${idx + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              {tour.roomName && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                  <p className="text-white text-xs font-medium truncate w-full">{tour.roomName}</p>
                </div>
              )}
              {idx === currentIndex && (
                <div className="absolute top-1 right-1 bg-blue-600 rounded-full p-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Help Text */}
      {!isFullscreen && (
        <div className="text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <p className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to explore the 360° tour
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-blue-800">
            <li className="flex items-center gap-2">
              <span className="text-blue-500">&#8226;</span>
              Drag to look around in any direction
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">&#8226;</span>
              Scroll or pinch to zoom in/out
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">&#8226;</span>
              Click fullscreen for immersive view
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">&#8226;</span>
              Use arrows or thumbnails to switch rooms
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
