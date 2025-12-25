import { expect, afterEach, vi } from 'vitest';

// CRITICAL: Mock next/navigation FIRST, before any other imports
// This prevents "Cannot find module" errors from next-intl
vi.mock('next/navigation', () => {
  const mockFn = (name: string) => {
    const fn: any = (...args: any[]) => {};
    fn.mockName = name;
    return fn;
  };

  return {
    useRouter: () => ({
      push: mockFn('push'),
      replace: mockFn('replace'),
      back: mockFn('back'),
      forward: mockFn('forward'),
      refresh: mockFn('refresh'),
      prefetch: mockFn('prefetch'),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: (url: string) => {
      throw new Error(`Redirect to ${url}`);
    },
    notFound: () => {
      throw new Error('Not found');
    },
    permanentRedirect: (url: string) => {
      throw new Error(`Permanent redirect to ${url}`);
    },
  };
});

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// React 19 compatibility: Polyfill React.act
// React 19.0 removed the `act` export, but react-dom-test-utils still needs it
// We need to use ReactDOM.flushSync to synchronously flush pending updates
const React = require('react');
const ReactDOM = require('react-dom');

if (!React.act) {
  // Use ReactDOM.flushSync to ensure updates are flushed synchronously
  const actImpl = function act(callback: () => void | Promise<void>) {
    const previousIsActEnvironment = (global as any).IS_REACT_ACT_ENVIRONMENT;
    (global as any).IS_REACT_ACT_ENVIRONMENT = true;

    try {
      let result;
      ReactDOM.flushSync(() => {
        result = callback();
      });

      if (result && typeof result.then === 'function') {
        return result.then(() => {
          (global as any).IS_REACT_ACT_ENVIRONMENT = previousIsActEnvironment;
          // Flush any updates that happened in the async callback
          ReactDOM.flushSync(() => {});
        });
      }

      (global as any).IS_REACT_ACT_ENVIRONMENT = previousIsActEnvironment;
      return Promise.resolve();
    } catch (error) {
      (global as any).IS_REACT_ACT_ENVIRONMENT = previousIsActEnvironment;
      throw error;
    }
  };

  Object.defineProperty(React, 'act', {
    value: actImpl,
    writable: true,
    enumerable: false,
    configurable: true
  });
}

// Set React act environment flag
// @ts-ignore
global.IS_REACT_ACT_ENVIRONMENT = true;

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const React = require('react');
    const { src, alt, ...rest } = props;
    return React.createElement('img', { src, alt, ...rest });
  },
}));

