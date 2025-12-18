'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { ArrowLeft, Download, Filter, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';

export default function LeadsExportPage() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  // Filters
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [search, setSearch] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (source) params.append('source', source);
      if (assignedToId) params.append('assignedToId', assignedToId);
      if (search) params.append('search', search);

      const result = await api.get<{ csv: string; filename: string }>(
        `/agency-crm/leads/export?${params.toString()}`
      );

      // Download CSV file
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = result.filename;
      link.click();

      // Show success message
      alert('Экспорт завершен!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Ошибка при экспорте лидов');
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setStatus('');
    setPriority('');
    setSource('');
    setAssignedToId('');
    setSearch('');
  };

  const hasFilters = status || priority || source || assignedToId || search;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/developer/crm/leads">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Экспорт лидов</h1>
            <p className="mt-1 text-sm text-gray-500">Экспортируйте лиды в CSV формат с фильтрами</p>
          </div>
        </div>
      </div>

      {/* Filter Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Filter className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Фильтрация при экспорте</h3>
            <p className="text-sm text-blue-700 mt-1">
              Используйте фильтры ниже, чтобы экспортировать только нужные лиды. Без фильтров будут экспортированы все лиды.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Фильтры</h2>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Очистить фильтры
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все статусы</option>
              <option value="NEW">Новый</option>
              <option value="CONTACTED">Связались</option>
              <option value="QUALIFIED">Квалифицирован</option>
              <option value="NEGOTIATION">Переговоры</option>
              <option value="WON">Выигран</option>
              <option value="LOST">Проигран</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Приоритет</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все приоритеты</option>
              <option value="URGENT">Срочный</option>
              <option value="HIGH">Высокий</option>
              <option value="MEDIUM">Средний</option>
              <option value="LOW">Низкий</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Источник</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все источники</option>
              <option value="WEBSITE">Сайт</option>
              <option value="REFERRAL">Рекомендация</option>
              <option value="SOCIAL_MEDIA">Соц. сети</option>
              <option value="ADVERTISING">Реклама</option>
              <option value="COLD_CALL">Холодный звонок</option>
              <option value="CSV_IMPORT">CSV импорт</option>
              <option value="OTHER">Другое</option>
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Имя, телефон, email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasFilters && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Активные фильтры:</span>{' '}
              {[
                status && `Статус: ${status}`,
                priority && `Приоритет: ${priority}`,
                source && `Источник: ${source}`,
                search && `Поиск: "${search}"`,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Export Info */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Что будет экспортировано?</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• Все поля лидов (имя, фамилия, телефон, email, Telegram, WhatsApp)</p>
          <p>• Информация о недвижимости (тип, бюджет, количество комнат, районы)</p>
          <p>• Требования и заметки</p>
          <p>• Источник, статус, приоритет</p>
          <p>• Назначенный менеджер</p>
          <p>• Дата создания</p>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">Примечание:</span> Экспортированный CSV файл можно использовать для импорта в другие системы или обратного импорта.
          </p>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end gap-3">
        <Link href="/developer/crm/leads">
          <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            Отмена
          </button>
        </Link>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {exporting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Экспорт...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Экспортировать
            </>
          )}
        </button>
      </div>
    </div>
  );
}
