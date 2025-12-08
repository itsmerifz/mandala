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

  // Helper function untuk mencari jawaban benar
  const getCorrectOption = (question: any) => {
    return question.options.find((o: any) => o.isCorrect)?.text || "N/A"
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Siapkan payload hanya untuk soal ESSAY (atau soal yang manual graded)
      const gradedAnswers = sub.answers
        .map((ans: any) => ans.question) // Ambil objek pertanyaan dari relasi jawaban
        .filter((q: any) => q && q.type === 'ESSAY') // Filter hanya yang Essay & valid
        .map((q: any) => ({
          questionId: q.id,
          // Ambil nilai dari state grades, atau fallback ke nilai database jika belum diedit
          pointsAwarded: grades[q.id] !== undefined
            ? grades[q.id]
            : (sub.answers.find((a: any) => a.questionId === q.id)?.pointsAwarded || 0),

          // Essay dianggap 'correct' secara teknis agar poinnya dihitung, 
          // tapi kualitas jawaban dinilai dari poinnya (full/partial).
          isCorrect: true
        }))

      const res = await api.api.admin.grading.submit.post({
        submissionId: submissionId as string,
        adminFeedback: feedback,
        gradedAnswers
      })

      if (res.data?.status === 'success') {
        alert(`Grading Complete! Score: ${res.data.data.finalScore}`)

        // Redirect ke list antrian (karena item ini sudah bukan 'pending' lagi, harusnya hilang dari list)
        router.push('/dashboard/admin/grading')

        // Atau refresh halaman ini
        // router.refresh() 
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
        {sub.answers.map((answer: any, i: number) => {
          const q = answer.question; // Data pertanyaan ada di dalam relasi
          const isCorrect = answer.isCorrect;

          return (
            <div key={q.id} className={`card border shadow-sm ${isCorrect ? 'bg-base-100 border-success/30' : 'bg-base-100 border-base-200'}`}>
              <div className="card-body">
                <div className="flex justify-between">
                  <h3 className="font-bold text-lg">Q{i + 1}: {q.text}</h3>
                  <div className="flex gap-2">
                    <span className="badge badge-ghost">Max: {q.points} pts</span>
                    {/* Tampilkan Poin yang didapat */}
                    <span className={`badge ${answer.pointsAwarded > 0 ? 'badge-primary' : 'badge-ghost'}`}>
                      Earned: {answer.pointsAwarded}
                    </span>

                    {q.type !== 'ESSAY' && (
                      isCorrect ?
                        <span className="badge badge-success text-white">Correct</span> :
                        <span className="badge badge-error text-white">Incorrect</span>
                    )}
                  </div>
                </div>

                {/* Jawaban Siswa */}
                <div className="bg-base-200/50 p-4 rounded-lg mt-4 text-sm">
                  <p className="font-bold text-xs opacity-50 uppercase mb-1">Student Answer:</p>

                  {q.type === 'ESSAY' ? (
                    <p className="whitespace-pre-wrap font-serif text-base">{answer.textAnswer || "(No Answer)"}</p>
                  ) : (
                    <p className="font-semibold text-lg">
                      {answer.selectedOption?.text || "(No Option Selected)"}
                    </p>
                  )}
                </div>

                {/* Kunci Jawaban (Jika Salah & Bukan Essay) */}
                {q.type !== 'ESSAY' && !isCorrect && (
                  <div className="mt-2 px-4 py-2 bg-success/10 text-success rounded-lg text-xs">
                    <span className="font-bold">Correct Answer: </span>
                    {getCorrectOption(q)}
                  </div>
                )}

                {/* Input Nilai (Khusus Essay) */}
                {q.type === 'ESSAY' && (
                  <div className="form-control w-full max-w-xs mt-4">
                    <label className="label">
                      <span className="label-text font-bold text-primary">Score Awarded</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="input input-bordered input-primary w-24"
                        // Ambil dari state grades ATAU dari database jika sudah pernah dinilai
                        value={grades[q.id] ?? answer.pointsAwarded}
                        onChange={(e) => handleScoreChange(q.id, q.points, e.target.value)}
                        max={q.points}
                        min={0}
                      />
                      <span className="opacity-50">/ {q.points}</span>
                    </div>
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