import React from 'react';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata = {
  title: 'POS Agen BRILink Digital System',
  description: 'Aplikasi Kasir POS Digital Dual-Balance & Multi-Outlet Agen BRILink',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#F8FAFC] min-h-screen text-gray-900 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
