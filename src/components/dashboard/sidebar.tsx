"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { SignOutAction } from "@/lib/actions"
import { GraduationCap, ClipboardList, ListCheck, UserRoundCog, ShieldUser, Users, LayoutDashboard, BookLock, FileLock2, NotebookText } from "lucide-react"

interface SidebarProps {
  version: string
  user: {
    name?: string | null
    role: string
  }
}

// Menerima version sebagai props dari Server Component
export default function SidebarContent({ version, user }: SidebarProps) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const role = user.role

  const CAN_ACCESS_ADMIN = (["ADMIN", "STAFF"] as string[]).includes(role)
  const CAN_ACCESS_MENTORING = (["ADMIN", "STAFF", "MENTOR"] as string[]).includes(role)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try { await SignOutAction() }
    catch { setIsLoggingOut(false) }
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
          <LayoutDashboard />
          Dashboard
        </Link>
      </li>
      <li>
        <Link href="/dashboard/roster" className={isActive("/dashboard/roster")}>
          <Users />
          Roster List
        </Link>
      </li>

      <li className="menu-title mt-4">Training Department</li>
      <li>
        <Link href="/dashboard/training" className={isActive("/dashboard/training")}>
          <ListCheck />
          My Training
        </Link>
      </li>
      <li>
        <Link href="/dashboard/exams" className={isActive("/dashboard/exams")}>
          <ClipboardList />
          Exam Center
        </Link>
      </li>
      <li>
        <Link href="/dashboard/lms" className={isActive("/dashboard/lms")}>
          <GraduationCap />
          E-Learning
        </Link>
      </li>
      {/* Tambahkan link lain disini jika ada */}
      {
        CAN_ACCESS_MENTORING && (
          <li>
            <Link href="/dashboard/mentoring" className={isActive("/dashboard/mentoring")}>
              <UserRoundCog />
              Mentoring Log
            </Link>
          </li>
        )
      }

      {
        CAN_ACCESS_ADMIN && (
          <>
            <li className="menu-title mt-4">Admin Console</li>
            <li>
              <Link href="/dashboard/admin/members" className={isActive("/dashboard/admin/members")}>
                <ShieldUser />
                Member Manager
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/courses" className={isActive("/dashboard/admin/courses")}>
                <NotebookText />
                Course Manager
              </Link>
            </li>
            <li>
              <Link href="/dashboard/admin/grading" className={isActive("/dashboard/admin/grading")}>
                <FileLock2 />
                Grading Manager
              </Link>
            </li>
            <li>

              <Link href="/dashboard/admin/exams"><BookLock /> Exam Manager</Link>
            </li>
          </>
        )
      }
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