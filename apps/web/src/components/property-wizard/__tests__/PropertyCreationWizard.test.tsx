import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import PropertyCreationWizard from '../PropertyCreationWizard';
import '@testing-library/jest-dom';

// Mock all wizard step components
vi.mock('../steps/Step1PropertyType', () => ({
  default: ({ formData, setFormData }: any) => <div data-testid="step1">Step 1 Content</div>
}));
vi.mock('../steps/Step2Location', () => ({
  default: ({ formData, setFormData }: any) => <div data-testid="step2">Step 2 Content</div>
}));
vi.mock('../steps/Step3BasicInfo', () => ({
  default: ({ formData, setFormData }: any) => <div data-testid="step3">Step 3 Content</div>
}));
vi.mock('../steps/Step4BuildingFeatures', () => ({
  default: ({ formData, setFormData }: any) => <div data-testid="step4">Step 4 Content</div>
}));
vi.mock('../steps/Step5PhotosDescription', () => ({
  default: ({ formData, setFormData }: any) => <div data-testid="step5">Step 5 Content</div>
}));
vi.mock('../steps/Step6Review', () => ({
  default: ({ formData, setFormData }: any) => <div data-testid="step6">Step 6 Content</div>
}));

// Mock @/i18n/routing (used by PropertyCreationWizard)
vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  Link: ({ children, href, ...props }: any) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
}));

// Mock next/navigation (for child components)
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

