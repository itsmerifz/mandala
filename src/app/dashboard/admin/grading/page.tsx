/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import Link from "next/link"
import LoadingSpinner from "@/components/loading_spinner"

export default function GradingListPage() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.api.admin.grading.pending.get()
        if (data && data.status === 'success') {
          setPending(data.data || [])
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Exam Grading Queue</h1>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Student</th>
                <th>Exam Title</th>
                <th>Submitted At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={4}><LoadingSpinner /></td></tr> :
                pending.length === 0 ? <tr><td colSpan={4} className="text-center opacity-50 py-8">No pending submissions.</td></tr> :
                  pending.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <div className="font-bold">{sub.user.name}</div>
                        <div className="text-xs opacity-50">{sub.user.cid}</div>
                      </td>
                      <td>{sub.exam.title}</td>
                      <td className="text-sm">{new Date(sub.startedAt).toLocaleDateString()}</td>
                      <td>
                        <Link href={`/dashboard/admin/grading/${sub.id}`} className="btn btn-sm btn-primary">
                          Grade Now
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}