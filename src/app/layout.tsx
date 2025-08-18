import type { Metadata } from 'next';
import { Inter, Calistoga } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });
const calistoga = Calistoga({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-calistoga'
});

export const metadata: Metadata = {
  title: "Mom's Yums - Recipes Preserved for Generations",
  description:
    'Scan handwritten recipe cards and organize them into your digital recipe book',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${calistoga.variable}`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
