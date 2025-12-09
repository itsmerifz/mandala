/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Timer, AlertCircle } from "lucide-react" // Import Icon
import { toast } from "sonner"
import LoadingSpinner from "@/components/loading_spinner"

export default function ExamListPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // State untuk Modal Cooldown
  const [cooldownModal, setCooldownModal] = useState<{ show: boolean, msg: string }>({ show: false, msg: "" })

  useEffect(() => {
    const fetchExams = async () => {
      if (!session?.user?.cid) return
      try {
        const { data } = await api.api.exams.get({
          $query: { cid: session.user.cid }
        })
        if (data && data.status === 'success') {
          setExams(data.data ?? [])
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    if (session) fetchExams()
  }, [session])

  const handleStartExam = async (examId: string) => {
    try {
      const res = await api.api.exams[examId].start.post({
        userId: session?.user?.id as string
      })

      // Sukses -> Masuk ke Ujian
      if (res.data?.status === 'success') {
        const submissionId = res.data.data.submissionId;
        router.push(`/dashboard/exams/take/${submissionId}`)
      }

      // Error Handling Khusus
      if (res.error) {
        // Cek Status Code 429 (Too Many Requests / Cooldown)
        if (res.error.status === 429) {
          setCooldownModal({
            show: true,
            msg: res.error.value?.message || "You are in cooldown period."
          })
        } else {
          toast.error("Failed to start exam")
        }
      }
    } catch (e) {
      console.error(e)
      toast.error("System error")
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold">Exam Center</h1>
        <p className="text-base-content/60 text-sm">Validations & Rank Upgrades.</p>
      </div>

      {loading ? <LoadingSpinner /> :
        exams.length === 0 ? <div className="text-center py-10 opacity-50">No exams configured.</div> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
              const isCooldownActive = exam.cooldownRemaining > 0
              const isPrerequisiteLocked = exam.isLocked && !isCooldownActive
              return (
                <div key={exam.id} className={`card border transition-all relative overflow-hidden
                        ${exam.isLocked
                    ? 'bg-base-200 border-base-300 opacity-80'
                    : 'bg-base-100 shadow-sm border-base-200 hover:shadow-md'
                  }
                    `}>
                  <div className="card-body">
                    {/* Header Badge */}
                    <div className="flex justify-between items-start">
                      {/* Prioritaskan Status Cooldown */}
                      {isCooldownActive ? (
                        <div className="badge badge-error gap-1 badge-soft font-bold">COOLDOWN</div>
                      ) : isPrerequisiteLocked ? (
                        <div className="badge badge-warning gap-1 badge-soft font-bold">LOCKED</div>
                      ) : exam.isSelection ? (
                        <div className="badge badge-warning text-xs font-bold badge-soft">SELECTION</div>
                      ) : (
                        <div className="badge badge-success text-xs badge-soft font-bold">AVAILABLE</div>
                      )}

                      {/* Score Badge */}
                      {exam.lastAttempt && (
                        <div className={`badge font-bold badge-soft ${exam.lastAttempt.status === 'PASSED' ? 'badge-success' : 'badge-error'}`}>
                          {exam.lastAttempt.status} ({exam.lastAttempt.score}%)
                        </div>
                      )}
                    </div>

                    <h2 className="card-title mt-2">{exam.title}</h2>
                    <p className="text-sm text-base-content/60">
                      {exam.questionCount} Questions &bull; Pass: {exam.passingScore}%
                    </p>

                    {/* --- INDIKATOR COOLDOWN (VISUAL) --- */}
                    {exam.cooldownRemaining > 0 && (
                      <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3">
                        <Timer className="w-5 h-5 text-error shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-xs text-error">COOLDOWN ACTIVE</div>
                          <p className="text-[10px] opacity-70">
                            You must wait {exam.cooldownRemaining} minutes before retaking this selection exam.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Info Syarat jika Locked (Bukan Cooldown) */}
                    {exam.isLocked && exam.cooldownRemaining === 0 && (
                      <div className="alert alert-warning text-xs mt-4 py-2 rounded-md">
                        <span>Complete <b>{exam.prerequisiteTitle}</b> first.</span>
                      </div>
                    )}

                    <div className="card-actions justify-end mt-4">
                      {isCooldownActive ? (
                        <button className="btn btn-sm btn-disabled">
                          Wait {exam.cooldownRemaining}m
                        </button>
                      ) : isPrerequisiteLocked ? (
                        <Link href="/dashboard/lms" className="btn btn-sm btn-ghost">
                          Go to Course
                        </Link>
                      ) : exam.lastAttempt?.status === 'PASSED' && !exam.isSelection ? (
                        <button className="btn btn-sm btn-success btn-disabled btn-soft">Passed</button>
                      ) : (
                        <button
                          onClick={() => handleStartExam(exam.id)}
                          className="btn btn-sm btn-primary btn-soft"
                        >
                          {exam.lastAttempt ? "Retake Exam" : "Start Exam"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
      }

      {/* --- MODAL COOLDOWN / ERROR --- */}
      {cooldownModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="card w-full max-w-sm bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-2">
                <AlertCircle className="w-8 h-8 text-error" />
              </div>
              <h2 className="card-title text-error">Access Denied</h2>
              <p className="text-sm py-2">{cooldownModal.msg}</p>
              <div className="card-actions">
                <button
                  className="btn btn-primary btn-sm btn-soft"
                  onClick={() => setCooldownModal({ show: false, msg: "" })}
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}