import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUploader } from '../image-uploader';
import '@testing-library/jest-dom';

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop, accept, maxFiles }: any) => ({
    getRootProps: () => ({
      role: 'presentation',
      tabIndex: 0,
    }),
    getInputProps: () => ({
      type: 'file',
      accept,
      multiple: maxFiles !== 1,
      style: { display: 'none' },
    }),
    isDragActive: false,
    open: vi.fn(),
  }),
}));

// Mock @repo/ui components
vi.mock('@repo/ui', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock global fetch (kept for compatibility)
global.fetch = vi.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn((obj: any) => `blob:mock-url-${obj.name || 'file'}`);
global.URL.revokeObjectURL = vi.fn();

// Mock File and FileList
global.File = class MockFile {
  name: string;
  type: string;
  size: number;

  constructor(parts: any[], filename: string, options: any = {}) {
    this.name = filename;
    this.type = options.type || '';
    this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0);
  }
} as any;

// Mock XMLHttpRequest (the component uses XHR, not fetch)
class MockXMLHttpRequest {
  upload: { onprogress: ((event: any) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  status = 200;
  responseText = '';
  private _url = '';
  private _method = '';
  private _headers: Record<string, string> = {};

  open(method: string, url: string) {
    this._method = method;
    this._url = url;
  }

  setRequestHeader(name: string, value: string) {
    this._headers[name] = value;
  }

  send(body?: any) {
    // Simulate successful upload
    setTimeout(() => {
      if (this.upload.onprogress) {
        this.upload.onprogress({ lengthComputable: true, loaded: 100, total: 100 });
      }
      this.status = 200;
      this.responseText = JSON.stringify([{ url: 'https://example.com/uploaded.jpg', key: 'uploaded.jpg' }]);
      if (this.onload) this.onload();
    }, 0);
  }
}

global.XMLHttpRequest = MockXMLHttpRequest as any;

describe('ImageUploader', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should render upload area', () => {
    render(<ImageUploader images={[]} onChange={mockOnChange} />);
    expect(screen.getByText(/Перетащите фото или нажмите для выбора/i)).toBeInTheDocument();
  });

  it('should show image count limit', () => {
    render(<ImageUploader images={[]} onChange={mockOnChange} maxImages={10} />);
    expect(screen.getByText(/\(0\/10\)/i)).toBeInTheDocument();
  });

  it('should upload files and call onChange with URLs', async () => {
    localStorageMock.setItem('token', 'test-token-123');

    const { container } = render(<ImageUploader images={[]} onChange={mockOnChange} />);

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/uploaded.jpg']);
    });
  });

  it('should handle upload without auth token', async () => {
    // No token in localStorage
    const { container } = render(<ImageUploader images={[]} onChange={mockOnChange} />);

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/uploaded.jpg']);
    });
  });

  it('should display uploaded images', () => {
    const images = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ];

    render(<ImageUploader images={images} onChange={mockOnChange} />);

    expect(screen.getByText('1')).toBeInTheDocument(); // Image number
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Главное')).toBeInTheDocument(); // Primary badge on first image
  });

  it('should show error when max images exceeded', async () => {
    const { container } = render(<ImageUploader images={[]} onChange={mockOnChange} maxImages={2} />);

    const files = [
      new File(['content1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['content2'], 'test2.jpg', { type: 'image/jpeg' }),
      new File(['content3'], 'test3.jpg', { type: 'image/jpeg' }),
    ];

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(screen.getByText('Максимум 2 изображений')).toBeInTheDocument();
    });
  });

  it('should show error on 401 Unauthorized', async () => {
    // Override the mock XHR to simulate 401 error
    const OriginalXHR = global.XMLHttpRequest;
    class MockXHR401 extends OriginalXHR {
      send(body?: any) {
        setTimeout(() => {
          this.status = 401;
          this.responseText = JSON.stringify({ message: 'Unauthorized' });
          if (this.onload) this.onload();
        }, 0);
      }
    }
    global.XMLHttpRequest = MockXHR401 as any;

    const { container } = render(<ImageUploader images={[]} onChange={mockOnChange} />);

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Сессия истекла/i)).toBeInTheDocument();
    });

    // Restore original mock
    global.XMLHttpRequest = OriginalXHR;
  });

  it('should call onChange with new image URLs after successful upload', async () => {
    const existingImages = ['https://example.com/existing.jpg'];

    const { container } = render(<ImageUploader images={existingImages} onChange={mockOnChange} />);

    const files = [
      new File(['content1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['content2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
      const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      expect(lastCall[0]).toContain('https://example.com/existing.jpg');
      expect(lastCall[0]).toContain('https://example.com/uploaded.jpg');
    });
  });
});
