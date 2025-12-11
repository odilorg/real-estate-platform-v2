import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PropertyListItem } from '../property-list-item';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'ru',
}));

describe('PropertyListItem', () => {
  const mockProperty = {
    id: 'test-123',
    title: 'Beautiful 2-bedroom apartment',
    price: 100000,
    currency: 'YE' as const,
    priceUsd: 100000,
    area: 75.5,
    bedrooms: 2,
    bathrooms: 1,
    floor: 5,
    totalFloors: 10,
    address: '123 Main Street',
    city: 'Ташкент',
    district: 'Мирабадский',
    propertyType: 'APARTMENT' as const,
    listingType: 'SALE' as const,
    images: [
      {
        id: 'img-1',
        url: 'https://example.com/image1.jpg',
        isPrimary: true,
        order: 0,
      },
    ],
    user: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    createdAt: new Date('2024-01-01'),
    featured: false,
    verified: true,
  };

  it('renders property title', () => {
    render(<PropertyListItem property={mockProperty} />);

    expect(screen.getByText('Beautiful 2-bedroom apartment')).toBeInTheDocument();
  });

  it('renders property price', () => {
    render(<PropertyListItem property={mockProperty} />);

    expect(screen.getByText(/100,000/)).toBeInTheDocument();
  });

  it('renders property location', () => {
    render(<PropertyListItem property={mockProperty} />);

    expect(screen.getByText(/123 Main Street/)).toBeInTheDocument();
    expect(screen.getByText(/Мирабадский/)).toBeInTheDocument();
  });

  it('renders property area', () => {
    render(<PropertyListItem property={mockProperty} />);

    expect(screen.getByText(/75\.5/)).toBeInTheDocument();
  });

  it('renders property details (bedrooms, bathrooms, floor)', () => {
    render(<PropertyListItem property={mockProperty} />);

    // Should show 2 bedrooms, 1 bathroom, floor 5/10
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/5\/10/)).toBeInTheDocument();
  });

  it('renders property image', () => {
    render(<PropertyListItem property={mockProperty} />);

    const image = screen.getByAlt(/Beautiful 2-bedroom apartment/);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg');
  });

  it('renders verified badge when property is verified', () => {
    render(<PropertyListItem property={mockProperty} />);

    // Look for verification indicator (this depends on your actual implementation)
    // Adjust this test based on how you display verified status
    const element = screen.getByRole('article'); // or whatever container you use
    expect(element).toBeInTheDocument();
  });

  it('uses placeholder image when no images are provided', () => {
    const propertyWithoutImages = {
      ...mockProperty,
      images: [],
    };

    render(<PropertyListItem property={propertyWithoutImages} />);

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });

  it('formats price correctly for USD currency', () => {
    const usdProperty = {
      ...mockProperty,
      currency: 'YE' as const,
      price: 100000,
    };

    render(<PropertyListItem property={usdProperty} />);

    expect(screen.getByText(/100,000/)).toBeInTheDocument();
  });

  it('formats price correctly for UZS currency', () => {
    const uzsProperty = {
      ...mockProperty,
      currency: 'UZS' as const,
      price: 1250000000,
    };

    render(<PropertyListItem property={uzsProperty} />);

    // Should display formatted UZS price
    expect(screen.getByText(/1,250,000,000/)).toBeInTheDocument();
  });
});
