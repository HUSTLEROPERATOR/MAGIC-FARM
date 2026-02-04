import '@/lib/auth/types';
import './globals.css';
import type { Metadata } from 'next';
import { Inter, Cinzel } from 'next/font/google';
import { Providers } from '@/components/providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const cinzel = Cinzel({ 
  subsets: ['latin'],
  variable: '--font-cinzel',
});

export const metadata: Metadata = {
  title: 'Magic Farm - Where Magic Meets Competition',
  description: 'Enter the mysterious world of Magic Farm. Compete, collaborate, and discover the secrets within.',
  keywords: ['magic', 'competition', 'events', 'games', 'mystery'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="bg-magic-dark text-white min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
