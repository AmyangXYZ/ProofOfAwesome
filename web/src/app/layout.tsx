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
  title: "Proof of Awesome | Blockchain Achievement Platform with AI Verification",
  description:
    "Transform real-world achievements into blockchain-verified assets through AwesomeCom events. Join our innovative consensus mechanism that replaces computational mining with meaningful accomplishments.",
  keywords: [
    "blockchain achievement",
    "AI verification",
    "AwesomeCom",
    "achievement mining",
    "proof of work alternative",
    "blockchain social platform",
    "computational fitness",
    "achievement validation",
    "peer review blockchain",
    "digital accomplishment tracking",
  ],
  openGraph: {
    title: "Proof of Awesome | Blockchain Achievement Platform",
    description:
      "Join AwesomeCom events to transform your real-world accomplishments into blockchain-verified assets. Our innovative consensus mechanism combines AI verification with peer review for meaningful achievement mining.",
    type: "website",
    locale: "en_US",
    siteName: "Proof of Awesome",
  },
  twitter: {
    card: "summary_large_image",
    title: "Proof of Awesome | Transform Achievements into Blockchain Assets",
    description:
      "Join AwesomeCom events to mine achievements instead of computational puzzles. Your real-world accomplishments, verified by AI and peer review, become permanent blockchain assets.",
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
