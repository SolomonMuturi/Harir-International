import type { Metadata } from 'next';
import { PT_Sans, Roboto } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from '@/hooks/use-user';
import './globals.css';
import 'leaflet/dist/leaflet.css';

// Import SessionProviderWrapper component
import { SessionProviderWrapper } from '@/components/session-provider-wrapper';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-receipt',
});

export const metadata: Metadata = {
  title: 'Harir International',
  description: 'Harir International Production System Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('font-body antialiased', ptSans.variable, roboto.variable)}>
        {/* Wrap with SessionProviderWrapper */}
        <SessionProviderWrapper>
          <UserProvider>
            {children}
          </UserProvider>
          <Toaster />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}