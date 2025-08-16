import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://echobox.app'),
  title: 'EchoBox - Send Crypto Gifts to the Future',
  description: 'Lock ETH in smart contracts and send them as gifts that unlock on specific dates. Perfect for birthdays, holidays, or any special occasion.',
  keywords: 'crypto, gifts, ethereum, blockchain, time-locked, ENS',
  authors: [{ name: 'EchoBox Team' }],
  openGraph: {
    title: 'EchoBox - Send Crypto Gifts to the Future',
    description: 'Lock ETH in smart contracts and send them as gifts that unlock on specific dates.',
    url: 'https://echobox.app',
    siteName: 'EchoBox',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
