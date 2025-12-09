import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../api';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
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
  value: mockLocalStorage,
});

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  it('makes GET request correctly', async () => {
    const mockResponse = { id: '1', name: 'Test Property' };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await api.get('/properties/1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/properties/1'),
      expect.objectContaining({
        method: 'GET',
      })
    );

    expect(result).toEqual(mockResponse);
  });

  it('makes POST request with body', async () => {
    const mockPayload = { title: 'New Property', price: 100000 };
    const mockResponse = { id: '1', ...mockPayload };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await api.post('/properties', mockPayload);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/properties'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockPayload),
      })
    );

    expect(result).toEqual(mockResponse);
  });

  it('includes authorization header when token is present', async () => {
    mockLocalStorage.setItem('token', 'test-token-123');

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await api.get('/properties');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
      })
    );
  });

  it('does not include authorization header when token is absent', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await api.get('/properties');

    const callArgs = vi.mocked(fetch).mock.calls[0][1];
    const headers = callArgs?.headers as Record<string, string>;

    expect(headers?.['Authorization']).toBeUndefined();
  });

  it('makes PUT request correctly', async () => {
    const mockPayload = { title: 'Updated Property' };
    const mockResponse = { id: '1', ...mockPayload };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await api.put('/properties/1', mockPayload);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/properties/1'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockPayload),
      })
    );

    expect(result).toEqual(mockResponse);
  });

  it('makes DELETE request correctly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    await api.delete('/properties/1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/properties/1'),
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('throws error when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Property not found' }),
    } as Response);

    await expect(api.get('/properties/999')).rejects.toThrow();
  });

  it('handles network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    await expect(api.get('/properties')).rejects.toThrow('Network error');
  });

  it('includes content-type header for POST requests', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await api.post('/properties', { title: 'Test' });

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('handles query parameters in URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ([]),
    } as Response);

    await api.get('/properties?page=1&limit=10');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('page=1&limit=10'),
      expect.any(Object)
    );
  });

  it('uses correct base URL from environment', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    await api.get('/properties');

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/properties');
  });
});
