/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useSession } from "next-auth/react"
import Link from "next/link"

export default function ExamListPage() {
  const { data: session } = useSession()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExams = async () => {
      if (!session?.user?.cid) return

      try {
        // Kirim CID user ke API
        const { data } = await api.api.exams.get({
          $query: { cid: session.user.cid }
        })

        if (data && data.status === 'success') {
          setExams(data.data || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (session) fetchExams()
  }, [session])

  // Helper warna badge status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED': return 'badge-success text-white';
      case 'FAILED': return 'badge-error text-white';
      case 'PENDING_REVIEW': return 'badge-warning';
      default: return 'badge-ghost';
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exam Center</h1>
        <p className="text-base-content/60 text-sm">Theoretical knowledge validation & rank upgrades.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-base-300 rounded-xl animate-pulse"></div>)}
        </div>
      ) : exams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all">
              <div className="card-body">
                {/* Header Kartu */}
                <div className="flex justify-between items-start">
                  <div className="badge badge-outline text-xs">{exam.courseTitle}</div>
                  {exam.lastAttempt && (
                    <div className={`badge ${getStatusBadge(exam.lastAttempt.status)} text-xs font-bold`}>
                      {exam.lastAttempt.status.replace('_', ' ')}
                    </div>
                  )}
                </div>

                <h2 className="card-title mt-2">{exam.title}</h2>
                <p className="text-sm text-base-content/60">
                  {exam.questionCount} Questions &bull; Passing Score 80%
                </p>

                <div className="card-actions justify-end mt-4">
                  {/* Logic Tombol */}
                  {exam.lastAttempt?.status === 'PASSED' ? (
                    <button className="btn btn-success btn-soft btn-sm text-white btn-disabled">
                      Completed
                    </button>
                  ) : (
                    <Link href={`/dashboard/exams/${exam.id}`} className="btn btn-primary btn-soft btn-sm">
                      {exam.lastAttempt ? "Retake Exam" : "Start Exam"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 opacity-50">
          No exams available for your rating at this moment.
        </div>
      )}
    </div>
  )
}