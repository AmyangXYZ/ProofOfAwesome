import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Proof of Awesome | AI-Verified Blockchain Achievement Platform",
  description: "Transform your real-world achievements into blockchain-verified digital assets with AI validation.",
  keywords: [
    "blockchain achievement",
    "AI verification",
    "digital achievement tracking",
    "proof of work alternative",
    "blockchain social platform",
  ],
  openGraph: {
    title: "Proof of Awesome | Transform Achievements into Blockchain Assets",
    description:
      "Record your real-world accomplishments on a blockchain with AI verification. Join public chains or create private ones for your community.",
    type: "website",
    locale: "en_US",
    siteName: "Proof of Awesome",
  },
  twitter: {
    card: "summary",
    title: "Proof of Awesome | Blockchain Achievement Platform",
    description: "Your real-world achievements, verified by AI and recorded on blockchain.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  applicationName: "Proof of Awesome",
  category: "productivity",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
      <Analytics />
    </html>
  )
}
