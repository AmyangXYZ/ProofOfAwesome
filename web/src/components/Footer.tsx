"use client"

export default function Footer() {
  const chainId = "Proof-of-Awesome v0.1.0"
  const isConnected = true

  return (
    <footer className="w-full border-t border-slate-200 text-sm mt-auto">
      <div className="mx-auto px-8 h-12 flex items-center justify-between">
        <span className="text-slate-600">{chainId}</span>
        <div className="text-center text-slate-400">
          <p>© {new Date().getFullYear()} Proof of Awesome. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`} />
          <span className="text-slate-600">Connected to AwesomeConnect</span>
        </div>
      </div>
    </footer>
  )
}
