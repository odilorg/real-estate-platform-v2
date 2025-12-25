// Mock implementation of next/navigation for tests
// This file is aliased in vitest.config.ts to replace the real next/navigation module

export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
});

export const usePathname = () => '/';

export const useSearchParams = () => new URLSearchParams();

export const useParams = () => ({});

export const redirect = (url: string) => {
  throw new Error(`Redirect to ${url}`);
};

export const notFound = () => {
  throw new Error('Not found');
};
