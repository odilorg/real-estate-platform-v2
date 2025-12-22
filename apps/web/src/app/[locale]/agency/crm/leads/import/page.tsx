'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

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
  const t = useTranslations('crm.leads.importPage');
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
      toast.warning(t('selectFileAlert'), {
        icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      });
      return;
    }

    setImporting(true);
    try {
      const importResult = await api.post<ImportResult>('/agency-crm/leads/import', {
        csvData,
        duplicateHandling,
      });
      setResult(importResult);
      toast.success(t('importSuccess') || 'Import completed', {
        description: `${importResult.success} leads imported`,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast.error(t('importError'), {
        icon: <XCircle className="h-5 w-5 text-red-500" />,
      });
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
          <Link href="/agency/crm/leads">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
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
                <h3 className="font-semibold text-blue-900">{t('templateTitle')}</h3>
                <p className="text-sm text-blue-700 mt-1">{t('templateDescription')}</p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  {t('downloadTemplate')}
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('selectFile')}</h2>
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
                  {file ? file.name : t('selectOrDrag')}
                </p>
                <p className="text-sm text-gray-500 mt-1">{t('dragHere')}</p>
              </label>
            </div>
          </div>

          {/* Duplicate Handling */}
          {file && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('duplicateHandling')}</h2>
              <p className="text-sm text-gray-600 mb-4">{t('duplicateQuestion')}</p>
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
                    <div className="font-medium text-gray-900">{t('duplicateSkip')}</div>
                    <div className="text-sm text-gray-500">{t('duplicateSkipDesc')}</div>
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
                    <div className="font-medium text-gray-900">{t('duplicateUpdate')}</div>
                    <div className="text-sm text-gray-500">{t('duplicateUpdateDesc')}</div>
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
                    <div className="font-medium text-gray-900">{t('duplicateError')}</div>
                    <div className="text-sm text-gray-500">{t('duplicateErrorDesc')}</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Import Button */}
          {file && (
            <div className="flex justify-end gap-3">
              <Link href="/agency/crm/leads">
                <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  {t('cancel')}
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
                    {t('importing')}
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    {t('importButton')}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('resultsTitle')}</h2>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-900">{result.success}</div>
                    <div className="text-sm text-green-700">{t('success')}</div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-900">{result.skipped}</div>
                    <div className="text-sm text-yellow-700">{t('skipped')}</div>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold text-red-900">{result.failed}</div>
                    <div className="text-sm text-red-700">{t('errors')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-900 mb-3">{t('errorsTitle')}</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700">
                      <span className="font-medium">{t('row')} {error.row}:</span> {error.error}
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
                {t('importMore')}
              </button>
              <Link href="/agency/crm/leads">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {t('backToLeads')}
                </button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
