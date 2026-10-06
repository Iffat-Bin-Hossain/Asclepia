import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Asclepia – Clinical & Patient Management Portal',
  description: 'Secure administrative platform for managing doctors and patient registries with real-time analytics.',
  keywords: ['asclepia', 'clinical administration', 'hospital management', 'patient management', 'medical portal'],
  authors: [{ name: 'Asclepia' }],
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
