import './globals.css';

import { Inter } from 'next/font/google';

import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Admin Dashboard - AI Agent Platform',
  description: 'Privacy-first admin dashboard for AI agent monitoring and management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
