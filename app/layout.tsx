import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BrickMarket — LEGO Community Platform',
  description: 'Buy, sell, trade, and invest in LEGO sets. Flip Score, Deal Scanner, Trade Matchmaker, and more.',
  openGraph: {
    title: 'BrickMarket',
    description: 'The LEGO platform built by collectors, for collectors.',
    url: 'https://brickmarket.app',
    siteName: 'BrickMarket',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
