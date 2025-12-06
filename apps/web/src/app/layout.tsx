import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// This layout only exists to satisfy Next.js requirement for a root layout.
// The actual layout with html/body tags is in [locale]/layout.tsx
export default function RootLayout({ children }: Props) {
  return children;
}
