"use client";

import { ThemeProvider } from '@/components/theme-context';

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}