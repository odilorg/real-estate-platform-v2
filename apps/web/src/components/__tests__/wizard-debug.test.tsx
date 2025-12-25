import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PropertyCreationWizard } from '../property-wizard/PropertyCreationWizard';
import { NextIntlClientProvider } from 'next-intl';

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: '123', email: 'test@test.com', name: 'Test User' },
    isLoading: false,
    isAuthenticated: true,
  }),
}));

describe('PropertyCreationWizard Debug', () => {
  it('should render and log DOM structure', () => {
    const { container, debug } = render(
      <NextIntlClientProvider locale="ru">
        <PropertyCreationWizard />
      </NextIntlClientProvider>
    );

    console.log('=== RENDERED HTML ===');
    console.log(container.innerHTML.substring(0, 2000));

    console.log('\\n=== BUTTONS ===');
    const buttons = screen.queryAllByRole('button');
    console.log('Found buttons:', buttons.length);
    buttons.forEach((btn, i) => {
      const text = btn.textContent || '';
      console.log('  Button', i, ':', text.trim().substring(0, 50));
    });

    expect(container.innerHTML.length).toBeGreaterThan(100);
  });
});
