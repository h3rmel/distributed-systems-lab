import type { Metadata } from 'next';
import { geistMono } from '#/styles/fonts';
import '#/styles/globals.css';
import { cn } from '#/lib/utils';

export const metadata: Metadata = {
  title: 'Live Dashboard - Distributed Systems Lab',
  description: 'Real-time webhook ingestion monitoring dashboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn('dark font-sans', geistMono.variable)}>
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
