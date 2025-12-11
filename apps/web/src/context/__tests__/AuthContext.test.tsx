import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { ReactNode } from 'react';

// Mock getMe function
vi.mock('@/lib/auth', () => ({
  getMe: vi.fn(),
  getToken: vi.fn(() => 'mock-token'),
  isAuthenticated: vi.fn(() => true),
  logout: vi.fn(() => {
    localStorage.removeItem('token');
  }),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/test',
}));

// Test component that uses AuthContext
function TestComponent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <div>User: {user.firstName} {user.lastName}</div>;
  }

  return <div>No user</div>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('provides loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('provides user data when authenticated', async () => {
    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'USER',
    };

    const { getMe } = await import('@/lib/auth');
    vi.mocked(getMe).mockResolvedValue(mockUser as any);

    localStorage.setItem('token', 'mock-token');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('User: John Doe')).toBeInTheDocument();
    });
  });

  it('shows no user when not authenticated', async () => {
    const { getMe } = await import('@/lib/auth');
    vi.mocked(getMe).mockRejectedValue(new Error('Not authenticated'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No user')).toBeInTheDocument();
    });
  });

  it('handles refreshUser correctly', async () => {
    const mockUser = {
      id: 'user-1',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      role: 'USER',
    };

    const { getMe } = await import('@/lib/auth');
    vi.mocked(getMe).mockResolvedValue(mockUser as any);

    localStorage.setItem('token', 'mock-token');

    function TestRefreshComponent() {
      const { user, loading, refreshUser } = useAuth();

      if (loading) return <div>Loading...</div>;

      return (
        <div>
          <div>User: {user?.firstName || 'None'}</div>
          <button onClick={refreshUser}>Refresh</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <TestRefreshComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('User: Jane')).toBeInTheDocument();
    });
  });

  it('handles logout correctly', async () => {
    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'USER',
    };

    const { getMe, logout } = await import('@/lib/auth');
    vi.mocked(getMe).mockResolvedValue(mockUser as any);

    localStorage.setItem('token', 'mock-token');

    function TestLogoutComponent() {
      const { user, loading, logout: handleLogout } = useAuth();

      if (loading) return <div>Loading...</div>;

      return (
        <div>
          <div>User: {user?.firstName || 'None'}</div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      );
    }

    const { getByText } = render(
      <AuthProvider>
        <TestLogoutComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('User: John')).toBeInTheDocument();
    });

    // Click logout
    getByText('Logout').click();

    await waitFor(() => {
      expect(vi.mocked(logout)).toHaveBeenCalled();
    });
  });

  it('provides correct isAuthenticated value', async () => {
    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'USER',
    };

    const { getMe } = await import('@/lib/auth');
    vi.mocked(getMe).mockResolvedValue(mockUser as any);

    localStorage.setItem('token', 'mock-token');

    function TestAuthComponent() {
      const { isAuthenticated, loading } = useAuth();

      if (loading) return <div>Loading...</div>;

      return <div>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>;
    }

    render(
      <AuthProvider>
        <TestAuthComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Authenticated')).toBeInTheDocument();
    });
  });
});
