import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComparisonBar } from '../comparison-bar';
import * as ComparisonContext from '@/context/ComparisonContext';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ComparisonBar', () => {
  const mockRemoveFromComparison = vi.fn();
  const mockClearComparison = vi.fn();

  const mockComparisonProperties = [
    {
      id: 'prop-1',
      title: 'Property 1',
      price: 100000,
      imageUrl: 'https://example.com/image1.jpg',
    },
    {
      id: 'prop-2',
      title: 'Property 2',
      price: 150000,
      imageUrl: 'https://example.com/image2.jpg',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ComparisonContext, 'useComparison').mockReturnValue({
      comparisonProperties: mockComparisonProperties,
      addToComparison: vi.fn(),
      removeFromComparison: mockRemoveFromComparison,
      clearComparison: mockClearComparison,
      isInComparison: vi.fn(),
    });
  });

  it('should not render when no properties in comparison', () => {
    vi.spyOn(ComparisonContext, 'useComparison').mockReturnValue({
      comparisonProperties: [],
      addToComparison: vi.fn(),
      removeFromComparison: vi.fn(),
      clearComparison: vi.fn(),
      isInComparison: vi.fn(),
    });

    const { container } = render(<ComparisonBar />);
    expect(container.firstChild).toBeNull();
  });

  it('should render comparison bar with properties', () => {
    render(<ComparisonBar />);

    expect(screen.getByText('Сравнение (2/4):')).toBeInTheDocument();
    expect(screen.getByText('Property 1')).toBeInTheDocument();
    expect(screen.getByText('Property 2')).toBeInTheDocument();
    expect(screen.getByText('100 000 у.е.')).toBeInTheDocument();
    expect(screen.getByText('150 000 у.е.')).toBeInTheDocument();
  });

  it('should display property images', () => {
    render(<ComparisonBar />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
    expect(images[0]).toHaveAttribute('alt', 'Property 1');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
    expect(images[1]).toHaveAttribute('alt', 'Property 2');
  });

  it('should handle property without image', () => {
    const propertiesWithoutImages = [
      {
        id: 'prop-1',
        title: 'Property 1',
        price: 100000,
        imageUrl: undefined,
      },
    ];

    vi.spyOn(ComparisonContext, 'useComparison').mockReturnValue({
      comparisonProperties: propertiesWithoutImages,
      addToComparison: vi.fn(),
      removeFromComparison: mockRemoveFromComparison,
      clearComparison: mockClearComparison,
      isInComparison: vi.fn(),
    });

    render(<ComparisonBar />);

    expect(screen.getByText('Property 1')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('should call removeFromComparison when X button is clicked', () => {
    render(<ComparisonBar />);

    const removeButtons = screen.getAllByTitle('Убрать');
    expect(removeButtons).toHaveLength(2);

    fireEvent.click(removeButtons[0]);

    expect(mockRemoveFromComparison).toHaveBeenCalledWith('prop-1');
  });

  it('should call clearComparison when clear all button is clicked', () => {
    render(<ComparisonBar />);

    const clearButton = screen.getByText('Очистить всё');
    fireEvent.click(clearButton);

    expect(mockClearComparison).toHaveBeenCalled();
  });

  it('should navigate to compare page when compare button is clicked', () => {
    render(<ComparisonBar />);

    const compareButton = screen.getByRole('button', { name: /сравнить/i });
    fireEvent.click(compareButton);

    expect(mockPush).toHaveBeenCalledWith('/compare');
  });

  it('should disable compare button when less than 2 properties', () => {
    vi.spyOn(ComparisonContext, 'useComparison').mockReturnValue({
      comparisonProperties: [mockComparisonProperties[0]],
      addToComparison: vi.fn(),
      removeFromComparison: mockRemoveFromComparison,
      clearComparison: mockClearComparison,
      isInComparison: vi.fn(),
    });

    render(<ComparisonBar />);

    const compareButton = screen.getByRole('button', { name: /сравнить/i });
    expect(compareButton).toBeDisabled();
  });

  it('should enable compare button when 2 or more properties', () => {
    render(<ComparisonBar />);

    const compareButton = screen.getByRole('button', { name: /сравнить/i });
    expect(compareButton).not.toBeDisabled();
  });

  it('should show correct count when multiple properties added', () => {
    const fourProperties = [
      ...mockComparisonProperties,
      {
        id: 'prop-3',
        title: 'Property 3',
        price: 200000,
        imageUrl: 'https://example.com/image3.jpg',
      },
      {
        id: 'prop-4',
        title: 'Property 4',
        price: 250000,
        imageUrl: 'https://example.com/image4.jpg',
      },
    ];

    vi.spyOn(ComparisonContext, 'useComparison').mockReturnValue({
      comparisonProperties: fourProperties,
      addToComparison: vi.fn(),
      removeFromComparison: mockRemoveFromComparison,
      clearComparison: mockClearComparison,
      isInComparison: vi.fn(),
    });

    render(<ComparisonBar />);

    expect(screen.getByText('Сравнение (4/4):')).toBeInTheDocument();
  });

  it('should truncate long property titles', () => {
    const longTitleProperty = [
      {
        id: 'prop-1',
        title: 'Very Long Property Title That Should Be Truncated Because It Is Too Long',
        price: 100000,
        imageUrl: 'https://example.com/image1.jpg',
      },
    ];

    vi.spyOn(ComparisonContext, 'useComparison').mockReturnValue({
      comparisonProperties: longTitleProperty,
      addToComparison: vi.fn(),
      removeFromComparison: mockRemoveFromComparison,
      clearComparison: mockClearComparison,
      isInComparison: vi.fn(),
    });

    render(<ComparisonBar />);

    const titleElement = screen.getByText(
      'Very Long Property Title That Should Be Truncated Because It Is Too Long',
    );
    expect(titleElement).toHaveClass('truncate');
    expect(titleElement).toHaveClass('max-w-[200px]');
  });

  it('should format prices correctly', () => {
    const propertiesWithDifferentPrices = [
      {
        id: 'prop-1',
        title: 'Property 1',
        price: 1000,
        imageUrl: 'https://example.com/image1.jpg',
      },
      {
        id: 'prop-2',
        title: 'Property 2',
        price: 1000000,
        imageUrl: 'https://example.com/image2.jpg',
      },
    ];

    vi.spyOn(ComparisonContext, 'useComparison').mockReturnValue({
      comparisonProperties: propertiesWithDifferentPrices,
      addToComparison: vi.fn(),
      removeFromComparison: mockRemoveFromComparison,
      clearComparison: mockClearComparison,
      isInComparison: vi.fn(),
    });

    render(<ComparisonBar />);

    expect(screen.getByText('1 000 у.е.')).toBeInTheDocument();
    expect(screen.getByText('1 000 000 у.е.')).toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    render(<ComparisonBar />);

    const container = screen.getByText('Сравнение (2/4):').closest('div');
    expect(container?.parentElement?.parentElement?.parentElement).toHaveClass(
      'fixed',
      'bottom-0',
      'left-0',
      'right-0',
      'bg-white',
      'border-t',
      'shadow-lg',
      'z-50',
    );
  });

  it('should display Scale icon', () => {
    render(<ComparisonBar />);

    const scaleIcon = screen.getByText('Сравнение (2/4):').previousElementSibling;
    expect(scaleIcon).toHaveClass('text-blue-600');
  });

  it('should allow horizontal scrolling for many properties', () => {
    const manyProperties = Array.from({ length: 4 }, (_, i) => ({
      id: `prop-${i + 1}`,
      title: `Property ${i + 1}`,
      price: 100000 * (i + 1),
      imageUrl: `https://example.com/image${i + 1}.jpg`,
    }));

    vi.spyOn(ComparisonContext, 'useComparison').mockReturnValue({
      comparisonProperties: manyProperties,
      addToComparison: vi.fn(),
      removeFromComparison: mockRemoveFromComparison,
      clearComparison: mockClearComparison,
      isInComparison: vi.fn(),
    });

    render(<ComparisonBar />);

    const scrollContainer = screen.getByText('Property 1').closest('div')?.parentElement;
    expect(scrollContainer).toHaveClass('overflow-x-auto');
  });
});
