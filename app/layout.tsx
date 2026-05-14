import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'D3 Volleyball | Volleyball Game Management',
  description: 'Modern volleyball management platform for teams, games, and rankings.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
