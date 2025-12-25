import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// IMPORTANT: Mock next/dynamic and next/image BEFORE importing Property360Viewer
// Otherwise the component will try to use the real implementations
vi.mock('next/dynamic', () => ({
  default: (fn: any, options: any) => {
    // Return a mock component that renders immediately
    const MockComponent = ({ imageUrl, onLoad, ...props }: any) => {
      // Simulate load after mount using useEffect pattern
      const React = require('react');
      React.useEffect(() => {
        if (onLoad) {
          // Call onLoad asynchronously to simulate real behavior
          const timer = setTimeout(() => onLoad(), 10);
          return () => clearTimeout(timer);
        }
      }, [onLoad]);

      return <div data-testid="pannellum-viewer" data-image-url={imageUrl} {...props}>Mock Pannellum Viewer</div>;
    };
    return MockComponent;
  },
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, className, ...props }: any) => (
    <img src={src} alt={alt} className={className} {...props} data-testid="next-image" />
  ),
}));

import { Property360Viewer } from '../Property360Viewer';
import * as React from 'react';

console.log('Property360Viewer import:', Property360Viewer);
console.log('Property360Viewer type:', typeof Property360Viewer);

describe('Property360Viewer', () => {
  const mockTours = [
    {
      id: 'tour-1',
      url: 'https://example.com/panorama1.jpg',
      roomName: 'Living Room',
      description: 'Spacious living room with modern furniture',
    },
    {
      id: 'tour-2',
      url: 'https://example.com/panorama2.jpg',
      roomName: 'Bedroom',
      description: 'Master bedroom with en-suite bathroom',
    },
    {
      id: 'tour-3',
      url: 'https://example.com/panorama3.jpg',
      roomName: 'Kitchen',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should display empty state when tours array is empty', () => {
      // Add error boundary to catch any rendering errors
      class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
        constructor(props: any) {
          super(props);
          this.state = { hasError: false, error: null };
        }
        static getDerivedStateFromError(error: any) {
          return { hasError: true, error };
        }
        componentDidCatch(error: any, errorInfo: any) {
          console.error('Error boundary caught:', error, errorInfo);
        }
        render() {
          if (this.state.hasError) {
            return <div>Error: {this.state.error?.message || 'Unknown error'}</div>;
          }
          return this.props.children;
        }
      }

      const { container, debug } = render(
        <ErrorBoundary>
          <Property360Viewer tours={[]} />
        </ErrorBoundary>
      );
      console.log('Empty state HTML:', container.innerHTML);
      debug();

      expect(screen.getByText('No 360° tours available')).toBeInTheDocument();
    });

    it('should display empty state when tours is undefined', () => {
      render(<Property360Viewer tours={undefined as any} />);

      expect(screen.getByText('No 360° tours available')).toBeInTheDocument();
    });

    it('should display empty state when tours is null', () => {
      render(<Property360Viewer tours={null as any} />);

      expect(screen.getByText('No 360° tours available')).toBeInTheDocument();
    });
  });

  describe('Single Tour', () => {
    it('should render viewer with single tour', () => {
      render(<Property360Viewer tours={[mockTours[0]]} />);

      expect(screen.getByTestId('pannellum-viewer')).toBeInTheDocument();
      expect(screen.getByText('Living Room')).toBeInTheDocument();
      expect(screen.getByText('Spacious living room with modern furniture')).toBeInTheDocument();
    });

    it('should display tour counter as 1/1', () => {
      render(<Property360Viewer tours={[mockTours[0]]} />);

      expect(screen.getByText('1 / 1')).toBeInTheDocument();
    });

    it('should not show navigation arrows for single tour', () => {
      render(<Property360Viewer tours={[mockTours[0]]} />);

      expect(screen.queryByLabelText('Previous panorama')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next panorama')).not.toBeInTheDocument();
    });

    it('should not show thumbnails for single tour', () => {
      render(<Property360Viewer tours={[mockTours[0]]} />);

      // Thumbnail grid should not be rendered
      expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Tours Navigation', () => {
    it('should render navigation arrows for multiple tours', () => {
      render(<Property360Viewer tours={mockTours} />);

      expect(screen.getByLabelText('Previous panorama')).toBeInTheDocument();
      expect(screen.getByLabelText('Next panorama')).toBeInTheDocument();
    });

    it('should display tour counter', () => {
      render(<Property360Viewer tours={mockTours} />);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('should navigate to next tour on next button click', async () => {
      render(<Property360Viewer tours={mockTours} />);

      const nextButton = screen.getByLabelText('Next panorama');
      await userEvent.click(nextButton);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
      // Use getAllByText since room name appears in both info panel and thumbnail
      expect(screen.getAllByText('Bedroom').length).toBeGreaterThan(0);
    });

    it('should navigate to previous tour on previous button click', async () => {
      render(<Property360Viewer tours={mockTours} />);

      // First go to second tour
      const nextButton = screen.getByLabelText('Next panorama');
      await userEvent.click(nextButton);

      // Then go back
      const prevButton = screen.getByLabelText('Previous panorama');
      await userEvent.click(prevButton);

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      // Use getAllByText since room name appears in both info panel and thumbnail
      expect(screen.getAllByText('Living Room').length).toBeGreaterThan(0);
    });

    it('should wrap around to last tour when pressing previous on first', async () => {
      render(<Property360Viewer tours={mockTours} />);

      const prevButton = screen.getByLabelText('Previous panorama');
      await userEvent.click(prevButton);

      expect(screen.getByText('3 / 3')).toBeInTheDocument();
      // Kitchen might appear multiple times
      expect(screen.getAllByText('Kitchen').length).toBeGreaterThan(0);
    });

    it('should wrap around to first tour when pressing next on last', async () => {
      render(<Property360Viewer tours={mockTours} />);

      const nextButton = screen.getByLabelText('Next panorama');

      // Navigate to end
      await userEvent.click(nextButton);
      await userEvent.click(nextButton);
      expect(screen.getByText('3 / 3')).toBeInTheDocument();

      // Click next again to wrap
      await userEvent.click(nextButton);
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });

  describe('Thumbnail Navigation', () => {
    it('should render thumbnails for multiple tours', () => {
      render(<Property360Viewer tours={mockTours} />);

      // Should have thumbnail buttons for all tours
      const allButtons = screen.getAllByRole('button');
      // We have 3 tours, plus navigation buttons (prev/next) and control buttons
      expect(allButtons.length).toBeGreaterThanOrEqual(3);
    });

    it('should navigate to tour when thumbnail is clicked', async () => {
      render(<Property360Viewer tours={mockTours} />);

      // Find and click the Bedroom thumbnail by title
      const bedroomThumbnail = screen.getByTitle('Bedroom');
      await userEvent.click(bedroomThumbnail);

      expect(screen.getByText('2 / 3')).toBeInTheDocument();
      // Room name appears in multiple places
      expect(screen.getAllByText('Bedroom').length).toBeGreaterThan(0);
    });
  });

  describe('Auto-Rotate Toggle', () => {
    it('should have auto-rotate button', () => {
      render(<Property360Viewer tours={mockTours} />);

      expect(screen.getByLabelText('Toggle auto-rotate')).toBeInTheDocument();
    });

    it('should toggle auto-rotate state on button click', async () => {
      render(<Property360Viewer tours={mockTours} />);

      const autoRotateButton = screen.getByLabelText('Toggle auto-rotate');

      // Initial state - not rotating
      expect(autoRotateButton).not.toHaveClass('bg-blue-600');

      // Click to enable
      await userEvent.click(autoRotateButton);
      expect(autoRotateButton).toHaveClass('bg-blue-600');

      // Click to disable
      await userEvent.click(autoRotateButton);
      expect(autoRotateButton).not.toHaveClass('bg-blue-600');
    });
  });

  describe('Fullscreen Toggle', () => {
    it('should have fullscreen button', () => {
      render(<Property360Viewer tours={mockTours} />);

      expect(screen.getByLabelText('Toggle fullscreen')).toBeInTheDocument();
    });

    it('should show close button when in fullscreen mode', async () => {
      render(<Property360Viewer tours={mockTours} />);

      const fullscreenButton = screen.getByLabelText('Toggle fullscreen');
      await userEvent.click(fullscreenButton);

      expect(screen.getByLabelText('Exit fullscreen')).toBeInTheDocument();
    });

    it('should exit fullscreen when close button is clicked', async () => {
      render(<Property360Viewer tours={mockTours} />);

      // Enter fullscreen
      const fullscreenButton = screen.getByLabelText('Toggle fullscreen');
      await userEvent.click(fullscreenButton);

      // Exit fullscreen
      const exitButton = screen.getByLabelText('Exit fullscreen');
      await userEvent.click(exitButton);

      expect(screen.queryByLabelText('Exit fullscreen')).not.toBeInTheDocument();
    });

    it('should hide thumbnails in fullscreen mode', async () => {
      render(<Property360Viewer tours={mockTours} />);

      // Enter fullscreen
      const fullscreenButton = screen.getByLabelText('Toggle fullscreen');
      await userEvent.click(fullscreenButton);

      // Thumbnails should be hidden
      const thumbnailGrid = document.querySelector('.grid.grid-cols-3');
      expect(thumbnailGrid).not.toBeInTheDocument();
    });
  });

  describe('Room Info Display', () => {
    it('should display room name when available', () => {
      render(<Property360Viewer tours={mockTours} />);

      // Room name may appear in multiple places (info panel + thumbnails)
      expect(screen.getAllByText('Living Room').length).toBeGreaterThan(0);
    });

    it('should display room description when available', () => {
      render(<Property360Viewer tours={mockTours} />);

      expect(screen.getByText('Spacious living room with modern furniture')).toBeInTheDocument();
    });

    it('should handle tour without description', () => {
      render(<Property360Viewer tours={[mockTours[2]]} />);

      expect(screen.getByText('Kitchen')).toBeInTheDocument();
      // Should not crash when description is undefined
    });

    it('should display help text', () => {
      render(<Property360Viewer tours={mockTours} />);

      expect(screen.getByText('Drag to look around')).toBeInTheDocument();
    });
  });

  describe('Help Section', () => {
    it('should display how-to section when not in fullscreen', () => {
      render(<Property360Viewer tours={mockTours} />);

      expect(screen.getByText('How to explore the 360° tour')).toBeInTheDocument();
      expect(screen.getByText('Drag to look around in any direction')).toBeInTheDocument();
      expect(screen.getByText('Scroll or pinch to zoom in/out')).toBeInTheDocument();
      expect(screen.getByText('Click fullscreen for immersive view')).toBeInTheDocument();
      expect(screen.getByText('Use arrows or thumbnails to switch rooms')).toBeInTheDocument();
    });

    it('should hide help section in fullscreen mode', async () => {
      render(<Property360Viewer tours={mockTours} />);

      // Enter fullscreen
      const fullscreenButton = screen.getByLabelText('Toggle fullscreen');
      await userEvent.click(fullscreenButton);

      expect(screen.queryByText('How to explore the 360° tour')).not.toBeInTheDocument();
    });
  });

  describe('Zoom Hints', () => {
    it('should display scroll to zoom hint', () => {
      render(<Property360Viewer tours={mockTours} />);

      expect(screen.getByText('Scroll to zoom')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should exit fullscreen on Escape key', async () => {
      render(<Property360Viewer tours={mockTours} />);

      // Enter fullscreen
      const fullscreenButton = screen.getByLabelText('Toggle fullscreen');
      await userEvent.click(fullscreenButton);

      expect(screen.getByLabelText('Exit fullscreen')).toBeInTheDocument();

      // Press Escape
      const container = document.querySelector('[tabindex="0"]');
      if (container) {
        fireEvent.keyDown(container, { key: 'Escape' });
      }

      await waitFor(() => {
        expect(screen.queryByLabelText('Exit fullscreen')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator initially', () => {
      render(<Property360Viewer tours={mockTours} />);

      // The component has isLoading state that shows loader
      const loaders = document.querySelectorAll('.animate-spin');
      expect(loaders.length).toBeGreaterThan(0);
    });
  });

  describe('Pannellum Integration', () => {
    it('should pass correct image URL to viewer', () => {
      render(<Property360Viewer tours={mockTours} />);

      const viewer = screen.getByTestId('pannellum-viewer');
      expect(viewer.getAttribute('data-image-url')).toBe(mockTours[0].url);
    });

    it('should change image URL when tour changes', async () => {
      render(<Property360Viewer tours={mockTours} />);

      const nextButton = screen.getByLabelText('Next panorama');
      await userEvent.click(nextButton);

      await waitFor(() => {
        const viewer = screen.getByTestId('pannellum-viewer');
        expect(viewer.getAttribute('data-image-url')).toBe(mockTours[1].url);
      });
    });
  });
});
