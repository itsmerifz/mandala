/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useParams, useRouter } from "next/navigation"

export default function GradingPage() {
  const { submissionId } = useParams()
  const router = useRouter()

  const [sub, setSub] = useState<any>(null)
  const [grades, setGrades] = useState<Record<string, number>>({}) // { questionId: score }
  const [feedback, setFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchDetail = async () => {
      // @ts-expect-error submissionId error
      const { data } = await api.api.admin.grading[submissionId].get()
      if (data?.status === 'success') setSub(data.data)
    }
    if (submissionId) fetchDetail()
  }, [submissionId])

  const handleScoreChange = (qId: string, maxPoints: number, val: string) => {
    let score = parseInt(val) || 0;
    if (score > maxPoints) score = maxPoints; // Prevent overscore
    if (score < 0) score = 0;
    setGrades(prev => ({ ...prev, [qId]: score }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Siapkan payload hanya untuk soal ESSAY (atau soal yang manual graded)
      const gradedAnswers = sub.exam.questions
        .filter((q: any) => q.type === 'ESSAY')
        .map((q: any) => ({
          questionId: q.id,
          pointsAwarded: grades[q.id] || 0,
          isCorrect: (grades[q.id] || 0) > (q.points / 2) // Logic kasar: > 50% poin = benar
        }))

      const res = await api.api.admin.grading.submit.post({
        submissionId: submissionId as string,
        adminFeedback: feedback,
        gradedAnswers
      })

      if (res.data?.status === 'success') {
        alert(`Grading Complete! Final Score: ${res.data.data.finalScore.toFixed(2)}% (${res.data.data.finalStatus})`)
        router.push('/dashboard/admin/grading')
      }
    } catch (e) {
      alert(`Error saving grades, Message: ${e}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!sub) return <div>Loading submission...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Grading: {sub.user.name}</h1>
          <p className="opacity-60">{sub.exam.title}</p>
        </div>
        <div className="badge badge-warning">PENDING REVIEW</div>
      </div>

      <div className="space-y-6">
        {sub.exam.questions.map((q: any, i: number) => {
          const answer = sub.answers.find((a: any) => a.questionId === q.id)

          return (
            <div key={q.id} className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body">
                <div className="flex justify-between">
                  <h3 className="font-bold">Q{i + 1}: {q.text}</h3>
                  <span className="badge badge-ghost">Max: {q.points} pts</span>
                </div>

                {/* Jawaban User */}
                <div className="bg-base-200 p-4 rounded-lg mt-2">
                  {q.type === 'ESSAY' ? (
                    <p className="whitespace-pre-wrap">{answer?.textAnswer || "(No Answer)"}</p>
                  ) : (
                    <p>Selected Option ID: {answer?.selectedOptionId} (Auto-graded)</p>
                  )}
                </div>

                {/* Input Nilai (Hanya untuk Essay) */}
                {q.type === 'ESSAY' && (
                  <div className="form-control w-full max-w-xs mt-4">
                    <label className="label">
                      <span className="label-text font-bold text-primary">Score Awarded</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered input-primary"
                      value={grades[q.id] || 0}
                      onChange={(e) => handleScoreChange(q.id, q.points, e.target.value)}
                      max={q.points}
                      min={0}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Feedback & Submit */}
      <div className="card bg-base-100 border border-base-200">
        <div className="card-body">
          <h3 className="font-bold">Overall Feedback</h3>
          <textarea
            className="textarea textarea-bordered h-24"
            placeholder="Good job on the procedures..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary">
          {submitting ? "Saving..." : "Finalize & Submit Results"}
        </button>
      </div>
    </div>
  )
}