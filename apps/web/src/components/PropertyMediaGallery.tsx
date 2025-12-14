'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';

interface PropertyImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  roomType?: string;
}

interface PropertyMediaGalleryProps {
  images: PropertyImage[];
  onClose?: () => void;
}

export function PropertyMediaGallery({ images, onClose }: PropertyMediaGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
    setZoom(1);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 1));
  };

  return (
    <>
      {/* Main Gallery View */}
      <div className="space-y-4">
        {/* Primary Image */}
        <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden aspect-video cursor-pointer group">
          <Image
            src={currentImage.url}
            alt={currentImage.caption || `Property image ${currentIndex + 1}`}
            fill
            className="object-contain group-hover:opacity-90 transition-opacity"
            onClick={openLightbox}
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
            <button
              onClick={openLightbox}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3 hover:bg-gray-100"
            >
              <ZoomIn className="w-6 h-6 text-gray-900" />
            </button>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-gray-900" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors shadow-lg"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-gray-900" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Room Type Badge */}
          {currentImage.roomType && (
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {currentImage.roomType}
            </div>
          )}
        </div>

        {/* Image Caption */}
        {currentImage.caption && (
          <p className="text-gray-700 text-sm">{currentImage.caption}</p>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-shrink-0 relative rounded-lg overflow-hidden transition-all ${
                  idx === currentIndex ? 'ring-2 ring-blue-600 scale-100' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ width: '80px', height: '80px' }}
              >
                <Image
                  src={img.thumbnailUrl || img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6 text-gray-900" />
            </button>

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 flex gap-2 z-10">
              <button
                onClick={handleZoomOut}
                disabled={zoom === 1}
                className="bg-white rounded-full p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-5 h-5 text-gray-900" />
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoom === 3}
                className="bg-white rounded-full p-2 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-5 h-5 text-gray-900" />
              </button>
            </div>

            {/* Image Container */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <div
                className="relative transition-transform duration-300"
                style={{ transform: `scale(${zoom})` }}
              >
                <Image
                  src={currentImage.url}
                  alt={currentImage.caption || `Property image ${currentIndex + 1}`}
                  width={1200}
                  height={800}
                  className="object-contain max-h-[90vh] w-auto"
                />
              </div>
            </div>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 hover:bg-gray-100 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-900" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 hover:bg-gray-100 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-gray-900" />
                </button>
              </>
            )}

            {/* Counter and Caption */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-10">
              <p className="text-white text-sm mb-2">
                {currentIndex + 1} / {images.length}
              </p>
              {currentImage.caption && (
                <p className="text-gray-300 text-sm max-w-md">{currentImage.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
