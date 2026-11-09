import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Industrial PBL - DSATM CSE',
  description: 'Industrial Project-Based Learning Portal for DSATM CSE',
  icons: {
    icon: '/dsatm-logo.png',
    shortcut: '/dsatm-logo.png',
    apple: '/dsatm-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
