import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';

// Mock the useAnalytics hook
const mockRefetch = vi.fn();
const mockUseAnalytics = vi.fn();

vi.mock('../hooks/useAnalytics', () => ({
  useAnalytics: () => mockUseAnalytics(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const MockIcon = ({ className, ...props }: any) => (
    <span data-testid="mock-icon" className={className} {...props} />
  );
  const LoaderIcon = ({ className }: any) => (
    <div data-testid="loader-icon" className={className}>Loading</div>
  );
  const RefreshIcon = ({ className }: any) => (
    <div data-testid="refresh-icon" className={className}>Refresh</div>
  );
  const AlertIcon = ({ className }: any) => (
    <div data-testid="alert-icon" className={className}>Alert</div>
  );

  return {
    Loader2: LoaderIcon,
    RefreshCw: RefreshIcon,
    AlertCircle: AlertIcon,
    TrendingUp: MockIcon,
    TrendingDown: MockIcon,
    DollarSign: MockIcon,
    Users: MockIcon,
    Target: MockIcon,
    Eye: MockIcon,
    Building: MockIcon,
    ArrowRight: MockIcon,
    Mail: MockIcon,
    Phone: MockIcon,
    MessageSquare: MockIcon,
    ExternalLink: MockIcon,
    ShoppingCart: MockIcon,
    Calendar: MockIcon,
    Clock: MockIcon,
    MapPin: MockIcon,
    BarChart: MockIcon,
    PieChart: MockIcon,
    Activity: MockIcon,
    ChevronRight: MockIcon,
    ChevronLeft: MockIcon,
    Check: MockIcon,
    X: MockIcon,
    Plus: MockIcon,
    Minus: MockIcon,
    Search: MockIcon,
    Filter: MockIcon,
    MoreVertical: MockIcon,
    MoreHorizontal: MockIcon,
    Settings: MockIcon,
    Trash: MockIcon,
    Edit: MockIcon,
    Copy: MockIcon,
    Download: MockIcon,
    Upload: MockIcon,
    Star: MockIcon,
    Heart: MockIcon,
    Share: MockIcon,
    Info: MockIcon,
    HelpCircle: MockIcon,
    AlertTriangle: MockIcon,
    CheckCircle: MockIcon,
    XCircle: MockIcon,
    Home: MockIcon,
    User: MockIcon,
    CreditCard: MockIcon,
    Award: MockIcon,
    Briefcase: MockIcon,
    Globe: MockIcon,
    Link: MockIcon,
  };
});

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner when data is loading', () => {
      mockUseAnalytics.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        refetch: mockRefetch,
      });

      render(<AnalyticsDashboard />);

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when loading fails', () => {
      mockUseAnalytics.mockReturnValue({
        data: null,
        loading: false,
        error: 'Failed to fetch analytics data',
        refetch: mockRefetch,
      });

      render(<AnalyticsDashboard />);

      expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch analytics data')).toBeInTheDocument();
    });

    it('should display retry button on error', () => {
      mockUseAnalytics.mockReturnValue({
        data: null,
        loading: false,
        error: 'Network error',
        refetch: mockRefetch,
      });

      render(<AnalyticsDashboard />);

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should call refetch when retry button is clicked', async () => {
      mockUseAnalytics.mockReturnValue({
        data: null,
        loading: false,
        error: 'Network error',
        refetch: mockRefetch,
      });

      render(<AnalyticsDashboard />);

      const retryButton = screen.getByText('Try Again');
      await userEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
  });
});
