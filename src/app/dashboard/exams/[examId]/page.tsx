/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client" // Eden Client
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown" // Opsional: install 'react-markdown' kalau mau konten module rapi

export default function TakeExamPage() {
  const params = useParams()
  const { data: session } = useSession()
  const router = useRouter()

  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const examId = Array.isArray(params.examId) ? params.examId[0] : params.examId
  const userId = session?.user?.id

  // State Jawaban: { "questionId": "optionId" atau "text answer" }
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const storageKey = `autosave_${examId}_${userId}`

  // 1. Fetch Soal
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await api.api.exams[examId as string].get()
        if (data && data.status === 'success') {
          setExam(data.data)

          if (typeof window !== 'undefined' && userId) {
            const savedAnswers = localStorage.getItem(storageKey);
            if (savedAnswers) {
              console.log("📂 Restoring answers from local storage...");
              setAnswers(JSON.parse(savedAnswers));
              setLastSaved(new Date());
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (examId) fetchExam()
  }, [examId, storageKey, userId])

  // 2. Handle Input Jawaban
  const handleAnswerChange = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };

    // Update State React
    setAnswers(newAnswers);

    // Update Local Storage
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(newAnswers));
      setLastSaved(new Date()); // Update waktu simpan
    }
  }

  // 3. Handle Submit
  const handleSubmit = async () => {
    if (!confirm("Are you sure you want to finish this exam?")) return;

    setSubmitting(true)
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        value: val
      }));

      const res = await api.api.exams.submit.post({
        examId: examId as string,
        userId: session?.user?.id as string,
        answers: formattedAnswers
      })

      if (res.data && res.data.status === 'success') {
        // --- PENTING: BERSIHKAN AUTOSAVE SETELAH SUKSES ---
        localStorage.removeItem(storageKey);
        // --------------------------------------------------

        // Gunakan type assertion
        const resultData = res.data.data as any;
        alert(`Exam Submitted! Result: ${resultData.result}`)
        router.push('/dashboard/exams')
      } else {
        const errorData = res.data as any;
        alert("Submission failed: " + (errorData?.message || "Unknown error"))
      }
    } catch (err) {
      alert(`Error submitting exam. Please check your connection. Message: ${err}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-10 text-center loading loading-spinner">Loading Exam...</div>
  if (!exam) return <div className="p-10 text-center text-error">Exam not found or failed to load.</div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 relative">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="badge badge-primary badge-outline">{exam.module.title}</div>
        <h1 className="text-3xl font-bold">{exam.title}</h1>
        <p className="text-base-content/60">Passing Score: {exam.passingScore}%</p>
      </div>

      {/* Module Content (Bacaan) */}
      {exam.module.content && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body prose max-w-none">
            <h2 className="card-title">Study Material</h2>
            <div className="bg-base-200/50 p-4 rounded-lg text-sm whitespace-pre-wrap">
              {exam.module.content}
            </div>
          </div>
        </div>
      )}

      <div className="divider">QUESTIONS</div>

      {/* Questions List */}
      <div className="space-y-6">
        {exam.questions.map((q: any, index: number) => (
          <div key={q.id} className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-4">
                {index + 1}. {q.text}
                <span className="text-xs font-normal opacity-50 ml-2">({q.points} pts)</span>
              </h3>

              {/* Tampilan berdasarkan Tipe Soal */}
              {q.type === 'ESSAY' ? (
                <textarea
                  className="textarea textarea-bordered w-full h-32"
                  placeholder="Type your answer here..."
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                ></textarea>
              ) : (
                <div className="flex flex-col gap-2">
                  {q.options.map((opt: any) => (
                    <label key={opt.id} className="label cursor-pointer justify-start gap-4 p-3 border border-base-200 rounded-lg hover:bg-base-200/50 transition">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        className="radio radio-primary radio-sm"
                        checked={answers[q.id] === opt.id}
                        onChange={() => handleAnswerChange(q.id, opt.id)}
                      />
                      <span className="label-text">{opt.text}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 lg:left-80 right-0 p-4 bg-base-100 border-t border-base-200 flex justify-end gap-4 z-20">
        <div className="">
          {lastSaved ? (
            <div className="badge badge-success gap-2 shadow-lg animate-pulse text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-4 h-4 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Saved locally {lastSaved.toLocaleTimeString()}
            </div>
          ) : (
            <div className="badge badge-ghost gap-2 shadow-lg">
              Ready to save
            </div>
          )}
        </div>
        <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
        <button
          className="btn btn-primary px-8"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <span className="loading loading-spinner"></span> : "Submit Exam"}
        </button>
      </div>
    </div>
  )
}