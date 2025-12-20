'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Upload, Trash2, Star, GripVertical, Loader2, Eye, Edit2, Check, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

// Upload progress tracking interface
interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  previewUrl?: string;
}

// Dynamic import for 360 viewer preview
const PannellumViewer = dynamic(() => import('@/components/PannellumViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <Loader2 className="w-6 h-6 animate-spin text-white" />
    </div>
  ),
});

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
  thumbnailUrl?: string;
  title?: string;
  type: string;
  order: number;
}

interface Property360Tour {
  id: string;
  url: string;
  roomName?: string;
  description?: string;
  order: number;
}

// Room name suggestions for 360° tours
const ROOM_SUGGESTIONS = [
  { ru: 'Гостиная', uz: 'Yashash xonasi', en: 'Living Room' },
  { ru: 'Спальня', uz: 'Yotoqxona', en: 'Bedroom' },
  { ru: 'Кухня', uz: 'Oshxona', en: 'Kitchen' },
  { ru: 'Ванная', uz: 'Hammom', en: 'Bathroom' },
  { ru: 'Прихожая', uz: 'Kirish xonasi', en: 'Hallway' },
  { ru: 'Балкон', uz: 'Balkon', en: 'Balcony' },
  { ru: 'Терраса', uz: 'Terrasa', en: 'Terrace' },
  { ru: 'Кабинет', uz: 'Ish xonasi', en: 'Office' },
];

