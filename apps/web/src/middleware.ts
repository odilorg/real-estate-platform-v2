import createMiddleware from 'next-intl/middleware';

// Inline config to avoid edge runtime eval issues
export default createMiddleware({
  locales: ['ru', 'uz'],
  defaultLocale: 'ru',
  localePrefix: 'as-needed',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
