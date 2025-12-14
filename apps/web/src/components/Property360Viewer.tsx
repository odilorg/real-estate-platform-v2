'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

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
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  if (!tours || tours.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No 360° tours available</p>
      </div>
    );
  }

  const currentTour = tours[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? tours.length - 1 : prev - 1));
    setRotation(0);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev === tours.length - 1 ? 0 : prev + 1));
    setRotation(0);
  };

  const resetRotation = () => {
    setRotation(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    setRotation(prev => (prev + diff * 0.5) % 360);
    setStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    setRotation(prev => (prev + diff * 0.5) % 360);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      {/* 360 Panorama Viewer */}
      <div
        className={`relative w-full bg-gray-900 rounded-lg overflow-hidden aspect-video ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Panoramic Image Container */}
        <div className="relative w-full h-full overflow-hidden">
          <div
            className="relative h-full transition-transform duration-100"
            style={{
              width: '200%',
              transform: `translateX(${-rotation * (800 / 360)}px)`,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            <Image
              src={currentTour.url}
              alt={currentTour.roomName || '360° panoramic view'}
              fill
              className="object-cover"
              draggable={false}
            />
          </div>
        </div>

        {/* Info Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <div className="bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg max-w-xs">
            {currentTour.roomName && <p className="font-semibold text-sm">{currentTour.roomName}</p>}
            {currentTour.description && <p className="text-xs text-gray-300 mt-1">{currentTour.description}</p>}
            <p className="text-xs text-gray-400 mt-2">Drag to rotate • {Math.round(rotation)}°</p>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetRotation}
            className="bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg"
            title="Reset rotation"
            aria-label="Reset 360° rotation"
          >
            <RotateCw className="w-5 h-5 text-gray-900" />
          </button>
        </div>

        {/* Navigation Arrows */}
        {tours.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg"
              aria-label="Previous panorama"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg"
              aria-label="Next panorama"
            >
              <ChevronRight className="w-6 h-6 text-gray-900" />
            </button>
          </>
        )}

        {/* Tour Counter */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {tours.length}
        </div>
      </div>

      {/* Tour Thumbnail Grid */}
      {tours.length > 1 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {tours.map((tour, idx) => (
            <button
              key={tour.id}
              onClick={() => {
                setCurrentIndex(idx);
                setRotation(0);
              }}
              className={`relative rounded-lg overflow-hidden aspect-video transition-all ${
                idx === currentIndex ? 'ring-2 ring-blue-600 scale-105' : 'opacity-70 hover:opacity-100'
              }`}
              title={tour.roomName}
            >
              <Image
                src={tour.url}
                alt={tour.roomName || `Panorama ${idx + 1}`}
                fill
                className="object-cover"
              />
              {tour.roomName && (
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex items-end p-1">
                  <p className="text-white text-xs font-medium truncate">{tour.roomName}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="font-medium text-blue-900 mb-1">💡 How to use:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-800">
          <li>Drag left/right to rotate the panorama</li>
          <li>Use arrow buttons to navigate between rooms</li>
          <li>Click reset button to return to original view</li>
        </ul>
      </div>
    </div>
  );
}
