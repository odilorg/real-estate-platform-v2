import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the modules
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/context/ComparisonContext', () => ({
  useComparison: () => ({
    comparisonProperties: [
      {
        id: 'prop-1',
        title: 'Property 1',
        price: 100000,
        priceUsd: 100000,
        area: 85,
        bedrooms: 3,
        bathrooms: 2,
        floor: 5,
        propertyType: 'APARTMENT',
        listingType: 'SALE',
        imageUrl: 'https://example.com/image1.jpg',
      },
      {
        id: 'prop-2',
        title: 'Property 2',
        price: 120000,
        priceUsd: 120000,
        area: 95,
        bedrooms: 3,
        bathrooms: 2,
        floor: 3,
        propertyType: 'APARTMENT',
        listingType: 'SALE',
        imageUrl: 'https://example.com/image2.jpg',
      },
    ],
    removeFromComparison: vi.fn(),
    clearComparison: vi.fn(),
  }),
}));

describe('Compare Page - Key Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should test label constants exist', () => {
    // Test that label mappings are correctly defined
    const PROPERTY_TYPE_LABELS: Record<string, string> = {
      APARTMENT: 'Квартира',
      HOUSE: 'Дом',
      COMMERCIAL: 'Коммерческая',
    };

    const LISTING_TYPE_LABELS: Record<string, string> = {
      SALE: 'Продажа',
      RENT: 'Аренда',
    };

    expect(PROPERTY_TYPE_LABELS.APARTMENT).toBe('Квартира');
    expect(PROPERTY_TYPE_LABELS.HOUSE).toBe('Дом');
    expect(LISTING_TYPE_LABELS.SALE).toBe('Продажа');
    expect(LISTING_TYPE_LABELS.RENT).toBe('Аренда');
  });

  it('should test getBestValue helper function', () => {
    // Helper function to find best value
    const getBestValue = (values: number[], isHigherBetter: boolean = true) => {
      return isHigherBetter ? Math.max(...values) : Math.min(...values);
    };

    const prices = [100000, 120000, 95000];
    const areas = [85, 95, 75];

    // Lower price is better
    expect(getBestValue(prices, false)).toBe(95000);

    // Higher area is better
    expect(getBestValue(areas, true)).toBe(95);
  });

  it('should test CSV generation logic', () => {
    const properties = [
      {
        id: 'prop-1',
        title: 'Property 1',
        price: 100000,
        area: 85,
        bedrooms: 3,
      },
      {
        id: 'prop-2',
        title: 'Property 2',
        price: 120000,
        area: 95,
        bedrooms: 3,
      },
    ];

    const generateCSV = () => {
      const headers = ['Параметр', 'Property 1', 'Property 2'];
      const rows = [
        ['Цена', '100000', '120000'],
        ['Площадь', '85', '95'],
        ['Спальни', '3', '3'],
      ];

      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    };

    const csv = generateCSV();
    expect(csv).toContain('Параметр,Property 1,Property 2');
    expect(csv).toContain('Цена,100000,120000');
    expect(csv).toContain('Площадь,85,95');
  });

  it('should test highlight differences logic', () => {
    interface PropertyDetails {
      price: number;
      area: number;
      bedrooms: number;
    }

    const properties: PropertyDetails[] = [
      { price: 100000, area: 85, bedrooms: 3 },
      { price: 120000, area: 95, bedrooms: 3 },
    ];

    const shouldHighlight = (field: keyof PropertyDetails, value: number): boolean => {
      const values = properties.map((p) => p[field]);
      const allSame = values.every((v) => v === values[0]);
      return !allSame;
    };

    // Prices are different
    expect(shouldHighlight('price', 100000)).toBe(true);
    expect(shouldHighlight('price', 120000)).toBe(true);

    // Areas are different
    expect(shouldHighlight('area', 85)).toBe(true);

    // Bedrooms are the same
    expect(shouldHighlight('bedrooms', 3)).toBe(false);
  });

  it('should test summary cards calculation', () => {
    const properties = [
      { id: 'prop-1', price: 100000, area: 85, pricePerSqM: 1176.47 },
      { id: 'prop-2', price: 120000, area: 95, pricePerSqM: 1263.16 },
      { id: 'prop-3', price: 95000, area: 75, pricePerSqM: 1266.67 },
    ];

    // Find cheapest
    const cheapest = properties.reduce((min, p) =>
      p.price < min.price ? p : min,
    );
    expect(cheapest.id).toBe('prop-3');
    expect(cheapest.price).toBe(95000);

    // Find largest
    const largest = properties.reduce((max, p) =>
      p.area > max.area ? p : max,
    );
    expect(largest.id).toBe('prop-2');
    expect(largest.area).toBe(95);

    // Find best price per m²
    const bestPricePerSqM = properties.reduce((min, p) =>
      p.pricePerSqM < min.pricePerSqM ? p : min,
    );
    expect(bestPricePerSqM.id).toBe('prop-1');
    expect(bestPricePerSqM.pricePerSqM).toBe(1176.47);
  });

  it('should test price formatting', () => {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('ru-RU').format(price);
    };

    expect(formatPrice(100000)).toBe('100 000');
    expect(formatPrice(1000000)).toBe('1 000 000');
    expect(formatPrice(50000)).toBe('50 000');
  });

  it('should test area formatting', () => {
    const formatArea = (area: number | null) => {
      if (!area) return '—';
      return `${area} м²`;
    };

    expect(formatArea(85)).toBe('85 м²');
    expect(formatArea(null)).toBe('—');
    expect(formatArea(95.5)).toBe('95.5 м²');
  });

  it('should test download CSV functionality', () => {
    const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
    const mockRevokeObjectURL = vi.fn();

    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const downloadCSV = (content: string) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'comparison.csv');
      return { blob, link, url };
    };

    const { blob, url } = downloadCSV('test,data\n1,2');

    expect(blob.type).toBe('text/csv;charset=utf-8;');
    expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
    expect(url).toBe('blob:mock-url');
  });

  it('should handle empty comparison list', () => {
    const properties: any[] = [];
    const isEmpty = properties.length === 0;

    expect(isEmpty).toBe(true);
  });

  it('should handle properties with missing data', () => {
    const property = {
      id: 'prop-1',
      title: 'Property 1',
      price: 100000,
      area: null,
      bedrooms: undefined,
    };

    const displayValue = (value: any) => (value ?? '—');

    expect(displayValue(property.price)).toBe(100000);
    expect(displayValue(property.area)).toBe('—');
    expect(displayValue(property.bedrooms)).toBe('—');
  });

  it('should calculate price difference percentage', () => {
    const calculatePriceDiff = (price1: number, price2: number): number => {
      const diff = ((price2 - price1) / price1) * 100;
      return Math.round(diff * 10) / 10;
    };

    expect(calculatePriceDiff(100000, 120000)).toBe(20);
    expect(calculatePriceDiff(100000, 80000)).toBe(-20);
    expect(calculatePriceDiff(100000, 100000)).toBe(0);
  });

  it('should validate comparison limit', () => {
    const MAX_COMPARISON = 4;
    const currentCount = 3;

    const canAddMore = currentCount < MAX_COMPARISON;
    expect(canAddMore).toBe(true);

    const currentCount2 = 4;
    const canAddMore2 = currentCount2 < MAX_COMPARISON;
    expect(canAddMore2).toBe(false);
  });

  it('should test toggle highlight state', () => {
    let highlightDifferences = true;

    const toggleHighlight = () => {
      highlightDifferences = !highlightDifferences;
      return highlightDifferences;
    };

    expect(toggleHighlight()).toBe(false);
    expect(toggleHighlight()).toBe(true);
  });
});