describe('PropertyCreationWizard', () => {
  const renderWizard = () => {
    return render(
      <NextIntlClientProvider locale="ru" messages={messages}>
        <PropertyCreationWizard />
      </NextIntlClientProvider>
    );
  };

  describe('Wizard Navigation', () => {
    it('should render step 1 initially', () => {
      renderWizard();
      // Check for the step progress text instead of heading
      expect(screen.getByText('Шаг 1 из 6')).toBeInTheDocument();
      // Check that property type buttons are rendered
      expect(screen.getByRole('button', { name: /Квартира/i })).toBeInTheDocument();
    });

    it('should show progress bar at 0% on step 1', () => {
      renderWizard();
      const progressBar = screen.getByText('Шаг 1 из 6').parentElement?.querySelector('div[style*="width"]');
      expect(progressBar).toHaveStyle({ width: '16.666666666666664%' }); // 1/6
    });

    it('should disable back button on first step', () => {
      renderWizard();
      const backButtons = screen.getAllByText('Назад');
      const backButton = backButtons.find(btn => btn.closest('button'));
      expect(backButton?.closest('button')).toBeDisabled();
    });

    it('should navigate to next step when validation passes', async () => {
      renderWizard();

      // Select property type (look for button containing Russian text)
      const apartmentButton = screen.getByRole('button', { name: /Квартира/i });
      fireEvent.click(apartmentButton);

      // Select listing type
      const saleButton = screen.getByRole('button', { name: /Продажа/i });
      fireEvent.click(saleButton);

      // Click next
      const nextButton = screen.getByRole('button', { name: /Далее/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Шаг 2 из 6')).toBeInTheDocument();
      });
    });

    it('should not navigate if validation fails', () => {
      renderWizard();

      // Try to click next without selecting anything
      const nextButton = screen.getByRole('button', { name: /Далее/i });
      fireEvent.click(nextButton);

      // Should stay on step 1 - verify by checking apartment button is still there
      expect(screen.getByRole('button', { name: /Квартира/i })).toBeInTheDocument();
      expect(screen.getByText('Шаг 1 из 6')).toBeInTheDocument();
    });

    it('should navigate back to previous step', async () => {
      renderWizard();

      // Navigate to step 2
      const apartmentButton = screen.getByRole('button', { name: /Квартира/i });
      fireEvent.click(apartmentButton);
      const saleButton = screen.getByRole('button', { name: /Продажа/i });
      fireEvent.click(saleButton);
      const nextButton = screen.getByRole('button', { name: /Далее/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Шаг 2 из 6')).toBeInTheDocument();
      });

      // Go back
      const backButtons = screen.getAllByText('Назад');
      const backButton = backButtons.find(btn => btn.closest('button') && !btn.closest('button')?.disabled);
      fireEvent.click(backButton!.closest('button')!);

      expect(screen.getByText('Шаг 1 из 6')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Квартира/i })).toBeInTheDocument();
    });
  });

  describe('Draft Saving', () => {
    it('should save draft to localStorage', async () => {
      renderWizard();

      // Fill step 1
      const apartmentButton = screen.getByRole('button', { name: /Квартира/i });
      fireEvent.click(apartmentButton);

      // Click save draft
      const saveDraftButton = screen.getByRole('button', { name: /Сохранить/i });
      fireEvent.click(saveDraftButton);

      await waitFor(() => {
        const savedDraft = localStorageMock.getItem('property_creation_draft_user_123');
        expect(savedDraft).toBeTruthy();
        const parsed = JSON.parse(savedDraft!);
        expect(parsed.formData.propertyType).toBe('APARTMENT');
      });
    });

    it('should load draft from localStorage on mount', () => {
      // Pre-populate localStorage with draft
      const draft = {
        formData: {
          propertyType: 'HOUSE',
          listingType: 'RENT_LONG',
          city: 'Samarkand',
        },
        currentStep: 2,
        savedAt: new Date().toISOString(),
      };
      localStorageMock.setItem('property_creation_draft_user_123', JSON.stringify(draft));

      renderWizard();

      // Should restore to step 2
      expect(screen.getByText('Шаг 2 из 6')).toBeInTheDocument();
    });

    it('should clear draft when delete is clicked', async () => {
      renderWizard();

      // Add some data
      const apartmentButton = screen.getByRole('button', { name: /Квартира/i });
      fireEvent.click(apartmentButton);

      // Save draft
      const saveDraftButton = screen.getByRole('button', { name: /Сохранить/i });
      fireEvent.click(saveDraftButton);

      await waitFor(() => {
        expect(localStorageMock.getItem('property_creation_draft_user_123')).toBeTruthy();
      });

      // Delete draft
      const deleteDraftButtons = screen.getAllByRole('button', { name: /Удалить/i });
      fireEvent.click(deleteDraftButtons[0]);

      // Confirm deletion in modal
      await waitFor(() => {
        const confirmButtons = screen.getAllByRole('button', { name: /Удалить черновик/i });
        fireEvent.click(confirmButtons[confirmButtons.length - 1]);
      });

      await waitFor(() => {
        expect(localStorageMock.getItem('property_creation_draft_user_123')).toBeNull();
        // Should reset to step 1
        expect(screen.getByText('Шаг 1 из 6')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields on each step', () => {
      renderWizard();

      // Step 1 - try to proceed without selections
      const nextButton = screen.getByText('Далее');
      fireEvent.click(nextButton);

      // Should still be on step 1
      expect(screen.getByText('Шаг 1 из 6')).toBeInTheDocument();
    });

    it('should show validation errors for price', async () => {
      renderWizard();

      // Navigate to step 3
      // ... (fill steps 1 and 2)

      // Try to enter invalid price
      const priceInput = screen.getByLabelText('Price');
      fireEvent.change(priceInput, { target: { value: '-100' } });

      const nextButton = screen.getByText('Далее');
      fireEvent.click(nextButton);

      expect(screen.getByText('Enter valid price')).toBeInTheDocument();
    });

    it('should validate minimum description length', async () => {
      renderWizard();

      // Navigate to step 5
      // ...

      const descriptionInput = screen.getByLabelText('Description');
      fireEvent.change(descriptionInput, { target: { value: 'Short' } });

      expect(screen.getByText(/Минимум 50 символов/)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should submit form data to API', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'property-123', title: 'Test Property' }),
      });

      renderWizard();

      // Fill all required fields and navigate to step 6
      // ...

      // Click publish
      const publishButton = screen.getByText('Опубликовать');
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/properties'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              Authorization: 'Bearer fake-jwt-token',
            }),
          })
        );
      });
    });

    it('should show success modal after successful submission', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'property-123' }),
      });

      renderWizard();

      // Fill and submit
      // ...

      await waitFor(() => {
        expect(screen.getByText('Объявление опубликовано!')).toBeInTheDocument();
      });
    });

    it('should show error message on API failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid data' }),
      });

      renderWizard();

      // Fill and submit
      // ...

      await waitFor(() => {
        expect(screen.getByText(/Invalid data/)).toBeInTheDocument();
      });
    });

    it('should clear draft after successful submission', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'property-123' }),
      });

      // Pre-populate draft
      localStorageMock.setItem('property_creation_draft_user_123', JSON.stringify({}));

      renderWizard();

      // Fill and submit
      // ...

      await waitFor(() => {
        expect(localStorageMock.getItem('property_creation_draft_user_123')).toBeNull();
      });
    });
  });

  describe('Validation Modal', () => {
    it('should show validation errors modal when submitting with missing fields', async () => {
      renderWizard();

      // Navigate to final step without filling required fields
      // ...

      const publishButton = screen.getByText('Опубликовать');
      fireEvent.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText('Заполните обязательные поля')).toBeInTheDocument();
        expect(screen.getByText(/Found \d+ errors/)).toBeInTheDocument();
      });
    });

    it('should navigate to first error step when clicking "Go to step" button', async () => {
      renderWizard();

      // Trigger validation modal
      // ...

      const goToStepButton = screen.getByText(/Перейти к шагу/);
      fireEvent.click(goToStepButton);

      // Should navigate to the step with errors
      expect(screen.queryByText('Заполните обязательные поля')).not.toBeInTheDocument();
    });
  });

  describe('Auto-save', () => {
    it('should auto-save draft every 30 seconds', async () => {
      vi.useFakeTimers();

      renderWizard();

      // Fill some data
      const apartmentButton = screen.getByRole('button', { name: /Квартира/i });
      fireEvent.click(apartmentButton);

      // Fast-forward 30 seconds
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        const savedDraft = localStorageMock.getItem('property_creation_draft_user_123');
        expect(savedDraft).toBeTruthy();
      });

      vi.useRealTimers();
    });
  });
});
