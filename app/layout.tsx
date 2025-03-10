import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chat Interface',
  description: 'A ChatGPT-like interface using Deepseek API',
  openGraph : {
    images : [
      {
        url : 'https://images.purevpn-tools.com/wp-content/uploads/en/2025/01/deepseek-banner.png',
        width : 1200,
        height : 630,
        alt : 'Deepseek'
      }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
