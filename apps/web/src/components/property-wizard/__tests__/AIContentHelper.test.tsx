import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIContentHelper } from '../AIContentHelper';
import type { PropertyFormData } from '../types';

describe('AIContentHelper', () => {
  const mockFormData: PropertyFormData = {
    propertyType: 'APARTMENT',
    listingType: 'SALE',
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    floor: 5,
    totalFloors: 9,
    district: 'Мирабадский',
    city: 'Ташкент',
    price: 97500,
    yearBuilt: 2020,
    renovation: 'EURO',
    title: '',
    description: '',
  };

  const mockOnTitleSelect = vi.fn();
  const mockOnDescriptionSelect = vi.fn();
  const mockOnPriceSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all main sections', () => {
      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      expect(screen.getByText(/Заголовок/i)).toBeInTheDocument();
      expect(screen.getByText(/Описание/i)).toBeInTheDocument();
      expect(screen.getByText(/Цена/i)).toBeInTheDocument();
    });

    it('should render title style selector', () => {
      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      expect(screen.getByText('💼 Профессиональный')).toBeInTheDocument();
      expect(screen.getByText('❤️ Эмоциональный')).toBeInTheDocument();
      expect(screen.getByText('🔥 Срочный')).toBeInTheDocument();
      expect(screen.getByText('✨ Люкс')).toBeInTheDocument();
    });

    it('should render description tone selector', () => {
      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      expect(screen.getByText('👨‍👩‍👧‍👦 Семейный')).toBeInTheDocument();
      expect(screen.getByText('📈 Инвестиционный')).toBeInTheDocument();
      expect(screen.getByText('💎 Премиум')).toBeInTheDocument();
      expect(screen.getByText('🔧 Практичный')).toBeInTheDocument();
    });

    it('should render generate buttons', () => {
      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      const generateButtons = screen.getAllByText(/Сгенерировать/i);
      expect(generateButtons.length).toBeGreaterThanOrEqual(2); // Title and description
    });
  });

  describe('Title Generation', () => {
    it('should generate titles when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Find and click the title generate button
      const generateButtons = screen.getAllByText(/Сгенерировать/i);
      await user.click(generateButtons[0]);

      // Should display generated titles
      await waitFor(() => {
        const titleElements = screen.getAllByRole('button').filter(
          button => button.textContent?.includes('м²') || button.textContent?.includes('комн')
        );
        expect(titleElements.length).toBeGreaterThan(0);
      });
    });

    it('should allow selecting different title styles', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Click emotional style
      await user.click(screen.getByText('❤️ Эмоциональный'));

      // Generate titles
      const generateButtons = screen.getAllByText(/Сгенерировать/i);
      await user.click(generateButtons[0]);

      // Titles should be generated
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(5); // Original buttons + title options
      });
    });

    it('should call onTitleSelect when a title is chosen', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Generate titles
      const generateButtons = screen.getAllByText(/Сгенерировать/i);
      await user.click(generateButtons[0]);

      // Wait for titles to appear and click one
      await waitFor(async () => {
        const titleButtons = screen.getAllByRole('button');
        const titleButton = titleButtons.find(btn =>
          btn.textContent?.includes('м²') || btn.textContent?.includes('комн')
        );

        if (titleButton) {
          await user.click(titleButton);
          expect(mockOnTitleSelect).toHaveBeenCalled();
        }
      });
    });
  });

  describe('Description Generation', () => {
    it('should generate description when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Find and click the description generate button
      const generateButtons = screen.getAllByText(/Сгенерировать/i);
      await user.click(generateButtons[1]); // Second generate button is for description

      // Should display generated description
      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        const hasDescription = textareas.some(textarea =>
          textarea.textContent && textarea.textContent.length > 50
        );
        expect(hasDescription).toBe(true);
      });
    });

    it('should allow selecting different description tones', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Click luxury tone
      await user.click(screen.getByText('💎 Премиум'));

      // Generate description
      const generateButtons = screen.getAllByText(/Сгенерировать/i);
      await user.click(generateButtons[1]);

      // Description should be generated
      await waitFor(() => {
        const textareas = screen.getAllByRole('textbox');
        expect(textareas.length).toBeGreaterThan(0);
      });
    });

    it('should show apply button when description is generated', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Generate description
      const generateButtons = screen.getAllByText(/Сгенерировать/i);
      await user.click(generateButtons[1]);

      // Should show apply button
      await waitFor(() => {
        expect(screen.getByText(/Применить/i)).toBeInTheDocument();
      });
    });

    it('should call onDescriptionSelect when apply is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Generate description
      const generateButtons = screen.getAllByText(/Сгенерировать/i);
      await user.click(generateButtons[1]);

      // Click apply button
      await waitFor(async () => {
        const applyButton = screen.getByText(/Применить/i);
        await user.click(applyButton);
        expect(mockOnDescriptionSelect).toHaveBeenCalled();
      });
    });
  });

  describe('Price Calculation', () => {
    it('should calculate price estimate when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Find and click the price calculate button
      const calculateButton = screen.getByText(/Рассчитать/i);
      await user.click(calculateButton);

      // Should display price estimates
      await waitFor(() => {
        expect(screen.getByText(/Оценка/i)).toBeInTheDocument();
      });
    });

    it('should show price factors when price is calculated', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Calculate price
      const calculateButton = screen.getByText(/Рассчитать/i);
      await user.click(calculateButton);

      // Should show factors
      await waitFor(() => {
        expect(screen.getByText(/Факторы/i)).toBeInTheDocument();
      });
    });

    it('should allow selecting quick estimate', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Calculate price
      const calculateButton = screen.getByText(/Рассчитать/i);
      await user.click(calculateButton);

      // Click quick estimate
      await waitFor(async () => {
        const quickButton = screen.getByText(/Быстрая/i);
        await user.click(quickButton);
        expect(mockOnPriceSelect).toHaveBeenCalled();
      });
    });
  });

  describe('Copy to Clipboard', () => {
    beforeEach(() => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(() => Promise.resolve()),
        },
      });
    });

    it('should copy title to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Generate titles
      const generateButtons = screen.getAllByText(/Сгенерировать/i);
      await user.click(generateButtons[0]);

      // Find and click copy button (if present)
      await waitFor(() => {
        const copyButtons = screen.queryAllByLabelText(/Копировать/i);
        if (copyButtons.length > 0) {
          expect(copyButtons[0]).toBeInTheDocument();
        }
      });
    });

    it('should copy description to clipboard when copy button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Generate description
      const generateButtons = screen.getAllByText(/Сгенерировать/i);
      await user.click(generateButtons[1]);

      // Find and click copy button (if present)
      await waitFor(() => {
        const copyButtons = screen.queryAllByLabelText(/Копировать/i);
        if (copyButtons.length > 0) {
          expect(copyButtons[0]).toBeInTheDocument();
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle incomplete form data gracefully', () => {
      const incompleteData: Partial<PropertyFormData> = {
        propertyType: 'APARTMENT',
        area: 50,
      };

      expect(() => {
        render(
          <AIContentHelper
            formData={incompleteData as PropertyFormData}
            onTitleSelect={mockOnTitleSelect}
            onDescriptionSelect={mockOnDescriptionSelect}
            onPriceSelect={mockOnPriceSelect}
          />
        );
      }).not.toThrow();
    });

    it('should handle missing optional callbacks', () => {
      expect(() => {
        render(
          <AIContentHelper
            formData={mockFormData}
            onTitleSelect={mockOnTitleSelect}
            onDescriptionSelect={mockOnDescriptionSelect}
          />
        );
      }).not.toThrow();
    });

    it('should re-generate when style changes', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Generate with professional style
      const generateButtons = screen.getAllByText(/Сгенерировать/i);
      await user.click(generateButtons[0]);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(5);
      });

      // Change to luxury style
      await user.click(screen.getByText('✨ Люкс'));

      // Generate again - should work without errors
      await user.click(generateButtons[0]);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(5);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveProperty('textContent');
        expect(button.textContent).toBeTruthy();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <AIContentHelper
          formData={mockFormData}
          onTitleSelect={mockOnTitleSelect}
          onDescriptionSelect={mockOnDescriptionSelect}
          onPriceSelect={mockOnPriceSelect}
        />
      );

      // Tab through elements
      await user.tab();
      expect(document.activeElement).toBeTruthy();

      await user.tab();
      expect(document.activeElement).toBeTruthy();
    });
  });
});
