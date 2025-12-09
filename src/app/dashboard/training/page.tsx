/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useSession } from "next-auth/react"
import LoadingSpinner from "@/components/loading_spinner"

export default function TrainingPage() {
  const { data: session } = useSession()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTraining = async () => {
      // Pastikan session ada dan user punya CID
      const user = session?.user
      if (!user?.cid) return

      try {
        // Panggil API dengan parameter CID user yang sedang login
        const { data } = await api.api.training.history[user.cid].get()

        if (data && data.status === 'success') {
          setSessions(data.data ?? [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (session) fetchTraining()
  }, [session])

  // Helper formatting tanggal
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  // Helper warna rating
  const getRatingBadge = (rating: string) => {
    if (rating === 'EXCELLENT') return 'badge-success';
    if (rating === 'UNSATISFACTORY') return 'badge-error';
    return 'badge-info'; // Satisfactory
  }

  if (loading) return <LoadingSpinner text="Loading training history..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Training History</h1>
        <p className="text-base-content/60 text-sm">Track your progress and mentor feedback.</p>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          {sessions.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              No training sessions recorded yet.
            </div>
          ) : (
            <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
              {sessions.map((sess, index) => (
                <li key={sess.id}>
                  <div className="timeline-middle">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-primary">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className={`timeline-${index % 2 === 0 ? 'start' : 'end'} md:text-end mb-10 w-full`}>
                    <time className="font-mono italic text-xs opacity-50">{formatDate(sess.startTime)}</time>
                    <div className="text-lg font-black mt-1">{sess.position}</div>
                    <div className="text-sm font-semibold opacity-70 mb-2 badge badge-soft badge-secondary animate-pulse">
                      Mentor: {sess.mentor.name}
                    </div>

                    <div className="p-4 bg-base-200 rounded-lg text-left shadow-inner">
                      <p className="italic text-sm">&quot;{sess.summary}&quot;</p>
                      <div className={`badge ${getRatingBadge(sess.rating)} badge-sm mt-3 badge-soft font-semibold`}>
                        {sess.rating}
                      </div>
                    </div>

                    <div className="text-xs mt-1 opacity-40 font-mono">
                      {sess.training.title}
                    </div>
                  </div>
                  <hr className="bg-primary" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}