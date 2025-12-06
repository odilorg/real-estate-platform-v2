'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Loader2, Star, MoveVertical } from 'lucide-react';
import { Button, Card } from '@repo/ui';

interface UploadedImage {
  url: string;
  key: string;
}

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUploader({ images, onChange, maxImages = 20 }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      setError(`Максимум ${maxImages} изображений`);
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    acceptedFiles.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('folder', 'properties');

    try {
      const token = getAuthToken();
      const response = await fetch(`${apiUrl}/upload/images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Ошибка загрузки');
      }

      const uploadedImages: UploadedImage[] = await response.json();
      const newUrls = uploadedImages.map((img) => img.url);
      onChange([...images, ...newUrls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onChange, apiUrl]);

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
      await fetch(`${apiUrl}/upload/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Failed to delete from server:', err);
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

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Загрузка...</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Отпустите файлы' : 'Перетащите фото или нажмите для выбора'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, JPEG, WEBP до 10MB ({images.length}/{maxImages})
                  </p>
                </div>
              </>
            )}
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