// Mock next-intl - relies on next/navigation mock being set up first
vi.mock('next-intl', () => ({
  useLocale: vi.fn(() => 'ru'), // Use Russian locale for tests
  useTranslations: vi.fn((namespace?: string) => {
    // Mock translations for common keys used in tests
    const translations: Record<string, any> = {
      // Navigation
      'nav.back': 'Назад',
      'nav.next': 'Далее',
      'nav.submit': 'Отправить',

      // Property wizard steps
      'steps.0.title': 'Тип недвижимости',
      'steps.1.title': 'Локация',
      'steps.2.title': 'Детали',
      'steps.3.title': 'Характеристики',
      'steps.4.title': 'Медиа',
      'steps.5.title': 'Проверка',

      // Property types
      'propertyTypes.apartment': 'Квартира',
      'propertyTypes.apartmentDesc': 'Городская квартира в многоквартирном доме',
      'propertyTypes.house': 'Дом',
      'propertyTypes.houseDesc': 'Частный дом с земельным участком',
      'propertyTypes.villa': 'Вилла',
      'propertyTypes.villaDesc': 'Роскошная вилла',
      'propertyTypes.townhouse': 'Таунхаус',
      'propertyTypes.townhouseDesc': 'Современный таунхаус',
      'propertyTypes.land': 'Участок',
      'propertyTypes.landDesc': 'Земельный участок',
      'propertyTypes.commercial': 'Коммерция',
      'propertyTypes.commercialDesc': 'Коммерческая недвижимость',
      // English constants for tests
      'APARTMENT': 'Квартира',
      'HOUSE': 'Дом',
      'VILLA': 'Вилла',
      'TOWNHOUSE': 'Таунхаус',
      'LAND': 'Участок',
      'COMMERCIAL': 'Коммерция',

      // Listing types
      'listingTypes.sale': 'Продажа',
      'listingTypes.saleDesc': 'Продажа недвижимости',
      'listingTypes.rentLong': 'Долгосрочная аренда',
      'listingTypes.rentLongDesc': 'Аренда на длительный срок',
      'listingTypes.rentDaily': 'Посуточная аренда',
      'listingTypes.rentDailyDesc': 'Аренда посуточно',
      // English constants for tests
      'SALE': 'Продажа',
      'RENT_LONG': 'Долгосрочная аренда',
      'RENT_DAILY': 'Посуточная аренда',

      // Seller types
      'sellerTypes.owner': 'Собственник',
      'sellerTypes.ownerDesc': 'Я владелец недвижимости',
      'sellerTypes.agent': 'Агент',
      'sellerTypes.agentDesc': 'Я агент по недвижимости',
      'sellerTypes.developer': 'Застройщик',
      'sellerTypes.developerDesc': 'Я представитель застройщика',

      // Step titles (for headings)
      'step.propertyType': 'Property Type',
      'step.location': 'Location',
      'step.details': 'Details',
      'step.features': 'Features',
      'step.media': 'Media',
      'step.review': 'Review',

      // Form validation & labels
      'Select property type': 'Выберите тип недвижимости',
      'Enter valid price': 'Введите корректную цену',
      'Price': 'Цена',

      // Publishing
      'Опубликовать': 'Опубликовать',
      'Объявление опубликовано!': 'Объявление опубликовано!',
      'Заполните обязательные поля': 'Заполните обязательные поля',
      'Перейти к шагу': 'Перейти к шагу',

      // Wizard progress (component uses 'wizard' namespace and calls t('progress'))
      'wizard.progress': (params: any) => `Шаг ${params.current} из ${params.total}`,
      'progress': (params: any) => `Шаг ${params.current} из ${params.total}`,
      'wizard.stepProgress': (params: any) => `Шаг ${params.current} из ${params.total}`,
      'wizard.step': (params: any) => `Шаг ${params.step} из ${params.total}`,
    };

    return (key: string, params?: any) => {
      // Handle namespaced keys if namespace was provided
      const fullKey = namespace ? `${namespace}.${key}` : key;

      // Check if key has parameters
      if (params && typeof translations[fullKey] === 'function') {
        return (translations[fullKey] as Function)(params);
      }
      if (params && typeof translations[key] === 'function') {
        return (translations[key] as Function)(params);
      }

      // Return translation or fallback to key
      return translations[fullKey] || translations[key] || key;
    };
  }),
  NextIntlClientProvider: ({ children }: any) => children,
}));

// Mock @/i18n/routing to prevent next-intl from importing next/navigation
vi.mock('@/i18n/routing', () => ({
  routing: {},
  Link: ({ children, href, ...props }: any) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
  redirect: (url: string) => {
    throw new Error(`Redirect to ${url}`);
  },
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  getPathname: () => '/',
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const React = require('react');
  const icons = [
    // Common icons
    'Maximize2', 'Minimize2', 'RotateCw', 'ChevronLeft', 'ChevronRight',
    'Loader2', 'X', 'Upload', 'Star', 'MoveVertical', 'CheckCircle2', 'AlertCircle',
    // Property wizard icons
    'AlignLeft', 'ArrowLeft', 'ArrowRight', 'ArrowUpDown', 'Bath', 'Bed', 'Briefcase',
    'Building', 'Building2', 'Calendar', 'Car', 'Check', 'ChevronDown', 'DollarSign',
    'Factory', 'FileText', 'Flame', 'Fuel', 'HardHat', 'Home', 'Image', 'LandPlot',
    'Layers', 'Map', 'MapPin', 'Maximize', 'Navigation', 'Plus', 'Save', 'Snowflake',
    'Store', 'Trash2', 'User', 'Video', 'Wind', 'Wrench', 'Youtube'
  ];

  const mockIcon = (name: string) => {
    return ({ className, ...props }: any) =>
      React.createElement('svg', {
        'data-testid': `icon-${name.toLowerCase()}`,
        className,
        ...props
      });
  };

  const mocks: any = {};
  icons.forEach(icon => {
    mocks[icon] = mockIcon(icon);
  });

  return mocks;
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;

// Mock fetch
global.fetch = vi.fn();
