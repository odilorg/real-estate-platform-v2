import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import PropertyCreationWizard from '../PropertyCreationWizard';
import '@testing-library/jest-dom';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

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

// Mock token
beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.setItem('token', 'fake-jwt-token');
});

const messages = {
  wizard: {
    defaultCity: 'Tashkent',
    steps: {
      '1': { title: 'Property Type', description: 'Select type' },
      '2': { title: 'Location', description: 'Enter location' },
      '3': { title: 'Basic Info', description: 'Price and area' },
      '4': { title: 'Building Features', description: 'Additional details' },
      '5': { title: 'Photos & Description', description: 'Add photos' },
      '6': { title: 'Review', description: 'Final review' },
    },
    validation: {
      propertyType: 'Select property type',
      listingType: 'Select listing type',
      price: 'Enter valid price',
      images: 'Upload at least one photo',
    },
    errors: {
      createFailed: 'Failed to create: {message}',
      unknownError: 'Unknown error',
      found: 'Found {count} {errors}',
      error_one: 'error',
      error_other: 'errors',
    },
  },
};

describe('PropertyCreationWizard - Smoke Tests', () => {
  const renderWizard = () => {
    return render(
      <NextIntlClientProvider locale="ru" messages={messages}>
        <PropertyCreationWizard />
      </NextIntlClientProvider>
    );
  };

  it('should render the wizard component', () => {
    renderWizard();
    expect(screen.getByText('Создать объявление')).toBeInTheDocument();
  });

  it('should show step progress indicator', () => {
    renderWizard();
    expect(screen.getByText('Шаг 1 из 6')).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    renderWizard();
    expect(screen.getAllByText('Назад').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Далее/i })).toBeInTheDocument();
  });

  it('should render draft management buttons', () => {
    renderWizard();
    expect(screen.getByRole('button', { name: /Сохранить/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Удалить/i }).length).toBeGreaterThan(0);
  });

  it('should render the current step heading', () => {
    renderWizard();
    expect(screen.getByRole('heading', { name: /Property Type/i })).toBeInTheDocument();
  });
});
