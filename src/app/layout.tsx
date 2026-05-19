import type { ReactNode } from 'react';
import './globals.css';
import './desktop-overrides.css';
import { MainLayout } from '../components/MainLayout';

export const metadata = {
  title: 'Valentina Asset Intelligence',
  description: 'High-end corporate landing page for Asset Management and Monitoring with real-time analytics.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
