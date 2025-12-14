'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Upload, Trash2, Star, GripVertical, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface PropertyImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  roomType?: string;
  order: number;
  isPrimary: boolean;
}

interface PropertyVideo {
  id: string;
  url: string;
  title?: string;
  type: string;
  order: number;
}

interface Property360Tour {
  id: string;
  url: string;
  roomName?: string;
  order: number;
}

export default function PropertyMediaPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const locale = params.locale as string;
  const t = useTranslations('developer.media');

  const [images, setImages] = useState<PropertyImage[]>([]);
  const [videos, setVideos] = useState<PropertyVideo[]>([]);
  const [tours, setTours] = useState<Property360Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'tours'>('images');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Load media on mount
  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const [imagesRes, videosRes, toursRes] = await Promise.all([
        api.get<any>(`/properties/${propertyId}/media/images`),
        api.get<any>(`/properties/${propertyId}/media/videos`),
        api.get<any>(`/properties/${propertyId}/media/tours`),
      ]);

      setImages((imagesRes as any).items || []);
      setVideos(videosRes || []);
      setTours(toursRes || []);
    } catch (err) {
      console.error('Error loading media:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', '');
      formData.append('roomType', '');

      const response = await api.post<PropertyImage>(`/properties/${propertyId}/media/images/upload`, formData);

      setImages([...images, response]);
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', '');
      formData.append('type', 'UPLOADED');

      const response = await api.post<PropertyVideo>(`/properties/${propertyId}/media/videos/upload`, formData);

      setVideos([...videos, response]);
    } catch (err) {
      console.error('Error uploading video:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleTourUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomName', '');

      const response = await api.post<Property360Tour>(`/properties/${propertyId}/media/tours/upload`, formData);

      setTours([...tours, response]);
    } catch (err) {
      console.error('Error uploading tour:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await api.delete(`/properties/${propertyId}/media/images/${imageId}`);
      setImages(images.filter(img => img.id !== imageId));
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await api.delete(`/properties/${propertyId}/media/videos/${videoId}`);
      setVideos(videos.filter(vid => vid.id !== videoId));
    } catch (err) {
      console.error('Error deleting video:', err);
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    try {
      await api.delete(`/properties/${propertyId}/media/tours/${tourId}`);
      setTours(tours.filter(t => t.id !== tourId));
    } catch (err) {
      console.error('Error deleting tour:', err);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await api.patch(`/properties/${propertyId}/media/images/${imageId}/primary`);
      setImages(
        images.map(img => ({
          ...img,
          isPrimary: img.id === imageId,
        })),
      );
    } catch (err) {
      console.error('Error setting primary image:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/developer/properties/${propertyId}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Media</h1>
          <p className="text-sm text-gray-500 mt-1">Manage images, videos, and 360° tours</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        {['images', 'videos', 'tours'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'images' && 'Images'}
            {tab === 'videos' && 'Videos'}
            {tab === 'tours' && '360° Tours'}
          </button>
        ))}
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Upload {activeTab}</h2>
        </div>

        <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
          <input
            type="file"
            className="hidden"
            accept={
              activeTab === 'images'
                ? 'image/jpeg,image/png,image/webp'
                : activeTab === 'videos'
                  ? 'video/mp4,video/quicktime'
                  : 'image/jpeg,image/png,image/webp'
            }
            onChange={
              activeTab === 'images'
                ? handleImageUpload
                : activeTab === 'videos'
                  ? handleVideoUpload
                  : handleTourUpload
            }
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>Uploading...</span>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-medium text-gray-900">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'images' && 'PNG, JPG, WebP up to 10MB'}
                {activeTab === 'videos' && 'MP4, MOV up to 500MB'}
                {activeTab === 'tours' && 'Panoramic images (PNG, JPG, WebP) up to 10MB'}
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : activeTab === 'images' ? (
        // Images Grid
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(image => (
            <div key={image.id} className="relative group rounded-lg overflow-hidden bg-gray-100">
              <img src={image.thumbnailUrl || image.url} alt="" className="w-full h-48 object-cover" />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-yellow-400 rounded-full p-1">
                    <Star className="w-4 h-4 text-gray-900 fill-current" />
                  </div>
                )}

                <button
                  onClick={() => handleSetPrimary(image.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-lg transition-opacity"
                  title="Set as primary"
                >
                  <Star className="w-4 h-4 text-gray-600" />
                </button>

                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-lg transition-opacity text-red-600 hover:bg-red-50"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {image.caption && <p className="text-xs text-gray-600 p-2 truncate">{image.caption}</p>}
            </div>
          ))}

          {images.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">No images uploaded yet</div>
          )}
        </div>
      ) : activeTab === 'videos' ? (
        // Videos List
        <div className="space-y-3">
          {videos.map(video => (
            <div key={video.id} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
              <GripVertical className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{video.title || 'Untitled Video'}</p>
                <p className="text-sm text-gray-500">{video.type}</p>
              </div>
              <button
                onClick={() => handleDeleteVideo(video.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {videos.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg">No videos uploaded yet</div>
          )}
        </div>
      ) : (
        // 360° Tours List
        <div className="space-y-3">
          {tours.map(tour => (
            <div key={tour.id} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
              <GripVertical className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{tour.roomName || 'Untitled Tour'}</p>
                <p className="text-sm text-gray-500">360° Panoramic</p>
              </div>
              <button
                onClick={() => handleDeleteTour(tour.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {tours.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg">No 360° tours uploaded yet</div>
          )}
        </div>
      )}
    </div>
  );
}
