'use client';

import { useState, useEffect, useRef } from 'react';
import { Bookmark, ChevronDown, Trash2, Bell, BellOff } from 'lucide-react';
import { savedSearchApi, type SavedSearch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface SavedSearchesDropdownProps {
  onLoadSearch: (filters: Record<string, any>) => void;
}

export function SavedSearchesDropdown({ onLoadSearch }: SavedSearchesDropdownProps) {
  const { isAuthenticated } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadSavedSearches();
    }
  }, [isAuthenticated, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadSavedSearches = async () => {
    setLoading(true);
    try {
      const searches = await savedSearchApi.getAll();
      setSavedSearches(searches);
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Вы уверены, что хотите удалить этот сохраненный поиск?')) {
      return;
    }

    try {
      await savedSearchApi.delete(id);
      setSavedSearches(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete saved search:', err);
      alert('Не удалось удалить поиск');
    }
  };

  const handleToggleNotifications = async (search: SavedSearch, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const updated = await savedSearchApi.toggleNotifications(
        search.id,
        !search.notificationsEnabled
      );
      setSavedSearches(prev =>
        prev.map(s => (s.id === search.id ? updated : s))
      );
    } catch (err) {
      console.error('Failed to toggle notifications:', err);
      alert('Не удалось изменить настройки уведомлений');
    }
  };

  const handleLoadSearch = (search: SavedSearch) => {
    onLoadSearch(search.filters);
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Bookmark className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium">Сохраненные поиски</span>
        {savedSearches.length > 0 && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
            {savedSearches.length}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <div className="mt-2 text-sm">Загрузка...</div>
            </div>
          ) : savedSearches.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              <Bookmark className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p>У вас пока нет сохраненных поисков</p>
              <p className="text-xs mt-1">Используйте кнопку &quot;Сохранить поиск&quot; для сохранения текущих фильтров</p>
            </div>
          ) : (
            <div className="py-2">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                  onClick={() => handleLoadSearch(search)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {search.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Создано {new Date(search.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleToggleNotifications(search, e)}
                        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                          search.notificationsEnabled ? 'text-blue-600' : 'text-gray-400'
                        }`}
                        title={search.notificationsEnabled ? 'Отключить уведомления' : 'Включить уведомления'}
                      >
                        {search.notificationsEnabled ? (
                          <Bell className="h-4 w-4" />
                        ) : (
                          <BellOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => handleDelete(search.id, e)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
