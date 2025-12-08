/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client" // Eden Client
import { useSession } from "next-auth/react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown" // Opsional: install 'react-markdown' kalau mau konten module rapi

export default function TakeExamPage() {
  const { submissionId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()

  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const userId = session?.user?.id

  // State Jawaban: { "questionId": "optionId" atau "text answer" }
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const storageKey = `autosave_${submissionId}_${userId}`

  const renderers = {
    // 1. Tangani Link (a tag)
    a: ({ ...props }: any) => {
      const url = props.href || "";
      const isPdf = url.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        return (
          <span className="my-4 block border rounded-xl overflow-hidden bg-base-200 w-full">
            {/* Header kecil biar user tau ini file apa */}
            <span className="p-2 bg-base-300 text-xs font-bold flex justify-between items-center px-4">
              <span>📄 PDF Attachment</span>
              <a href={url} target="_blank" rel="noopener noreferrer" className="link link-primary">
                Open in New Tab ↗
              </a>
            </span>

            {/* IFRAME PDF VIEWER */}
            {/* Kita pakai Google Docs Viewer sebagai fallback yang handal, 
                        atau native iframe jika browser support */}
            <iframe
              src={url}
              className="w-full h-auto"
              title="PDF Viewer"
            >
              {/* Fallback kalau browser gak support PDF embed */}
              <span className="p-4 text-center block">
                Unable to display PDF. <a href={url} className="link">Download here</a>
              </span>
            </iframe>
          </span>
        )
      }

      // Link biasa
      return <a {...props} target="_blank" rel="noopener noreferrer" className="link link-info" />
    },

    // 2. Tangani Gambar (img tag)
    img: ({ ...props }: any) => (
      <Image
        {...props}
        className="max-w-full h-auto rounded-lg border my-2 shadow-sm"
        alt={props.alt || "Question Image"}
      />
    )
  }

  // 1. Fetch Soal
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await api.api.exams.submission[submissionId].get()

        if (data && data.status === 'success') {
          const sub = data.data

          // Set Exam Data
          setExam({
            title: sub.exam.title,
            module: sub.exam.module,
            passingScore: sub.exam.passingScore,
            questions: sub.answers.map((ans: any) => ({
              id: ans.question.id,
              text: ans.question.text,
              type: ans.question.type,
              points: ans.question.points,
              options: ans.question.options
            }))
          })

          // Restore Jawaban (Hanya sekali saat load)
          // Kita gunakan 'typeof window' check di sini
          if (typeof window !== 'undefined') {
            // Gunakan kunci storage yang dikomputasi saat itu juga
            const key = `autosave_${submissionId}_${userId}`
            const savedAnswers = localStorage.getItem(key);
            if (savedAnswers) {
              console.log("📂 Restoring answers...");
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
    if (submissionId) fetchExam()
  }, [userId, submissionId])

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

      // --- PERBAIKAN DI SINI ---
      // Kita kirim submissionId, BUKAN examId/userId
      const res = await api.api.exams.submit.post({
        submissionId: submissionId as string,
        answers: formattedAnswers
      })
      // -------------------------

      if (res.data && res.data.status === 'success') {
        localStorage.removeItem(storageKey);

        const resultData = res.data.data as any;
        alert(`Exam Submitted! Result: ${resultData.result}`)
        router.push('/dashboard/exams')
      } else {
        const errorData = res.data as any;
        alert("Submission failed: " + (errorData?.message || "Unknown error"))
      }
    } catch (err) {
      // Tampilkan error asli untuk debugging
      console.error(err);
      alert(`Error submitting exam: ${err}`)
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
        {/* Cek dulu apakah exam.module ada. Jika tidak, tampilkan label generic */}
        {exam.module ? (
          <div className="badge badge-primary badge-outline">{exam.module.title}</div>
        ) : (
          <div className="badge badge-secondary badge-outline">Final Exam</div>
        )}

        <h1 className="text-3xl font-bold">{exam.title}</h1>
        <p className="text-base-content/60">Passing Score: {exam.passingScore}%</p>
      </div>

      {/* Module Content (Bacaan) */}
      {exam.module?.content && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body prose max-w-none">
            <h2 className="card-title">Study Material</h2>
            <div className="bg-base-200/50 p-4 rounded-lg text-sm">
              {/* Cek tipe modul untuk render Markdown atau Slide */}
              {exam.module.type === 'SLIDE' ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-sm">
                  <iframe
                    src={exam.module.content}
                    className="w-full h-full"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <ReactMarkdown components={renderers}>{exam.module.content}</ReactMarkdown>
              )}
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
                <span className="mr-2">{index + 1}.</span>
                {/* GANTI q.text STRING BIASA DENGAN MARKDOWN */}
                <div className="inline-block align-top prose prose-sm max-w-none">
                  <ReactMarkdown components={renderers}>{q.text}</ReactMarkdown>
                </div>
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