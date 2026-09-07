import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Quórum',
  description:
    'Tesouraria com quórum para entidades estudantis. Cofre com duas assinaturas de três e livro-caixa aberto aos associados.',
};

export const viewport: Viewport = {
  themeColor: '#101823',
  width: 'device-width',
  initialScale: 1,
  // Mobile-first de verdade: a tela é 390 × 844.
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