export default function PropertyMediaPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const locale = (params.locale as string) || 'ru';

  const [images, setImages] = useState<PropertyImage[]>([]);
  const [videos, setVideos] = useState<PropertyVideo[]>([]);
  const [tours, setTours] = useState<Property360Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'tours'>('images');

  // Upload progress tracking
  const [uploadingImages, setUploadingImages] = useState<UploadingFile[]>([]);
  const [uploadingVideos, setUploadingVideos] = useState<UploadingFile[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // 360 tour upload state
  const [tourRoomName, setTourRoomName] = useState('');
  const [tourDescription, setTourDescription] = useState('');
  const [selectedTourFile, setSelectedTourFile] = useState<File | null>(null);
  const [tourPreviewUrl, setTourPreviewUrl] = useState<string | null>(null);
  const [showTourPreview, setShowTourPreview] = useState(false);
  const tourFileInputRef = useRef<HTMLInputElement>(null);

  // YouTube video state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [addingYoutube, setAddingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState('');

  // Edit state for existing tours
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [editRoomName, setEditRoomName] = useState('');

  // Translations
  const t = {
    ru: {
      title: 'Медиа материалы',
      subtitle: 'Управляйте изображениями, видео и 360° турами',
      images: 'Изображения',
      videos: 'Видео',
      tours: '360° Туры',
      upload: 'Загрузить',
      uploadDrag: 'Нажмите для загрузки или перетащите файл',
      imagesHint: 'PNG, JPG, WebP до 10МБ',
      videosHint: 'MP4, MOV до 500МБ',
      toursHint: 'Панорамные изображения (2:1) до 10МБ',
      uploading: 'Загрузка...',
      noImages: 'Нет загруженных изображений',
      noVideos: 'Нет загруженных видео',
      noTours: 'Нет 360° туров',
      setAsPrimary: 'Сделать главным',
      delete: 'Удалить',
      untitledVideo: 'Без названия',
      untitledTour: 'Без названия',
      panoramic360: '360° Панорама',
      roomName: 'Название комнаты',
      roomNamePlaceholder: 'например: Гостиная, Спальня',
      description: 'Описание (необязательно)',
      descriptionPlaceholder: 'Краткое описание этой комнаты',
      uploadTour: 'Загрузить 360° тур',
      preview: 'Предпросмотр',
      cancel: 'Отмена',
      selectFile: 'Выберите файл',
      tips: 'Советы по 360° фото',
      tip1: 'Используйте панорамную камеру или смартфон с режимом 360°',
      tip2: 'Соотношение сторон должно быть 2:1 (equirectangular)',
      tip3: 'Снимайте при хорошем освещении',
      suggestedRooms: 'Популярные названия',
      // YouTube
      addYoutubeVideo: 'Добавить видео с YouTube',
      youtubeUrl: 'Ссылка на YouTube видео',
      youtubeUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
      videoTitle: 'Название видео (необязательно)',
      videoTitlePlaceholder: 'например: Видеотур по квартире',
      addVideo: 'Добавить видео',
      invalidYoutubeUrl: 'Неверная ссылка на YouTube',
      or: 'или',
      uploadVideoFile: 'Загрузить видеофайл',
      uploadProgress: 'Загрузка файлов',
      parseError: 'Ошибка парсинга ответа',
      sessionExpired: 'Сессия истекла',
      uploadError: 'Ошибка загрузки',
      networkError: 'Ошибка сети',
      filesNotUploaded: 'файл(ов) не удалось загрузить',
    },
    uz: {
      title: 'Media materiallar',
      subtitle: 'Rasmlar, videolar va 360° sayohatlarni boshqaring',
      images: 'Rasmlar',
      videos: 'Videolar',
      tours: '360° Sayohatlar',
      upload: 'Yuklash',
      uploadDrag: 'Yuklash uchun bosing yoki faylni torting',
      imagesHint: 'PNG, JPG, WebP 10MB gacha',
      videosHint: 'MP4, MOV 500MB gacha',
      toursHint: 'Panoramik rasmlar (2:1) 10MB gacha',
      uploading: 'Yuklanmoqda...',
      noImages: 'Yuklangan rasmlar yo\'q',
      noVideos: 'Yuklangan videolar yo\'q',
      noTours: '360° sayohatlar yo\'q',
      setAsPrimary: 'Asosiy qilish',
      delete: 'O\'chirish',
      untitledVideo: 'Nomsiz',
      untitledTour: 'Nomsiz',
      panoramic360: '360° Panorama',
      roomName: 'Xona nomi',
      roomNamePlaceholder: 'masalan: Yashash xonasi, Yotoqxona',
      description: 'Tavsif (ixtiyoriy)',
      descriptionPlaceholder: 'Ushbu xona haqida qisqacha',
      uploadTour: '360° sayohat yuklash',
      preview: 'Ko\'rib chiqish',
      cancel: 'Bekor qilish',
      selectFile: 'Faylni tanlang',
      tips: '360° foto maslahatlari',
      tip1: 'Panoramik kamera yoki 360° rejimli smartfondan foydalaning',
      tip2: 'Tomonlar nisbati 2:1 (equirectangular) bo\'lishi kerak',
      tip3: 'Yaxshi yorug\'likda suring',
      suggestedRooms: 'Mashhur nomlar',
      // YouTube
      addYoutubeVideo: 'YouTube dan video qo\'shish',
      youtubeUrl: 'YouTube video havolasi',
      youtubeUrlPlaceholder: 'https://www.youtube.com/watch?v=...',
      videoTitle: 'Video nomi (ixtiyoriy)',
      videoTitlePlaceholder: 'masalan: Kvartira video sayohati',
      addVideo: 'Video qo\'shish',
      invalidYoutubeUrl: 'Noto\'g\'ri YouTube havolasi',
      or: 'yoki',
      uploadVideoFile: 'Video faylni yuklash',
      uploadProgress: 'Fayllar yuklanmoqda',
      parseError: 'Javob o\'qishda xatolik',
      sessionExpired: 'Sessiya tugadi',
      uploadError: 'Yuklashda xatolik',
      networkError: 'Tarmoq xatosi',
      filesNotUploaded: 'fayl(lar) yuklanmadi',
    },
  };

  const text = t[locale as keyof typeof t] || t.ru;

  // Load media on mount
  useEffect(() => {
    loadMedia();
  }, []);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (tourPreviewUrl) {
        URL.revokeObjectURL(tourPreviewUrl);
      }
    };
  }, [tourPreviewUrl]);

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

  // Upload single image with progress tracking
  const uploadImageFile = useCallback((file: File, index: number): Promise<PropertyImage | null> => {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', '');
      formData.append('roomType', '');

      const xhr = new XMLHttpRequest();
      const token = getAuthToken();

      // Update progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadingImages((prev) =>
            prev.map((f, i) => (i === index ? { ...f, progress, status: 'uploading' } : f))
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: PropertyImage = JSON.parse(xhr.responseText);
            setUploadingImages((prev) =>
              prev.map((f, i) => (i === index ? { ...f, progress: 100, status: 'complete' } : f))
            );
            resolve(response);
          } catch {
            setUploadingImages((prev) =>
              prev.map((f, i) => (i === index ? { ...f, status: 'error', error: text.parseError } : f))
            );
            resolve(null);
          }
        } else {
          const errorMsg = xhr.status === 401 ? text.sessionExpired : `${text.uploadError} (${xhr.status})`;
          setUploadingImages((prev) =>
            prev.map((f, i) => (i === index ? { ...f, status: 'error', error: errorMsg } : f))
          );
          resolve(null);
        }
      };

      xhr.onerror = () => {
        setUploadingImages((prev) =>
          prev.map((f, i) => (i === index ? { ...f, status: 'error', error: text.networkError } : f))
        );
        resolve(null);
      };

      xhr.open('POST', `${apiUrl}/properties/${propertyId}/media/images/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }, [apiUrl, propertyId, text]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploading(true);

    // Create preview URLs and initialize uploading files
    const newUploadingFiles: UploadingFile[] = fileArray.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
      previewUrl: URL.createObjectURL(file),
    }));
    setUploadingImages(newUploadingFiles);

    try {
      // Upload files in parallel
      const uploadPromises = fileArray.map((file, index) => uploadImageFile(file, index));
      const results = await Promise.all(uploadPromises);

      // Filter successful uploads
      const successfulUploads = results.filter((img): img is PropertyImage => img !== null);

      if (successfulUploads.length > 0) {
        setImages((prev) => [...prev, ...successfulUploads]);
      }

      // Clear uploading files after a short delay to show completion
      setTimeout(() => {
        newUploadingFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        setUploadingImages([]);
      }, 1500);
    } catch (err) {
      console.error('Error uploading images:', err);
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Upload single video with progress tracking
  const uploadVideoFile = useCallback((file: File, index: number): Promise<PropertyVideo | null> => {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', '');
      formData.append('type', 'UPLOADED');

      const xhr = new XMLHttpRequest();
      const token = getAuthToken();

      // Update progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadingVideos((prev) =>
            prev.map((f, i) => (i === index ? { ...f, progress, status: 'uploading' } : f))
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: PropertyVideo = JSON.parse(xhr.responseText);
            setUploadingVideos((prev) =>
              prev.map((f, i) => (i === index ? { ...f, progress: 100, status: 'complete' } : f))
            );
            resolve(response);
          } catch {
            setUploadingVideos((prev) =>
              prev.map((f, i) => (i === index ? { ...f, status: 'error', error: text.parseError } : f))
            );
            resolve(null);
          }
        } else {
          const errorMsg = xhr.status === 401 ? text.sessionExpired : `${text.uploadError} (${xhr.status})`;
          setUploadingVideos((prev) =>
            prev.map((f, i) => (i === index ? { ...f, status: 'error', error: errorMsg } : f))
          );
          resolve(null);
        }
      };

      xhr.onerror = () => {
        setUploadingVideos((prev) =>
          prev.map((f, i) => (i === index ? { ...f, status: 'error', error: text.networkError } : f))
        );
        resolve(null);
      };

      xhr.open('POST', `${apiUrl}/properties/${propertyId}/media/videos/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }, [apiUrl, propertyId, text]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploading(true);

    // Create preview URLs and initialize uploading files
    const newUploadingFiles: UploadingFile[] = fileArray.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
      previewUrl: file.type.startsWith('video/') ? URL.createObjectURL(file) : undefined,
    }));
    setUploadingVideos(newUploadingFiles);

    try {
      // Upload files in parallel
      const uploadPromises = fileArray.map((file, index) => uploadVideoFile(file, index));
      const results = await Promise.all(uploadPromises);

      // Filter successful uploads
      const successfulUploads = results.filter((vid): vid is PropertyVideo => vid !== null);

      if (successfulUploads.length > 0) {
        setVideos((prev) => [...prev, ...successfulUploads]);
      }

      // Clear uploading files after a short delay to show completion
      setTimeout(() => {
        newUploadingFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        setUploadingVideos([]);
      }, 1500);
    } catch (err) {
      console.error('Error uploading videos:', err);
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleTourFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    if (tourPreviewUrl) {
      URL.revokeObjectURL(tourPreviewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    setTourPreviewUrl(previewUrl);
    setSelectedTourFile(file);
  };

  const handleTourUpload = async () => {
    if (!selectedTourFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedTourFile);
      formData.append('roomName', tourRoomName);
      formData.append('description', tourDescription);

      const response = await api.post<Property360Tour>(`/properties/${propertyId}/media/tours/upload`, formData);
      setTours([...tours, response]);

      // Reset form
      setSelectedTourFile(null);
      setTourRoomName('');
      setTourDescription('');
      if (tourPreviewUrl) {
        URL.revokeObjectURL(tourPreviewUrl);
        setTourPreviewUrl(null);
      }
      setShowTourPreview(false);
      if (tourFileInputRef.current) {
        tourFileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading tour:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelTourUpload = () => {
    setSelectedTourFile(null);
    setTourRoomName('');
    setTourDescription('');
    if (tourPreviewUrl) {
      URL.revokeObjectURL(tourPreviewUrl);
      setTourPreviewUrl(null);
    }
    setShowTourPreview(false);
    if (tourFileInputRef.current) {
      tourFileInputRef.current.value = '';
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

  const handleUpdateTourRoomName = async (tourId: string) => {
    try {
      await api.put(`/properties/${propertyId}/media/tours/${tourId}`, {
        roomName: editRoomName,
      });
      setTours(
        tours.map(t => (t.id === tourId ? { ...t, roomName: editRoomName } : t)),
      );
      setEditingTourId(null);
      setEditRoomName('');
    } catch (err) {
      console.error('Error updating tour:', err);
    }
  };

  const startEditingTour = (tour: Property360Tour) => {
    setEditingTourId(tour.id);
    setEditRoomName(tour.roomName || '');
  };

  // YouTube URL parser - extracts video ID from various YouTube URL formats
  const extractYoutubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/, // Just the video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Get YouTube thumbnail URL
  const getYoutubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  // Handle adding YouTube video
  const handleAddYoutubeVideo = async () => {
    setYoutubeError('');

    const videoId = extractYoutubeVideoId(youtubeUrl.trim());
    if (!videoId) {
      setYoutubeError(text.invalidYoutubeUrl);
      return;
    }

    try {
      setAddingYoutube(true);

      const response = await api.post<PropertyVideo>(`/properties/${propertyId}/media/videos`, {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnailUrl: getYoutubeThumbnail(videoId),
        title: youtubeTitle.trim() || undefined,
        type: 'YOUTUBE',
      });

      setVideos([...videos, response]);
      setYoutubeUrl('');
      setYoutubeTitle('');
    } catch (err) {
      console.error('Error adding YouTube video:', err);
      setYoutubeError('Failed to add video');
    } finally {
      setAddingYoutube(false);
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
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{text.subtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        {(['images', 'videos', 'tours'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'images' && text.images}
            {tab === 'videos' && text.videos}
            {tab === 'tours' && text.tours}
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
              {tab === 'images' ? images.length : tab === 'videos' ? videos.length : tours.length}
            </span>
          </button>
        ))}
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">
            {text.upload} {activeTab === 'images' ? text.images.toLowerCase() : activeTab === 'videos' ? text.videos.toLowerCase() : text.tours}
          </h2>
        </div>

        {activeTab === 'tours' ? (
          // Enhanced 360° Tour Upload
          <div className="space-y-4">
            {!selectedTourFile ? (
              <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  ref={tourFileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleTourFileSelect}
                  disabled={uploading}
                />
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-900">{text.uploadDrag}</p>
                  <p className="text-sm text-gray-500 mt-1">{text.toursHint}</p>
                </div>
              </label>
            ) : (
              <div className="space-y-4">
                {/* Preview Toggle */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {selectedTourFile.name} ({(selectedTourFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <button
                    onClick={() => setShowTourPreview(!showTourPreview)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    {showTourPreview ? 'Hide' : text.preview}
                  </button>
                </div>

                {/* 360 Preview */}
                {showTourPreview && tourPreviewUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-900">
                    <PannellumViewer imageUrl={tourPreviewUrl} />
                  </div>
                )}

                {/* Room Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {text.roomName} *
                  </label>
                  <input
                    type="text"
                    value={tourRoomName}
                    onChange={e => setTourRoomName(e.target.value)}
                    placeholder={text.roomNamePlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {/* Room name suggestions */}
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">{text.suggestedRooms}:</p>
                    <div className="flex flex-wrap gap-1">
                      {ROOM_SUGGESTIONS.map((room, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setTourRoomName(room[locale as keyof typeof room] || room.ru)}
                          className="px-2 py-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                        >
                          {room[locale as keyof typeof room] || room.ru}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {text.description}
                  </label>
                  <textarea
                    value={tourDescription}
                    onChange={e => setTourDescription(e.target.value)}
                    placeholder={text.descriptionPlaceholder}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleTourUpload}
                    disabled={uploading || !tourRoomName.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {text.uploading}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {text.uploadTour}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelTourUpload}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {text.cancel}
                  </button>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">{text.tips}</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {text.tip1}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {text.tip2}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {text.tip3}
                </li>
              </ul>
            </div>
          </div>
        ) : activeTab === 'videos' ? (
          // Video upload with YouTube support
          <div className="space-y-6">
            {/* YouTube URL Input */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <h3 className="font-semibold text-gray-900">{text.addYoutubeVideo}</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {text.youtubeUrl} *
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={e => {
                      setYoutubeUrl(e.target.value);
                      setYoutubeError('');
                    }}
                    placeholder={text.youtubeUrlPlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {text.videoTitle}
                  </label>
                  <input
                    type="text"
                    value={youtubeTitle}
                    onChange={e => setYoutubeTitle(e.target.value)}
                    placeholder={text.videoTitlePlaceholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                {youtubeError && (
                  <p className="text-sm text-red-600">{youtubeError}</p>
                )}

                {/* YouTube Preview */}
                {youtubeUrl && extractYoutubeVideoId(youtubeUrl) && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYoutubeVideoId(youtubeUrl)}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                <button
                  onClick={handleAddYoutubeVideo}
                  disabled={addingYoutube || !youtubeUrl.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addingYoutube ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {text.uploading}
                    </>
                  ) : (
                    text.addVideo
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="text-sm text-gray-500">{text.or}</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* File Upload */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">{text.uploadVideoFile}</p>
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  accept="video/mp4,video/quicktime"
                  onChange={handleVideoUpload}
                  disabled={uploading}
                  multiple
                />
                {uploading && uploadingVideos.length === 0 ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span>{text.uploading}</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{text.uploadDrag}</p>
                    <p className="text-sm text-gray-500 mt-1">{text.videosHint}</p>
                  </div>
                )}
              </label>

              {/* Video Upload Progress */}
              {uploadingVideos.length > 0 && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700">
                      {text.uploadProgress} ({uploadingVideos.filter(f => f.status === 'complete').length}/{uploadingVideos.length})
                    </p>
                    {uploading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                  </div>
                  <div className="space-y-2">
                    {uploadingVideos.map((file, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {/* Video icon */}
                        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-800 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        {/* File info and progress */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-600 truncate">{file.file.name}</p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {file.status === 'uploading' && (
                                <span className="text-xs text-blue-600">{file.progress}%</span>
                              )}
                              {file.status === 'complete' && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                              {file.status === 'error' && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                file.status === 'error' ? 'bg-red-500' :
                                file.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${file.progress}%` }}
                            />
                          </div>
                          {file.status === 'error' && file.error && (
                            <p className="text-xs text-red-500 mt-0.5">{file.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Standard upload for images only
          <div className="space-y-4">
            <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={uploading}
                multiple
              />
              {uploading && uploadingImages.length === 0 ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span>{text.uploading}</span>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-medium text-gray-900">{text.uploadDrag}</p>
                  <p className="text-sm text-gray-500 mt-1">{text.imagesHint}</p>
                </div>
              )}
            </label>

            {/* Image Upload Progress */}
            {uploadingImages.length > 0 && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">
                    {text.uploadProgress} ({uploadingImages.filter(f => f.status === 'complete').length}/{uploadingImages.length})
                  </p>
                  {uploading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                </div>
                <div className="space-y-2">
                  {uploadingImages.map((file, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {/* Preview thumbnail */}
                      {file.previewUrl && (
                        <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-200">
                          <img
                            src={file.previewUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {/* File info and progress */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-600 truncate">{file.file.name}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {file.status === 'uploading' && (
                              <span className="text-xs text-blue-600">{file.progress}%</span>
                            )}
                            {file.status === 'complete' && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                            {file.status === 'error' && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              file.status === 'error' ? 'bg-red-500' :
                              file.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        {file.status === 'error' && file.error && (
                          <p className="text-xs text-red-500 mt-0.5">{file.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
                  title={text.setAsPrimary}
                >
                  <Star className="w-4 h-4 text-gray-600" />
                </button>

                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-lg transition-opacity text-red-600 hover:bg-red-50"
                  title={text.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {image.caption && <p className="text-xs text-gray-600 p-2 truncate">{image.caption}</p>}
            </div>
          ))}

          {images.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">{text.noImages}</div>
          )}
        </div>
      ) : activeTab === 'videos' ? (
        // Videos Grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map(video => {
            const videoId = video.type === 'YOUTUBE' ? extractYoutubeVideoId(video.url) : null;
            return (
              <div key={video.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Video Preview */}
                <div className="aspect-video relative bg-gray-900">
                  {video.type === 'YOUTUBE' && videoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title || text.untitledVideo}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Type Badge */}
                  <div className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full ${
                    video.type === 'YOUTUBE' ? 'bg-red-600' : video.type === 'VIMEO' ? 'bg-blue-500' : 'bg-gray-600'
                  }`}>
                    {video.type === 'YOUTUBE' ? 'YouTube' : video.type === 'VIMEO' ? 'Vimeo' : 'Video'}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{video.title || text.untitledVideo}</p>
                      {video.type === 'YOUTUBE' && (
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {text.preview}
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteVideo(video.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}

          {videos.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg">{text.noVideos}</div>
          )}
        </div>
      ) : (
        // 360° Tours Grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tours.map(tour => (
            <div key={tour.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Tour Preview */}
              <div className="aspect-video relative bg-gray-900">
                <Image
                  src={tour.url}
                  alt={tour.roomName || text.untitledTour}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 rounded-full p-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  360°
                </div>
              </div>

              {/* Tour Info */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  {editingTourId === tour.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editRoomName}
                        onChange={e => setEditRoomName(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdateTourRoomName(tour.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingTourId(null)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-gray-900">{tour.roomName || text.untitledTour}</p>
                        <p className="text-sm text-gray-500">{text.panoramic360}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditingTour(tour)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTour(tour.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {tours.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-lg">
              {text.noTours}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
