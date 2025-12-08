/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import Link from "next/link"

export default function AdminExamList() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExams = async () => {
    // Panggil dengan mode admin
    api.api.exams.get({ $query: { mode: 'admin' } }).then(({ data }) => {
      if (data?.status === 'success') setExams(data.data)
      setLoading(false)
    })
  }

  useEffect(() => { fetchExams() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exam? All student submissions will be lost!")) return;
    await api.api.exams[id].delete()
    fetchExams()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-base-300 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Exam Manager</h1>
          <p className="text-sm opacity-60">Create, edit, and assign exams.</p>
        </div>
        <Link href="/dashboard/admin/exams/create" className="btn btn-sm btn-primary">
          + Create / Import
        </Link>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Title</th>
              <th>Context (Linked To)</th>
              <th>Questions</th>
              <th>Pass Score</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center">Loading...</td></tr> :
              exams.map((exam) => (
                <tr key={exam.id} className="hover">
                  <td className="font-bold">{exam.title}</td>
                  <td><div className="badge badge-ghost badge-sm">{exam.context}</div></td>
                  <td>{exam.questionCount}</td>
                  <td>{exam.passingScore}%</td>
                  <td className="text-right flex justify-end gap-2">
                    <Link href={`/dashboard/admin/exams/${exam.id}/edit`} className="btn btn-xs btn-neutral">
                      Edit Questions
                    </Link>
                    <button onClick={() => handleDelete(exam.id)} className="btn btn-xs btn-error btn-outline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}