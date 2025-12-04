
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { SignOutAction } from "@/lib/actions"

// Menerima version sebagai props dari Server Component
export default function SidebarContent({ version }: { version: string }) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Panggil Server Action
      await SignOutAction()

      // Catatan: Kode di bawah ini mungkin tidak akan tereksekusi 
      // karena 'redirect' di server action akan langsung memindah halaman.
    } catch (error) {
      console.error("Logout failed", error)
      setIsLoggingOut(false)
    }
  }

  // Helper active state
  const isActive = (path: string) => pathname === path ? "active" : ""

  return (
    <ul className="menu p-4 w-80 min-h-full bg-base-100 text-base-content border-r border-base-300 flex flex-col">

      {/* Logo / Brand */}
      <li className="mb-6 mt-2">
        <div className="flex items-center gap-4 hover:bg-transparent cursor-default">
          <div className="flex flex-col">
            <span className="font-bold text-lg">Mandala</span>
            <span className="text-xs text-base-content/60">IDvACC SuperApp</span>
          </div>
        </div>
      </li>

      {/* Menu Items */}
      <li className="menu-title">General</li>
      <li>
        <Link href="/dashboard" className={isActive("/dashboard")}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Dashboard
        </Link>
      </li>
      <li>
        <Link href="/dashboard/roster" className={isActive("/dashboard/roster")}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          Roster List
        </Link>
      </li>

      <li className="menu-title mt-4">Training Department</li>
      <li>
        <Link href="/dashboard/training" className={isActive("/dashboard/training")}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          My Training
        </Link>
      </li>
      {/* Tambahkan link lain disini jika ada */}

      {/* Spacer untuk dorong footer ke bawah */}
      <div className="mt-auto"></div>

      <div className="divider my-2"></div>

      {/* Tombol Logout */}
      <li>
        {/* Tambahkan onClick handler yang baru */}
        <button onClick={handleLogout} disabled={isLoggingOut} className="text-error hover:bg-error/10">
          {isLoggingOut ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          )}
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </li>

      {/* Info Versi */}
      <li className="disabled pointer-events-none mt-2">
        <div className="flex flex-col items-start gap-1 p-0 px-4 cursor-default">
          <span className="text-xs font-mono opacity-40">Mandala {version}</span>
          <span className="text-[10px] opacity-30">© 2025 IDvACC</span>
        </div>
      </li>

    </ul>
  )
}