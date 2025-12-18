'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  imported: any[];
}

export default function LeadsImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>('');
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'error'>('skip');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);

      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvData(content);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!csvData) {
      alert('Пожалуйста, выберите CSV файл');
      return;
    }

    setImporting(true);
    try {
      const importResult = await api.post<ImportResult>('/agency-crm/leads/import', {
        csvData,
        duplicateHandling,
      });
      setResult(importResult);
    } catch (error) {
      console.error('Import error:', error);
      alert('Ошибка при импорте лидов');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `FirstName,LastName,Phone,Email,Telegram,WhatsApp,PropertyType,ListingType,Budget,Bedrooms,Districts,Requirements,Source,Status,Priority,Notes
Иван,Иванов,+998901234567,ivan@example.com,@ivan,,APARTMENT,SALE,100000000,3,"Юнусабад, Чиланзар",Нужна квартира в новостройке,WEBSITE,NEW,HIGH,
Мария,Петрова,+998907654321,maria@example.com,,,HOUSE,RENT,50000000,4,Сергели,Дом с садом,REFERRAL,NEW,MEDIUM,`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leads-import-template.csv';
    link.click();
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Импорт лидов</h1>
            <p className="mt-1 text-sm text-gray-500">Загрузите CSV файл для массового добавления лидов</p>
          </div>
        </div>
      </div>

      {!result ? (
        <>
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Нужен шаблон?</h3>
                <p className="text-sm text-blue-700 mt-1">Скачайте шаблон CSV файла с примерами данных</p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Скачать шаблон
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Выберите CSV файл</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900">
                  {file ? file.name : 'Выберите CSV файл'}
                </p>
                <p className="text-sm text-gray-500 mt-1">или перетащите файл сюда</p>
              </label>
            </div>
          </div>

          {/* Duplicate Handling */}
          {file && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Обработка дубликатов</h2>
              <p className="text-sm text-gray-600 mb-4">Что делать, если лид с таким телефоном уже существует?</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="duplicate"
                    value="skip"
                    checked={duplicateHandling === 'skip'}
                    onChange={() => setDuplicateHandling('skip')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Пропустить</div>
                    <div className="text-sm text-gray-500">Не импортировать дубликаты</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="duplicate"
                    value="update"
                    checked={duplicateHandling === 'update'}
                    onChange={() => setDuplicateHandling('update')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Обновить</div>
                    <div className="text-sm text-gray-500">Обновить существующие данные</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="duplicate"
                    value="error"
                    checked={duplicateHandling === 'error'}
                    onChange={() => setDuplicateHandling('error')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Ошибка</div>
                    <div className="text-sm text-gray-500">Отметить как ошибку в отчете</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Import Button */}
          {file && (
            <div className="flex justify-end gap-3">
              <Link href="/developer/crm/leads">
                <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Отмена
                </button>
              </Link>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Импорт...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Импортировать
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Import Results */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Результаты импорта</h2>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-900">{result.success}</div>
                    <div className="text-sm text-green-700">Успешно</div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-900">{result.skipped}</div>
                    <div className="text-sm text-yellow-700">Пропущено</div>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold text-red-900">{result.failed}</div>
                    <div className="text-sm text-red-700">Ошибки</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-900 mb-3">Ошибки импорта:</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700">
                      <span className="font-medium">Строка {error.row}:</span> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setFile(null);
                  setCsvData('');
                  setResult(null);
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Импортировать еще
              </button>
              <Link href="/developer/crm/leads">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Вернуться к лидам
                </button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
