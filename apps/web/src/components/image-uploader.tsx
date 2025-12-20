'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Loader2, Star, MoveVertical, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, Card } from '@repo/ui';

interface UploadedImage {
  url: string;
  key: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  previewUrl?: string;
}

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onChange, maxImages = 20 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Upload a single file with progress tracking
  const uploadFile = useCallback((file: File, index: number): Promise<string | null> => {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('folder', 'properties');

      const xhr = new XMLHttpRequest();
      const token = getAuthToken();

      // Update progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadingFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, progress, status: 'uploading' } : f))
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response: UploadedImage[] = JSON.parse(xhr.responseText);
            const url = response[0]?.url;
            setUploadingFiles((prev) =>
              prev.map((f, i) => (i === index ? { ...f, progress: 100, status: 'complete' } : f))
            );
            resolve(url || null);
          } catch {
            setUploadingFiles((prev) =>
              prev.map((f, i) => (i === index ? { ...f, status: 'error', error: 'Ошибка парсинга ответа' } : f))
            );
            resolve(null);
          }
        } else {
          const errorMsg = xhr.status === 401 ? 'Сессия истекла' : `Ошибка загрузки (${xhr.status})`;
          setUploadingFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, status: 'error', error: errorMsg } : f))
          );
          resolve(null);
        }
      };

      xhr.onerror = () => {
        setUploadingFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, status: 'error', error: 'Ошибка сети' } : f))
        );
        resolve(null);
      };

      xhr.open('POST', `${apiUrl}/upload/images`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }, [apiUrl]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      setError(`Максимум ${maxImages} изображений`);
      return;
    }

    setUploading(true);
    setError(null);

    // Create preview URLs and initialize uploading files
    const newUploadingFiles: UploadingFile[] = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
      previewUrl: URL.createObjectURL(file),
    }));
    setUploadingFiles(newUploadingFiles);

    try {
      // Upload files in parallel
      const uploadPromises = acceptedFiles.map((file, index) => uploadFile(file, index));
      const results = await Promise.all(uploadPromises);

      // Filter successful uploads
      const successfulUrls = results.filter((url): url is string => url !== null);

      if (successfulUrls.length > 0) {
        onChange([...images, ...successfulUrls]);
      }

      if (successfulUrls.length < acceptedFiles.length) {
        setError(`${acceptedFiles.length - successfulUrls.length} файл(ов) не удалось загрузить`);
      }

      // Clear uploading files after a short delay to show completion
      setTimeout(() => {
        // Revoke preview URLs
        newUploadingFiles.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        setUploadingFiles([]);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onChange, uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: maxImages - images.length,
    disabled: uploading || images.length >= maxImages,
  });

  const removeImage = async (index: number) => {
    const imageUrl = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);

    // Try to delete from server (fire and forget)
    try {
      const token = getAuthToken();
      const key = new URL(imageUrl).pathname.slice(1);

      // Build headers - include Authorization header only if token exists
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(`${apiUrl}/upload/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers,
        credentials: 'include', // Include cookies for OAuth authentication
      });
    } catch (err) {
      // Silently fail - file may already be deleted
    }
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    const primaryImage = newImages.splice(index, 1)[0];
    newImages.unshift(primaryImage);
    onChange(newImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {/* Upload Progress Section */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Загрузка файлов ({uploadingFiles.filter(f => f.status === 'complete').length}/{uploadingFiles.length})
            </p>
            {uploading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          </div>
          <div className="space-y-2">
            {uploadingFiles.map((file, index) => (
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

      {/* Upload Area */}
      {images.length < maxImages && !uploading && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? 'Отпустите файлы' : 'Перетащите фото или нажмите для выбора'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, JPEG, WEBP до 10MB ({images.length}/{maxImages})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <Card
              key={index}
              className="relative group overflow-hidden cursor-move"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="aspect-square relative">
                <Image
                  src={url}
                  alt={`Фото ${index + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Set as Primary */}
                  {index !== 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPrimaryImage(index)}
                      className="h-8 w-8 p-0"
                      title="Сделать главным"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Delete */}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    className="h-8 w-8 p-0"
                    title="Удалить"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Главное
                  </div>
                )}

                {/* Drag Handle */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 p-1 rounded">
                    <MoveVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Image Number */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {index + 1}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {images.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Перетащите для изменения порядка • Первое фото - главное • Нажмите звезду для выбора главного
        </p>
      )}
    </div>
  );
}
