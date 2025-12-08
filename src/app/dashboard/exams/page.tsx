/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ExamListPage() {
  const { data: session } = useSession()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const handleStartExam = async (examId: string) => {
    try {
      // 1. Panggil Endpoint Start (Acak Soal)
      const res = await api.api.exams[examId].start.post({
        userId: session?.user?.id as string
      })

      if (res.data?.status === 'success') {
        // 2. Redirect ke halaman pengerjaan dengan ID SUBMISSION, bukan ID EXAM
        const submissionId = res.data.data.submissionId;
        router.push(`/dashboard/exams/take/${submissionId}`)
      }
    } catch (e) {
      console.error(e)
      alert("Failed to start exam")
    }
  }

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

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold">Exam Center</h1>
        <p className="text-base-content/60 text-sm">Validations & Rank Upgrades.</p>
      </div>

      {loading ? <div className="text-center py-10">Loading...</div> :
        exams.length === 0 ? <div className="text-center py-10 opacity-50">No exams configured.</div> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div key={exam.id} className={`card border transition-all relative overflow-hidden
                        ${exam.isLocked
                  ? 'bg-base-200 border-base-300 opacity-80 grayscale-[0.5]'
                  : 'bg-base-100 shadow-sm border-base-200 hover:shadow-md'
                }
                    `}>
                <div className="card-body">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start">
                    {exam.isLocked ? (
                      <div className="badge badge-ghost gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        LOCKED
                      </div>
                    ) : (
                      <div className="badge badge-success badge-outline text-xs">AVAILABLE</div>
                    )}

                    {/* Score Badge jika pernah dikerjakan */}
                    {exam.lastAttempt && (
                      <div className={`badge ${exam.lastAttempt.status === 'PASSED' ? 'badge-success text-white' : 'badge-error text-white'}`}>
                        {exam.lastAttempt.status} ({exam.lastAttempt.score}%)
                      </div>
                    )}
                  </div>

                  <h2 className="card-title mt-2">{exam.title}</h2>
                  <p className="text-sm text-base-content/60">
                    {exam.questionCount} Questions &bull; Pass: 80%
                  </p>

                  {/* Info Syarat jika Locked */}
                  {exam.isLocked && (
                    <div className="alert alert-warning text-xs mt-4 py-2 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <span>Complete <b>{exam.prerequisiteTitle}</b> first.</span>
                    </div>
                  )}

                  <div className="card-actions justify-end mt-4">
                    {exam.isLocked ? (
                      <Link href="/dashboard/lms" className="btn btn-sm btn-ghost">
                        Go to Course
                      </Link>
                    ) : exam.lastAttempt?.status === 'PASSED' ? (
                      <button className="btn btn-sm btn-success btn-disabled text-white">Passed</button>
                    ) : (
                      <button onClick={() => handleStartExam(exam.id)} className="btn btn-sm btn-primary">
                        {exam.lastAttempt ? "Retake Exam" : "Start Exam"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}