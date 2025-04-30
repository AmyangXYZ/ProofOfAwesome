"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="container flex h-12 w-full items-center px-4">
        <div className="flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Proof of Awesome</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/call-for-achievement"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/call-for-achievement" ? "text-foreground" : "text-foreground/60"
              )}
            >
              Call for Achievement
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
