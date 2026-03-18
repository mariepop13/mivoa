import React from 'react';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Merriweather } from 'next/font/google';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/context/LanguageContext';
import { OpenRouterApiKeyProvider } from '@/context/OpenRouterApiKeyContext';
import { ModelProvider } from '@/context/ModelContext';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/Footer';
import { AuthGuard } from '@/components/auth-guard';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});
const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mivoa',
  description: 'AI-assisted journal',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📓</text></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${merriweather.variable} font-body antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
          <FirebaseClientProvider>
              <OpenRouterApiKeyProvider>
                <ModelProvider>
                  <AuthGuard>
                    {children}
                  </AuthGuard>
                  <Footer />
                  <Toaster />
                </ModelProvider>
              </OpenRouterApiKeyProvider>
          </FirebaseClientProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

