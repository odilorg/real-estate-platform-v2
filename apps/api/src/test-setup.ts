/**
 * Global test setup
 * Mocks external HTTP calls to prevent tests from hitting real APIs
 */

// Mock global fetch to prevent real HTTP calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      elements: [], // Empty response from Overpass API
    }),
    text: async () => '',
    blob: async () => new Blob(),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
  } as Response),
) as jest.Mock;

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Filter out known test warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
        args[0].includes('Not implemented:') ||
        args[0].includes('Test environment:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global cleanup to prevent hanging tests
afterAll(async () => {
  // Clear all timers
  jest.clearAllTimers();

  // Wait for any pending promises
  await new Promise((resolve) => setImmediate(resolve));
});
