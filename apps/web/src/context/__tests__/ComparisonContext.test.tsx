import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComparisonProvider, useComparison } from '../ComparisonContext';

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

// Test component
function TestComponent() {
  const {
    comparisonProperties,
    addToComparison,
    removeFromComparison,
    isInComparison,
    clearComparison,
  } = useComparison();

  return (
    <div>
      <div data-testid="count">Count: {comparisonProperties.length}</div>
      <button
        onClick={() =>
          addToComparison({
            id: 'prop-1',
            title: 'Property 1',
            price: 100000,
            imageUrl: 'https://example.com/image1.jpg',
          })
        }
      >
        Add Property 1
      </button>
      <button
        onClick={() =>
          addToComparison({
            id: 'prop-2',
            title: 'Property 2',
            price: 200000,
            imageUrl: 'https://example.com/image2.jpg',
          })
        }
      >
        Add Property 2
      </button>
      <button onClick={() => removeFromComparison('prop-1')}>
        Remove Property 1
      </button>
      <button onClick={clearComparison}>Clear All</button>
      <div data-testid="is-in-comparison-1">
        {isInComparison('prop-1') ? 'In Comparison' : 'Not In Comparison'}
      </div>
      {comparisonProperties.map((prop) => (
        <div key={prop.id} data-testid={`property-${prop.id}`}>
          {prop.title}
        </div>
      ))}
    </div>
  );
}

describe('ComparisonContext', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  it('starts with empty comparison', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 0');
  });

  it('adds property to comparison', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );

    fireEvent.click(screen.getByText('Add Property 1'));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 1');
    expect(screen.getByTestId('property-prop-1')).toHaveTextContent('Property 1');
  });

  it('adds multiple properties to comparison', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );

    fireEvent.click(screen.getByText('Add Property 1'));
    fireEvent.click(screen.getByText('Add Property 2'));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 2');
    expect(screen.getByTestId('property-prop-1')).toBeInTheDocument();
    expect(screen.getByTestId('property-prop-2')).toBeInTheDocument();
  });

  it('removes property from comparison', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );

    fireEvent.click(screen.getByText('Add Property 1'));
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 1');

    fireEvent.click(screen.getByText('Remove Property 1'));
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 0');
  });

  it('clears all properties from comparison', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );

    fireEvent.click(screen.getByText('Add Property 1'));
    fireEvent.click(screen.getByText('Add Property 2'));
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 2');

    fireEvent.click(screen.getByText('Clear All'));
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 0');
  });

  it('checks if property is in comparison', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );

    expect(screen.getByTestId('is-in-comparison-1')).toHaveTextContent('Not In Comparison');

    fireEvent.click(screen.getByText('Add Property 1'));

    expect(screen.getByTestId('is-in-comparison-1')).toHaveTextContent('In Comparison');
  });

  it('persists comparison to localStorage', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );

    fireEvent.click(screen.getByText('Add Property 1'));

    const stored = mockLocalStorage.getItem('property-comparison');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('prop-1');
  });

  it('loads comparison from localStorage on mount', () => {
    // Pre-populate localStorage
    mockLocalStorage.setItem(
      'property-comparison',
      JSON.stringify([
        {
          id: 'prop-3',
          title: 'Property 3',
          price: 300000,
          imageUrl: 'https://example.com/image3.jpg',
        },
      ])
    );

    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 1');
    expect(screen.getByTestId('property-prop-3')).toHaveTextContent('Property 3');
  });

  it('does not add duplicate properties', () => {
    render(
      <ComparisonProvider>
        <TestComponent />
      </ComparisonProvider>
    );

    fireEvent.click(screen.getByText('Add Property 1'));
    fireEvent.click(screen.getByText('Add Property 1'));

    expect(screen.getByTestId('count')).toHaveTextContent('Count: 1');
  });

  it('limits comparison to maximum 4 properties', () => {
    function TestMaxComponent() {
      const { comparisonProperties, addToComparison } = useComparison();

      return (
        <div>
          <div data-testid="count">Count: {comparisonProperties.length}</div>
          <button
            onClick={() => {
              addToComparison({ id: '1', title: 'P1', price: 100, imageUrl: '' });
              addToComparison({ id: '2', title: 'P2', price: 200, imageUrl: '' });
              addToComparison({ id: '3', title: 'P3', price: 300, imageUrl: '' });
              addToComparison({ id: '4', title: 'P4', price: 400, imageUrl: '' });
              addToComparison({ id: '5', title: 'P5', price: 500, imageUrl: '' });
            }}
          >
            Add 5 Properties
          </button>
        </div>
      );
    }

    render(
      <ComparisonProvider>
        <TestMaxComponent />
      </ComparisonProvider>
    );

    fireEvent.click(screen.getByText('Add 5 Properties'));

    // Should only have 4 properties (max limit)
    expect(screen.getByTestId('count')).toHaveTextContent('Count: 4');
  });
});
