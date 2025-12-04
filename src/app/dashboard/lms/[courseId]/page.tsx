/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"
import Link from "next/link"

export default function CoursePlayerPage() {
  const { courseId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()

  const [course, setCourse] = useState<any>(null)
  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch Course Data
  useEffect(() => {
    // @ts-expect-error data error
    api.api.lms[courseId].get().then(({ data }) => {
      if (data?.status === 'success') {
        setCourse(data.data)
      }
      setLoading(false)
    })
  }, [courseId])

  const activeModule = course?.modules[activeModuleIndex]

  const handleNext = async () => {
    if (activeModuleIndex < course.modules.length - 1) {
      // Pindah ke modul berikutnya
      setActiveModuleIndex(prev => prev + 1)
      window.scrollTo(0, 0)
    } else {
      // Modul terakhir selesai -> Tandai Course Complete
      if (!confirm("You have finished all modules. Mark course as complete?")) return;

      await api.api.lms.complete.post({
        userCid: session?.user?.cid as string,
        courseId: courseId as string
      })
      router.push('/dashboard/lms')
    }
  }

  if (loading) return <div className="p-10 text-center loading loading-spinner">Loading Content...</div>
  if (!course) return <div>Course not found</div>

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">

      {/* SIDEBAR: Module List */}
      <div className="w-full lg:w-80 shrink-0 bg-base-100 border border-base-200 rounded-xl overflow-hidden flex flex-col h-fit lg:h-full">
        <div className="p-4 border-b border-base-200 bg-base-200/30">
          <h2 className="font-bold text-sm uppercase opacity-50">Course Content</h2>
          <h3 className="font-bold text-lg truncate" title={course.title}>{course.title}</h3>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {course.modules.map((mod: any, idx: number) => (
            <button
              key={mod.id}
              onClick={() => setActiveModuleIndex(idx)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center justify-between transition-colors
                                ${idx === activeModuleIndex ? 'bg-primary text-primary-content font-bold shadow-md' : 'hover:bg-base-200 text-base-content/80'}
                            `}
            >
              <span className="truncate mr-2">{idx + 1}. {mod.title}</span>
              {mod.exam && <span className="badge badge-xs badge-warning">Exam</span>}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT: Reader */}
      <div className="flex-1 bg-base-100 border border-base-200 rounded-xl p-6 lg:p-10 overflow-y-auto flex flex-col">
        <div className="flex-1 prose max-w-none">
          <h1>{activeModule.title}</h1>
          <div className="divider"></div>

          {/* Render Markdown Content */}
          <ReactMarkdown>{activeModule.content}</ReactMarkdown>
        </div>

        {/* Footer Navigation */}
        <div className="mt-10 pt-6 border-t border-base-200 flex justify-between items-center">
          <button
            className="btn btn-ghost"
            disabled={activeModuleIndex === 0}
            onClick={() => setActiveModuleIndex(prev => prev - 1)}
          >
            ← Previous
          </button>

          {/* Jika modul ini punya Exam, tampilkan tombol ke Exam */}
          {activeModule.exam ? (
            <Link href={`/dashboard/exams/${activeModule.exam.id}`} className="btn btn-warning">
              Take Exam for this Module
            </Link>
          ) : (
            <button className="btn btn-primary" onClick={handleNext}>
              {activeModuleIndex === course.modules.length - 1 ? "Finish Course 🎉" : "Next Module →"}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}