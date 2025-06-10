"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAwesomeNode } from "@/context/awesome-node-context"
import { Account } from "@/awesome/awesome"
import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"

export default function Header() {
  const pathname = usePathname()
  const node = useAwesomeNode()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)

  useEffect(() => {
    const account = node.getAccount()
    setAccount(account)
    const handleAccountUpdated = (account: Account) => {
      setAccount(account)
    }
    node.on("account.updated", handleAccountUpdated)

    return () => {
      node.off("account.updated", handleAccountUpdated)
    }
  }, [node])

  return (
    <header className="top-0 z-50 w-full">
      <div className="flex h-10 w-full items-center px-4 justify-between md:text-sm">
        <nav className="flex space-x-4 items-center">
          <Link href="/" className="mr-6 flex space-between space-x-2 z-50" onClick={() => setIsMenuOpen(false)}>
            <span className="font-bold">Proof of Awesome</span>
          </Link>
          <Link
            href="/call-for-achievement"
            className={cn(
              "transition-colors hover:text-foreground/80 hidden md:block",
              pathname === "/call-for-achievement" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Call for Achievement
          </Link>
          <Link
            href="/peers"
            className={cn(
              "transition-colors hover:text-foreground/80 hidden md:block",
              pathname === "/peers" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Peers
          </Link>
          <Link
            href="/transactions"
            className={cn(
              "transition-colors hover:text-foreground/80 hidden md:block",
              pathname === "/transactions" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Transactions
          </Link>
          <Link
            href="/blocks"
            className={cn(
              "transition-colors hover:text-foreground/80 hidden md:block",
              pathname === "/blocks" ? "text-foreground" : "text-foreground/60"
            )}
          >
            Blocks
          </Link>

          <Link
            href="https://github.com/AmyangXYZ/ProofOfAwesome"
            target="_blank"
            className={cn("transition-colors hover:text-foreground/80 hidden md:block text-foreground/60")}
          >
            Github
          </Link>
        </nav>

        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-2 text-muted-foreground pr-2">
            <span>
              Address: <span className="font-mono text-xs">{account?.address}</span>
            </span>
            <span>
              Balance: <span className="font-mono">{account?.balance}</span>
            </span>
          </div>
          <Link
            href="https://apps.apple.com/us/app/proof-of-awesome/id6743959764?platform=iphone"
            className={cn(
              "flex items-center space-x-1 px-2 py-1 rounded-md bg-white text-black hover:bg-gray-100 transition-colors border border-gray-200"
            )}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <span className="text-xs font-medium leading-tight">iOS App</span>
          </Link>
          <Button variant="ghost" className="md:hidden relative z-50 w-6 h-6" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className="absolute w-5 h-5 flex flex-col justify-center items-center">
              <span
                className={cn(
                  "absolute w-5 h-1/10 bg-foreground transform transition-all duration-300",
                  isMenuOpen ? "rotate-45" : "-translate-y-1"
                )}
              />
              <span
                className={cn(
                  "absolute h-1/10 w-5 bg-foreground transform transition-all duration-300",
                  isMenuOpen ? "-rotate-45" : "translate-y-1"
                )}
              />
            </div>
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-background/95 backdrop-blur-sm md:hidden transition-opacity duration-300",
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="fixed inset-x-0 top-10 flex flex-col space-y-4 px-8 pt-4">
          <div className="flex flex-col text-muted-foreground">
            <span>Address:</span>
            <span className="mb-2 font-mono break-all" style={{ fontSize: "0.79rem" }}>
              {account?.address}
            </span>
            <span>Balance:</span>
            <span className="text-sm font-mono">{account?.balance}</span>
          </div>
          <Separator />
          <Link
            href="/call-for-achievement"
            className={cn(
              "text-md transition-colors hover:text-foreground/80",
              pathname === "/call-for-achievement" ? "text-foreground" : "text-foreground/60"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            Call for Achievement
          </Link>
          <Link
            href="/peers"
            className={cn(
              "text-md transition-colors hover:text-foreground/80",
              pathname === "/peers" ? "text-foreground" : "text-foreground/60"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            Peers
          </Link>
          <Link
            href="/transactions"
            className={cn(
              "text-md transition-colors hover:text-foreground/80",
              pathname === "/transactions" ? "text-foreground" : "text-foreground/60"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            Transactions
          </Link>
          <Link
            href="/blocks"
            className={cn(
              "text-md transition-colors hover:text-foreground/80",
              pathname === "/blocks" ? "text-foreground" : "text-foreground/60"
            )}
            onClick={() => setIsMenuOpen(false)}
          >
            Blocks
          </Link>
          <Link
            href="https://github.com/AmyangXYZ/ProofOfAwesome"
            className={cn("text-md  transition-colors hover:text-foreground/80", "text-foreground/60")}
            onClick={() => setIsMenuOpen(false)}
          >
            Github
          </Link>
        </div>
      </div>
    </header>
  )
}
