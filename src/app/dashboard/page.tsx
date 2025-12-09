/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { getRatingLabel, getRatingColor } from "@/lib/utils"
import md5 from "md5"
import Image from "next/image"
import { CircleCheckBig, Loader2, TriangleAlert } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useRouter } from "next/navigation"
import LoadingSpinner from "@/components/loading_spinner"

export default function Page() {
  const { data: session, status } = useSession()
  const [activeSolo, setActiveSolo] = useState<any>(null)
  const [activeTraining, setActiveTraining] = useState<any>(null)
  const [pendingExam, setPendingExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const formatDate = (dateInput: string | Date | null | undefined) => {
    // 1. Cek apakah data ada
    if (!dateInput) return "N/A";

    // 2. Konversi ke object Date (jika inputnya string ISO)
    const date = new Date(dateInput);

    // 3. Cek validitas Date (Mencegah error "Invalid time value")
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      // hour: '2-digit', minute: '2-digit' // Opsional: matikan jam jika hanya butuh tanggal
    }).format(date);
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      if (session?.user?.cid) {
        try {
          const cid = session.user.cid;

          // 1. Fetch Solo Endorsement
          // @ts-ignore
          const soloRes = await api.api.training.solo[cid].get()

          // 2. Fetch Active Training (Progress)
          // @ts-ignore
          const trainRes = await api.api.training.active[cid].get()

          // 3. Fetch Exams (Untuk cari yang pending)
          const examRes = await api.api.exams.get({ $query: { cid } })

          // --- SET STATE SOLO ---
          if (soloRes.data?.status === 'success') {
            setActiveSolo(soloRes.data.data)
          }

          // --- SET STATE TRAINING ---
          if (trainRes.data?.status === 'success') {
            setActiveTraining(trainRes.data.data)
          }

          // --- SET STATE PENDING EXAM ---
          if (examRes.data?.status === 'success' && examRes.data?.data) {
            // Cari ujian yang: 
            // 1. Tidak Terkunci (Available) 
            // 2. Belum Lulus (Not Passed)
            const nextExam = examRes.data.data.find((e: any) =>
              !e.isLocked && e.lastAttempt?.status !== 'PASSED'
            );
            setPendingExam(nextExam)
          }

        } catch (e) {
          console.error("Dashboard fetch error", e)
        } finally {
          setLoading(false)
        }
      }
    }

    if (status === "authenticated") loadDashboardData()
  }, [session, status])

  // --- LOGIC PERSENTASE TRAINING ---
  const trainingProgress = activeTraining ? Math.min((activeTraining._count.sessions / 10) * 100, 100) : 0

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
  if (status === "unauthenticated" || !session) {
    redirect("/")
  }
  // Akses field custom kita melalui `session.user`
  const user = session.user


  return (
    <div className="space-y-6">
      {/* Header Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name?.split(' ')[0]}!👋</h1>
          <p className="text-base-content/70">Here is what&apos;s happening correctly at IDvACC.</p>
        </div>
      </div>

      {/* Solo Endorsement */}
      {!loading && activeSolo && (
        <div role="alert" className="alert alert-info alert-soft border-info/20 shadow-sm">
          <CircleCheckBig className="h-6 w-6 text-info" />
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center w-full">
              <h3 className="font-bold text-lg">Active Solo Endorsement</h3>
            </div>
            <div className="text-sm mt-1 opacity-90">
              You are authorized to control <strong className="uppercase">{activeSolo.position}</strong> without supervision.
            </div>
            <div className="text-xs mt-2 font-mono bg-base-100/50 p-2 rounded inline-block w-fit font-bold">
              Expires: {activeSolo.validUntil ? formatDate(activeSolo.validUntil) : "Until Revoked"}
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
                <div className={`font-semibold badge badge-soft ${user.rosterStatus === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                  {user.rosterStatus || "VISITOR"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder Stats 1 */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-sm uppercase text-base-content/50">Training Progress</h2>

            {loading ? (
              <LoadingSpinner text="Loading data..."/>
            ) : activeTraining ? (
              <>
                <div className="py-4 text-center">
                  <div
                    className="radial-progress text-primary font-bold text-lg transition-all duration-1000"
                    style={{ "--value": trainingProgress, "--size": "6rem" } as any}
                    role="progressbar"
                  >
                    {activeTraining._count.sessions} {activeTraining._count.sessions === 1 ? "Session" : "Sessions"}
                  </div>
                  <p className="mt-4 text-sm font-semibold truncate" title={activeTraining.title}>
                    {activeTraining.title}
                  </p>
                </div>
                <div className="card-actions justify-end mt-auto">
                  <button onClick={() => router.push('/dashboard/training')} className="btn btn-sm btn-secondary btn-soft">
                    View Log
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-8">
                <p className="text-sm">No active training program.</p>
              </div>
            )}
          </div>
        </div>

        {/* Placeholder Stats 2 */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-sm uppercase text-base-content/50">Exam Center</h2>

            {loading ? (
              <LoadingSpinner />
            ) : pendingExam ? (
              <>
                <div className="alert alert-warning text-sm alert-soft border-warning/20 mt-2">
                  <TriangleAlert className="w-5 h-5" />
                  <span><b>{pendingExam.title}</b> is available to take.</span>
                </div>
                <div className="flex-1"></div> {/* Spacer */}
                <div className="card-actions justify-end mt-4">
                  <button
                    onClick={() => router.push(`/dashboard/exams`)}
                    className="btn btn-sm btn-primary w-full btn-soft"
                  >
                    Start Exam
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-8">
                <CircleCheckBig className="w-8 h-8 mb-2 text-success/50" />
                <p className="text-sm">You&apos;re all caught up!</p>
                <p className="text-xs">No pending exams.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
