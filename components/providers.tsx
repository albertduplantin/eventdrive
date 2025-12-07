'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { frFR } from '@clerk/localizations';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider localization={frFR}>
      {children}
    </ClerkProvider>
  );
}
