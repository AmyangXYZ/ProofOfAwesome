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
          <Link href="/" className="mr-6 flex space-between space-x-2 z-50">
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
        <div className="hidden md:flex items-center space-x-2 text-muted-foreground">
          <span>
            Address: <span className="font-mono">{account?.address}</span>
          </span>
          <span>
            Balance: <span className="font-mono">{account?.balance}</span>
          </span>
        </div>
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
