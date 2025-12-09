/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { api } from "@/lib/client"
import { useSession } from "next-auth/react"
import { User } from "lucide-react"

export default function MentoringPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    studentCid: "",
    position: "",
    rating: "SATISFACTORY",
    summary: "",
    privateNote: ""
  })

  // List Opsi Rating untuk Visual Selector
  const RATING_OPTIONS = [
    {
      id: "UNSATISFACTORY",
      label: "Unsatisfactory",
      desc: "Needs significant improvement. Repeat session required.",
      color: "border-error bg-error/5 hover:bg-error/10 text-error"
    },
    {
      id: "SATISFACTORY",
      label: "Satisfactory",
      desc: "Met the standards. Good to proceed.",
      color: "border-info bg-info/5 hover:bg-info/10 text-info" // atau success/green
    },
    {
      id: "EXCELLENT",
      label: "Excellent",
      desc: "Exceeded expectations. Outstanding performance.",
      color: "border-success bg-success/5 hover:bg-success/10 text-success"
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.cid) return

    setIsLoading(true)
    try {
      const res = await api.api.training.session.post({
        mentorCid: session.user.cid,
        studentCid: formData.studentCid,
        position: formData.position.toUpperCase(),
        duration: "1h 00m",
        rating: formData.rating,
        summary: formData.summary,
        privateNote: formData.privateNote
      })

      if (res.data?.status === 'success') {
        alert("✅ Session Logged Successfully!")
        setFormData({ ...formData, studentCid: "", summary: "", privateNote: "" })
      } else {
        const errorMsg = (res.data as any)?.message || "Unknown error occurred"
        alert("❌ Failed: " + errorMsg)
      }
    } catch (err) {
      alert(`Error: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-base-300 pb-6">
        <div>
          <h1 className="text-2xl font-bold">Instructor Station</h1>
          <p className="text-base-content/60 text-sm">Create a new training record.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* KOLOM KIRI: Detail Sesi */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card 1: Siapa & Dimana */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <User />
                Session Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="input">
                  <span className="label font-medium">Student CID</span>
                  <input
                    type="text"
                    placeholder="1000002"
                    required
                    value={formData.studentCid}
                    onChange={e => setFormData({ ...formData, studentCid: e.target.value })}
                  />
                </label>
                <label className="input">
                  <span className="label font-medium">Position</span>
                  <input
                    type="text"
                    placeholder="WIII_TWR"
                    className="uppercase"
                    required
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Evaluasi & Catatan */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Feedback
              </h3>

              {/* Public Summary */}
              <div className="form-control">
                <label className="label">
                  <div className="flex flex-col justify-start  items-center gap-3 mr-5">
                    <span className="label-text font-medium">Public Summary</span>
                    <span className="badge badge-ghost badge-sm">Visible to Student</span>
                  </div>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32 text-base"
                  placeholder="Explain what was covered, improvements made, and areas to work on..."
                  required
                  value={formData.summary}
                  onChange={e => setFormData({ ...formData, summary: e.target.value })}
                ></textarea>
              </div>

              {/* Private Note (Visual Beda) */}
              <div className="form-control mt-4">
                <label className="label">
                  <div className="flex flex-col justify-start gap-3 mr-5">
                    <span className="label-text font-medium text-error flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Private Staff Notes
                    </span>
                    <span className="badge badge-error badge-outline badge-sm">Staff Only</span>
                  </div>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24 bg-error/5 border-error/20 focus:border-error"
                  placeholder="Internal notes for other mentors (e.g. attitude issues, specific weakness)..."
                  value={formData.privateNote}
                  onChange={e => setFormData({ ...formData, privateNote: e.target.value })}
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Rating Selector */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-4">Performance</h3>
              <div className="flex flex-col gap-3">
                {RATING_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setFormData({ ...formData, rating: option.id })}
                    className={`
                      border-2 rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02]
                      ${formData.rating === option.id
                        ? `${option.color} bg-opacity-100 shadow-md`
                        : 'border-base-200 hover:border-base-300 opacity-70 hover:opacity-100'
                      }
                    `}
                  >
                    <div className="font-bold">{option.label}</div>
                    <div className="text-xs opacity-70 mt-1 leading-tight">{option.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <button
                type="submit"
                className="btn btn-primary w-full btn-lg"
                disabled={isLoading}
              >
                {isLoading ? <span className="loading loading-spinner"></span> : "Submit Report"}
              </button>
              <p className="text-xs text-center text-base-content/50 mt-2">
                Double-check details before submitting.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}