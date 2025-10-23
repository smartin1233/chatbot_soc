import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '../styles/themes.css';
import { Toaster } from "@/components/ui/toaster";
import { ClientWrapper } from '@/components/client-wrapper';
import { ThemeProvider } from '@/components/theme-context';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Aforce360.ai-agent',
  description: 'AI-Powered Business Intelligence and Forecasting Agent',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider>
          <ClientWrapper>
            {children}
            <Toaster />
          </ClientWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
