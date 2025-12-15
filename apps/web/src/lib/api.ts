const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      // console.debug('ApiClient: Attaching token to request', endpoint);
    } else {
      console.warn('ApiClient: No token found for request', endpoint);
    }

    let fetchBody: any = undefined;

    if (body) {
      // Handle FormData separately (don't set Content-Type)
      if (body instanceof FormData) {
        fetchBody = body;
        // Don't set Content-Type header for FormData
      } else {
        headers['Content-Type'] = 'application/json';
        fetchBody = JSON.stringify(body);
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: fetchBody,
      credentials: 'include', // Include cookies for OAuth authentication
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, { method: 'POST', body, ...options });
  }

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }
}

export const api = new ApiClient(API_URL);

// Saved Search API
export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: Record<string, any>;
  notificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedSearchDto {
  name: string;
  filters: Record<string, any>;
  notificationsEnabled?: boolean;
}

export const savedSearchApi = {
  // Get all saved searches for current user
  getAll: () => api.get<SavedSearch[]>('/saved-searches'),

  // Create a new saved search
  create: (data: CreateSavedSearchDto) =>
    api.post<SavedSearch>('/saved-searches', data),

  // Delete a saved search
  delete: (id: string) =>
    api.delete<{ message: string }>(`/saved-searches/${id}`),

  // Update a saved search
  update: (id: string, data: Partial<CreateSavedSearchDto>) =>
    api.put<SavedSearch>(`/saved-searches/${id}`, data),

  // Toggle notifications for a saved search
  toggleNotifications: (id: string, enabled: boolean) =>
    api.patch<SavedSearch>(`/saved-searches/${id}/notifications`, { enabled }),
};
