import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUploader } from '../image-uploader';
import '@testing-library/jest-dom';

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

// Mock global fetch
global.fetch = vi.fn();

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

  it('should send Authorization header when token exists in localStorage', async () => {
    localStorageMock.setItem('token', 'test-token-123');

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ url: 'https://example.com/image1.jpg', key: 'image1.jpg' }],
    });

    const { container } = render(<ImageUploader images={[]} onChange={mockOnChange} />);

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload/images'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
          credentials: 'include',
        })
      );
    });
  });

  it('should send credentials without Authorization header when no token in localStorage (OAuth users)', async () => {
    // No token in localStorage - simulating OAuth user
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ url: 'https://example.com/image1.jpg', key: 'image1.jpg' }],
    });

    const { container } = render(<ImageUploader images={[]} onChange={mockOnChange} />);

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const fetchCall = (global.fetch as any).mock.calls[0];
      const [url, options] = fetchCall;

      expect(url).toContain('/upload/images');
      expect(options.credentials).toBe('include');
      expect(options.headers.Authorization).toBeUndefined();
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
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    const { container } = render(<ImageUploader images={[]} onChange={mockOnChange} />);

    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Сессия истекла. Пожалуйста, войдите заново.')).toBeInTheDocument();
    });
  });

  it('should call onChange with new image URLs after successful upload', async () => {
    const existingImages = ['https://example.com/existing.jpg'];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { url: 'https://example.com/new1.jpg', key: 'new1.jpg' },
        { url: 'https://example.com/new2.jpg', key: 'new2.jpg' },
      ],
    });

    const { container } = render(<ImageUploader images={existingImages} onChange={mockOnChange} />);

    const files = [
      new File(['content1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['content2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith([
        'https://example.com/existing.jpg',
        'https://example.com/new1.jpg',
        'https://example.com/new2.jpg',
      ]);
    });
  });
});
