import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Analytics } from "@vercel/analytics/next"
import { AwesomeNodeProvider } from "@/context/awesome-node-context"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Proof of Awesome",
  description:
    "Not another crypto - a blockchain for human achievement. Mine blocks with real accomplishments through AI verification and peer review. Free to join, no tokens or fees.",
  keywords: [
    "blockchain achievement",
    "AI verification",
    "achievement mining",
    "proof of work alternative",
    "peer review blockchain",
    "digital accomplishment tracking",
    "non-crypto blockchain",
    "achievement validation",
    "human achievement verification",
    "decentralized peer review",
  ],
  openGraph: {
    title: "Proof of Awesome | Not Another Crypto - A Blockchain for Human Achievement",
    description:
      "Mine blocks with real achievements, not math puzzles. Transform your accomplishments into permanent blockchain records through AI and peer verification. No crypto, no fees.",
    type: "website",
    locale: "en_US",
    siteName: "Proof of Awesome",
  },
  twitter: {
    card: "summary_large_image",
    title: "Proof of Awesome | Not Another Crypto - A Blockchain for Human Achievement",
    description:
      "Mine blocks with achievements, not math puzzles. Submit accomplishments, get AI+peer verified, earn blockchain recognition. No crypto, no fees.",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased `}>
        <AwesomeNodeProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <main className="w-full flex flex-col h-dvh">
              <Header />
              {children}
            </main>
            <Toaster position="top-center" />
          </ThemeProvider>
        </AwesomeNodeProvider>
      </body>
      <Analytics />
    </html>
  )
}
