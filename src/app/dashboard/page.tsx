/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { getRatingLabel, getRatingColor } from "@/lib/utils"
import md5 from "md5"
import Image from "next/image"
import { CircleCheckBig, TriangleAlert } from "lucide-react"

export default function Page() {
  const { data: session, status } = useSession()

  const activeSolo = {
    position: "WIII_TWR",
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid 7 hari lagi
    mentor: "Mulyono (123456)"
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  }

  // Tampilkan Skeleton loading jika data belum siap
  if (status === 'loading') {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-base-300 w-1/4 rounded"></div>
        <div className="h-64 bg-base-300 rounded-xl"></div>
      </div>
    )
  }
  // Jika tidak ada session (seharusnya layout handle ini, tapi untuk jaga-jaga)
  if (!session) redirect("/")
  // Akses field custom kita melalui `session.user`
  const user = session.user

  return (
    <div className="space-y-6">
      {/* Header Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
          <p className="text-base-content/70">Here is what&apos;s happening correctly at IDvACC.</p>
        </div>
      </div>

      {/* Solo Endorsement */}
      {activeSolo && (
        <div role="alert" className="alert alert-info text-info-content border-none">
          <CircleCheckBig />
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center w-full">
              <h3 className="font-bold text-lg">Active Solo Endorsement</h3>
            </div>
            <div className="text-sm mt-1 opacity-90">
              You are authorized to control <strong>{activeSolo.position}</strong> without supervision.
            </div>
            <div className="text-xs mt-2 font-mono bg-white/20 p-2 rounded inline-block w-fit">
              Expires: {formatDate(activeSolo.validUntil)}
            </div>
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-sm uppercase text-base-content/50">Your Profile</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-16">
                  <Image alt={`${user.name} avatar`} width={24} height={24} src={`https://www.gravatar.com/avatar/${md5(String(user.email).trim().toLowerCase())}`}></Image>
                </div>
              </div>
              <div>
                <div className="font-bold text-lg">{user.name}</div>
                <div className={`text-sm badge ${getRatingColor(user.ratingId)} badge-soft mt-1`}>
                  {getRatingLabel(user.ratingId)}
                </div>
              </div>
            </div>

            <div className="divider my-2"></div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="opacity-50">Division</div>
                <div className="font-semibold">{user.division || "N/A"}</div>
              </div>
              <div>
                <div className="opacity-50">Region</div>
                <div className="font-semibold">{user.region || "N/A"}</div>
              </div>
              <div>
                <div className="opacity-50">Status</div>
                <div className={`font-semibold ${user.rosterStatus === 'ACTIVE' ? 'text-success' : 'text-warning'}`}>
                  {user.rosterStatus || "VISITOR"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder Stats 1 */}
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-sm uppercase text-base-content/50">Training Progress</h2>
            <div className="py-4 text-center">
              <div className="radial-progress text-primary" style={{ "--value": 70 } as any} role="progressbar">
                70%
              </div>
              <p className="mt-2 text-sm font-semibold">S2 Tower Training</p>
            </div>
            <div className="card-actions justify-end">
              <button className="btn btn-sm btn-ghost">View Details</button>
            </div>
          </div>
        </div>

        {/* Placeholder Stats 2 */}
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-sm uppercase text-base-content/50">Pending Exams</h2>
            <div className="alert alert-warning text-sm">
              <TriangleAlert />
              <span>Basic Theory Exam needs your attention.</span>
            </div>
            <div className="card-actions justify-end mt-2">
              <button className="btn btn-sm btn-primary">Start Exam</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
