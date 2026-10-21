import type { Metadata } from 'next';
import './globals.css';
import { NOME_APP } from '@/lib/config';

export const metadata: Metadata = {
  title: NOME_APP,
  description: 'Correio eletrônico da equipe de robótica'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
