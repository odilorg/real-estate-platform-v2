'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@repo/ui';
import { savedSearchApi, type CreateSavedSearchDto } from '@/lib/api';

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Record<string, any>;
  onSaved?: () => void;
}

export function SaveSearchModal({ isOpen, onClose, filters, onSaved }: SaveSearchModalProps) {
  const [name, setName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Пожалуйста, введите название');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const data: CreateSavedSearchDto = {
        name: name.trim(),
        filters,
        notificationsEnabled,
      };

      await savedSearchApi.create(data);

      // Reset form
      setName('');
      setNotificationsEnabled(false);

      // Call callback and close
      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to save search:', err);
      setError(err.message || 'Не удалось сохранить поиск');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in slide-in-from-bottom duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-2">Сохранить поиск</h2>
        <p className="text-sm text-gray-600 mb-6">
          Сохраните текущие фильтры, чтобы быстро повторить поиск позже
        </p>

        {/* Form */}
        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="search-name" className="block text-sm font-medium text-gray-700 mb-1">
              Название поиска
            </label>
            <input
              id="search-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Квартиры в Чиланзаре"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={100}
            />
          </div>

          {/* Notifications Toggle */}
          <div className="flex items-start gap-3">
            <input
              id="notifications"
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="notifications" className="text-sm text-gray-700">
              <div className="font-medium">Уведомлять о новых объектах</div>
              <div className="text-gray-500 text-xs mt-0.5">
                Мы отправим вам уведомление, когда появятся объекты, соответствующие вашим критериям
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
