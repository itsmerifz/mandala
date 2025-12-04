/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { getRatingColor, getRatingLabel } from "@/lib/utils"

export default function LMSPage() {
  const { data: session } = useSession()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.cid) return
    api.api.lms.get({ $query: { cid: session.user.cid } })
      .then(({ data }) => {
        if (data?.status === 'success') setCourses(data.data ?? [])
        setLoading(false)
      })
  }, [session])

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold">Training Academy</h1>
        <p className="text-base-content/60 text-sm">Self-paced learning materials and theory.</p>
      </div>

      {loading ? <div className="text-center py-10">Loading Academy...</div> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all group">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className={`badge ${getRatingColor(course.minRating)} badge-sm opacity-80`}>
                    Min: {getRatingLabel(course.minRating).split(' - ')[0]}
                  </div>
                  {course.isCompleted && (
                    <div className="badge badge-success text-white badge-sm gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Completed
                    </div>
                  )}
                </div>

                <h2 className="card-title mt-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h2>
                <p className="text-sm text-base-content/60 line-clamp-2">
                  {course.description}
                </p>

                <div className="card-actions justify-end mt-4 items-center">
                  <span className="text-xs opacity-50 mr-auto">
                    {course._count.modules} Modules
                  </span>
                  <Link href={`/dashboard/lms/${course.id}`} className="btn btn-primary btn-sm">
                    {course.isCompleted ? "Review" : "Start Learning"}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  )
}