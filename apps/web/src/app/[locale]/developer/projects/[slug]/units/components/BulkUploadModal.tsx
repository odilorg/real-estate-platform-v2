import { useState } from 'react';
import { X, Upload, Download, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface BulkUploadModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkUploadModal({
  projectId,
  onClose,
  onSuccess,
}: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const csvFile = acceptedFiles[0];
        setFile(csvFile);
        await parseCSV(csvFile);
      }
    },
  });

  const parseCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      alert('CSV file must have at least a header row and one data row');
      setFile(null);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });

    // Show first 10 rows for preview
    setPreview(rows.slice(0, 10));
  };

  const downloadTemplate = () => {
    const template = `unitNumber,floor,bedrooms,bathrooms,area,price,block,entrance,currency
101,1,2,1,65,75000,A,1,UZS
102,1,3,2,85,95000,A,1,UZS
103,2,2,1,65,75000,A,1,UZS
201,2,3,2,85,95000,A,2,UZS
202,2,2,1,65,75000,A,2,UZS`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'units_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      // Get token for authentication
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_URL}/developer-projects/${projectId}/units/bulk`,
        {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload units');
      }

      const data = await response.json();
      setResult({
        success: data.created || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload units');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (result && result.success > 0) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Units</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900">
                  Download CSV Template
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Download our template to see the required format and headers
                </p>
                <button
                  onClick={downloadTemplate}
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* Upload Result */}
          {result && (
            <div
              className={`border rounded-lg p-4 ${
                result.failed === 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.failed === 0 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    Upload Complete
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">
                    Successfully created {result.success} units
                    {result.failed > 0 && `, ${result.failed} failed`}
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Errors:
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {result.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>
                            Row {error.row}: {error.error}
                          </li>
                        ))}
                        {result.errors.length > 5 && (
                          <li className="text-gray-500">
                            ... and {result.errors.length - 5} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* File Upload Area */}
          {!result && (
            <>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {file ? (
                  <>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setPreview([]);
                      }}
                      className="mt-3 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-1">
                      {isDragActive
                        ? 'Drop the CSV file here'
                        : 'Drag and drop a CSV file here, or click to select'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Maximum file size: 5MB
                    </p>
                  </>
                )}
              </div>

              {/* Preview Table */}
              {preview.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Preview (first 10 rows)
                  </h3>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Row
                          </th>
                          {Object.keys(preview[0] || {}).map((header) => (
                            <th
                              key={header}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.map((row, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {index + 2}
                            </td>
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap"
                              >
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Total rows to upload: {preview.length}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? 'Uploading...' : 'Upload Units'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
