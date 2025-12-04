/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useParams } from "next/navigation"

export default function CourseEditor() {
  const { courseId } = useParams()
  const [course, setCourse] = useState<any>(null)
  const [activeModule, setActiveModule] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state untuk active module
  const [modTitle, setModTitle] = useState("")
  const [modContent, setModContent] = useState("")

  const fetchCourse = async () => {
    // @ts-expect-error data error
    const { data } = await api.api.lms[courseId].get()
    if (data?.status === 'success') {
      setCourse(data.data)
      // Jika sedang edit modul, update datanya juga
      if (activeModule) {
        const updatedMod = data.data.modules.find((m: any) => m.id === activeModule.id)
        if (updatedMod) setActiveModule(updatedMod)
      }
    }
    setLoading(false)
  }

  useEffect(() => { if (courseId) fetchCourse() }, [courseId])

  // Handler Add Module
  const handleAddModule = async () => {
    const title = prompt("Enter Module Title:")
    if (!title) return
    await api.api.lms.module.post({ courseId: courseId as string, title })
    fetchCourse()
  }

  // Handler Select Module
  const selectModule = (mod: any) => {
    setActiveModule(mod)
    setModTitle(mod.title)
    setModContent(mod.content || "")
  }

  // Handler Save Module
  const handleSaveModule = async () => {
    if (!activeModule) return
    setSaving(true)
    await api.api.lms.module[activeModule.id].put({
      title: modTitle,
      content: modContent
    })
    setSaving(false)
    alert("Saved!")
    fetchCourse()
  }

  // Handler Publish Toggle
  const togglePublish = async () => {
    if (!course) return
    const newStatus = !course.isPublished
    // @ts-expect-error data error
    await api.api.lms[courseId].put({ isPublished: newStatus })
    setCourse({ ...course, isPublished: newStatus })
  }

  if (loading) return <div>Loading Editor...</div>
  if (!course) return <div>Course not found</div>

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Toolbar Atas */}
      <div className="flex justify-between items-center bg-base-100 p-4 border-b border-base-200 mb-4 rounded-xl shadow-sm">
        <div>
          <div className="badge badge-outline text-xs mb-1">Course Editor</div>
          <h1 className="text-xl font-bold">{course.title}</h1>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn btn-sm ${course.isPublished ? 'btn-success text-white' : 'btn-ghost border-base-300'}`}
            onClick={togglePublish}
          >
            {course.isPublished ? "Published" : "Draft Mode"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* SIDEBAR: Module List */}
        <div className="w-80 flex flex-col bg-base-100 border border-base-200 rounded-xl">
          <div className="p-4 border-b border-base-200 flex justify-between items-center">
            <h3 className="font-bold text-sm">Modules</h3>
            <button onClick={handleAddModule} className="btn btn-xs btn-ghost text-primary">+ Add</button>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {course.modules.map((mod: any, idx: number) => (
              <button
                key={mod.id}
                onClick={() => selectModule(mod)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center justify-between
                                    ${activeModule?.id === mod.id ? 'bg-neutral text-neutral-content font-bold' : 'hover:bg-base-200'}
                                `}
              >
                <span className="truncate">{idx + 1}. {mod.title}</span>
              </button>
            ))}
            {course.modules.length === 0 && <div className="p-4 text-center text-xs opacity-50">No modules yet.</div>}
          </div>
        </div>

        {/* MAIN: Editor */}
        <div className="flex-1 bg-base-100 border border-base-200 rounded-xl overflow-hidden flex flex-col">
          {activeModule ? (
            <>
              <div className="p-4 border-b border-base-200 flex gap-4 bg-base-200/30">
                <input
                  type="text"
                  className="input input-sm input-ghost font-bold text-lg flex-1"
                  value={modTitle}
                  onChange={e => setModTitle(e.target.value)}
                />
                <button onClick={handleSaveModule} disabled={saving} className="btn btn-sm btn-primary">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
              <div className="flex-1 p-0">
                <textarea
                  className="w-full h-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                  placeholder="# Write your content here using Markdown..."
                  value={modContent}
                  onChange={e => setModContent(e.target.value)}
                ></textarea>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-base-content/30">
              Select or create a module to start editing.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}