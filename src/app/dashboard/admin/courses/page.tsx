/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import Link from "next/link"
import { getRatingColor, getRatingLabel } from "@/lib/utils"
import { toast } from "sonner"

export default function AdminCourseList() {
  const [courses, setCourses] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)

  // Form State untuk Create Baru
  const [newCourse, setNewCourse] = useState({ title: "", description: "", minRating: 1 })

  const fetchCourses = async () => {
    // Kita pakai endpoint LMS public, tapi nanti filter di frontend buat liat semua status
    // Atau idealnya bikin endpoint khusus admin list
    api.api.lms.get({ $query: { cid: "admin", mode: "admin" } }).then(({ data }) => { // cid dummy biar lolos validasi
      if (data?.status === 'success') setCourses(data.data ?? [])
    })
  }

  useEffect(() => { fetchCourses() }, [])

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const res = await api.api.lms.create.post(newCourse)
      if (res.data?.status === 'success') {
        setNewCourse({ title: "", description: "", minRating: 1 })
        // Tutup modal (manual via DOM atau state)
        const modal = document.getElementById('create_modal') as HTMLDialogElement | null
        modal?.close()
        fetchCourses()
      }
    } catch (e) { toast.error("Failed to create") }
    finally { setIsCreating(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Course Manager</h1>
        <button className="btn btn-primary btn-sm btn-soft" onClick={() => (document.getElementById('create_modal') as any).showModal()}>
          + New Course
        </button>
      </div>

      <div className="grid gap-4">
        {courses.map(c => (
          <div key={c.id} className="card bg-base-100 shadow-sm border border-base-200 flex-row p-4 items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{c.title}</h3>
                <span className={`badge badge-soft font-semibold badge-sm ${c.isPublished ? 'badge-success' : 'badge-warning'}`}>
                  {c.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-sm opacity-60 line-clamp-1">{c.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`badge badge-soft font-semibold ${getRatingColor(c.minRating)}`}>
                Min: {getRatingLabel(c.minRating).split(' - ')[0]}
              </span>
              <Link href={`/dashboard/admin/courses/${c.id}`} className="btn btn-sm btn-neutral">
                Edit Content
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Create */}
      <dialog id="create_modal" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Create New Course</h3>
          <div className="py-4 space-y-4">
            <label className="floating-label w-full">
              <span className="label">Title</span>
              <input type="text" className="input"
                value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} />
            </label>
            <label className="floating-label w-full">
              <span className="label">Description</span>
              <input type="text" className="input"
                value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} />
            </label>
            <label className="floating-label w-full">
              <span className="label">Minimal Rating</span>
              <select className="select p-2"
                value={newCourse.minRating}
                onChange={e => setNewCourse({ ...newCourse, minRating: parseInt(e.target.value) })}>
                <option value="1">OBS</option>
                <option value="2">S1</option>
                <option value="3">S2</option>
                <option value="4">S3</option>
                <option value="5">C1</option>
              </select>
            </label>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Cancel</button>
            </form>
            <button className="btn btn-primary btn-soft" onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}