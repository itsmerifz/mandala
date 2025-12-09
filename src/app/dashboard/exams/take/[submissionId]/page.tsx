/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"

export default function TakeExamPage() {
  const { submissionId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()

  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const userId = session?.user?.id

  // State Jawaban Soal
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // State Autosave Indicator
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const storageKey = `autosave_${submissionId}_${userId}`

  // --- STATE BARU: INPUT SELEKSI ---
  const [appData, setAppData] = useState({ reason: "", expectation: "" })
  // --- STATE BARU: HASIL CODE ---
  const [resultCode, setResultCode] = useState<string | null>(null)

  // Custom Renderer untuk Markdown (Gambar & PDF)
  const renderers = {
    a: ({ ...props }: any) => {
      const url = props.href || "";
      const isPdf = url.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        return (
          <span className="my-4 block border rounded-xl overflow-hidden bg-base-200 w-full">
            <span className="p-2 bg-base-300 text-xs font-bold flex justify-between items-center px-4">
              <span>📄 PDF Attachment</span>
              <a href={url} target="_blank" rel="noopener noreferrer" className="link link-primary">Open in New Tab ↗</a>
            </span>
            <iframe src={url} className="w-full h-[500px]" title="PDF Viewer">
              <span className="p-4 text-center block">Unable to display PDF. <a href={url} className="link">Download here</a></span>
            </iframe>
          </span>
        )
      }
      return <a {...props} target="_blank" rel="noopener noreferrer" className="link link-info" />
    },
    img: ({ ...props }: any) => (
      <Image {...props} width={800} height={400} className="max-w-full h-auto rounded-lg border my-2 shadow-sm" alt={props.alt || "Question Image"} />
    )
  }

  // 1. Fetch Exam Data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        // @ts-expect-error data error
        const { data } = await api.api.exams.submission[submissionId].get()

        if (data && data.status === 'success') {
          const sub = data.data

          setExam({
            title: sub.exam.title,
            module: sub.exam.module,
            passingScore: sub.exam.passingScore,
            isSelection: sub.exam.isSelection, // Pastikan field ini terambil
            questions: sub.answers.map((ans: any) => ({
              id: ans.question.id,
              text: ans.question.text,
              type: ans.question.type,
              points: ans.question.points,
              options: ans.question.options
            }))
          })

          // Restore Jawaban Autosave
          if (typeof window !== 'undefined' && userId) {
            const savedAnswers = localStorage.getItem(storageKey);
            if (savedAnswers) {
              setAnswers(JSON.parse(savedAnswers));
              setLastSaved(new Date());
            }

            // Restore Form Seleksi juga (biar gak ilang kalau refresh)
            const savedApp = localStorage.getItem(storageKey + "_app");
            if (savedApp) setAppData(JSON.parse(savedApp));
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    if (submissionId) fetchExam()
  }, [userId, submissionId, storageKey])

  const totalQuestions = exam?.questions?.length || 0
  // Hitung berapa soal yang jawabannya tidak kosong
  const answeredCount = exam?.questions?.filter((q: any) =>
    answers[q.id] && answers[q.id].trim().length > 0
  ).length || 0

  const areAllQuestionsAnswered = totalQuestions > 0 && answeredCount === totalQuestions

  const isApplicationValid = !exam?.isSelection || (
    appData.reason.trim().length >= 20 &&
    appData.expectation.trim().length >= 20
  )

  const canSubmit = areAllQuestionsAnswered && isApplicationValid

  // 2. Handle Input Jawaban Soal
  const handleAnswerChange = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(newAnswers));
      setLastSaved(new Date());
    }
  }

  // 3. Handle Input Form Seleksi (Auto Save juga)
  const handleAppChange = (field: 'reason' | 'expectation', value: string) => {
    const newData = { ...appData, [field]: value };
    setAppData(newData);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey + "_app", JSON.stringify(newData));
    }
  }

  // 4. Handle Submit
  const handleSubmit = async () => {
    // Validasi Khusus Seleksi
    if (exam.isSelection) {
      if (appData.reason.trim().length < 20) return alert("Please explain your reason for joining (min 20 chars).");
      if (appData.expectation.trim().length < 20) return alert("Please explain your expectations (min 20 chars).");
    }

    if (!confirm("Are you sure you want to finish this exam?")) return;

    setSubmitting(true)
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        value: val
      }));

      const res = await api.api.exams.submit.post({
        submissionId: submissionId as string,
        answers: formattedAnswers,
        // Kirim data seleksi (Backend akan handle ignore jika bukan seleksi)
        appReason: appData.reason,
        appExpectation: appData.expectation
      })

      if (res.data?.status === 'success') {
        // Bersihkan Autosave
        localStorage.removeItem(storageKey);
        localStorage.removeItem(storageKey + "_app");

        const data = res.data.data as any;

        // JIKA SELEKSI & LULUS -> TAMPILKAN MODAL CODE
        if (exam.isSelection && data.result === 'PASSED' && data.generatedCode) {
          setResultCode(data.generatedCode)
          // Jangan redirect dulu!
        } else {
          // Ujian Biasa atau Gagal
          alert(`Exam Finished: ${data.result}`)
          router.push('/dashboard/exams')
        }
      } else {
        const errorMsg = (res.data as any)?.message || "Unknown error";
        alert("Submission failed: " + errorMsg)
      }
    } catch (err) {
      alert(`Error submitting exam: ${err}`)
    } finally {
      setSubmitting(false)
    }
  }

  // --- RENDER MODAL SUKSES (TEMPLATE COPY) ---
  if (resultCode) {
    const copyText = `Name: ${session?.user?.name}
CID: ${session?.user?.cid}
Generated Code: ${resultCode}

Reason For Joining IDvACC:
${appData.reason}

Expectation from IDvACC Training:
${appData.expectation}`;

    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="card bg-base-100 max-w-2xl w-full shadow-2xl border border-success/30 max-h-[90vh] overflow-y-auto">
          <div className="card-body">
            <h2 className="card-title text-success flex gap-2 items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Selection Passed!
            </h2>
            <div className="alert alert-success alert-soft text-sm mt-2">
              <span>Congratulations! You have passed the theoretical test. Please copy the template below to proceed with your application.</span>
            </div>

            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text font-bold">Application Template</span>
                <span className="label-text-alt text-xs">Copy this entire block</span>
              </label>
              <div className="mockup-code bg-neutral text-neutral-content max-h-60 overflow-y-auto">
                <pre className="px-5 py-2 font-mono whitespace-pre-wrap text-sm">{copyText}</pre>
              </div>
            </div>

            <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
              <h3 className="font-bold text-sm mb-3">Next Steps:</h3>
              <ul className="list-decimal list-inside text-sm space-y-2 opacity-80">
                <li>
                  Copy the text above.
                </li>
                <li>
                  Open Ticket using this Link: <a href="https://hq.vat-sea.com/support/create" target="_blank" rel="noopener noreferrer" className="link link-primary font-bold">VATSEA - HQ Page</a>.
                </li>
                <li>
                  Assign Staff to <span className="font-bold">Indonesia vACC Staff</span>.
                </li>
                <li>
                  Insert subject: <span className="font-bold">S1 Training Application</span>.
                </li>
                <li>
                  <span className="font-bold text-warning">Important:</span> Paste the result text above (Name, CID, Code, Reason, Expectation) into the ticket description.
                </li>
                <li>
                  Click <b>Send Ticket</b>.
                </li>
              </ul>

              <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-lg text-xs text-info-content">
                <span className="font-bold block mb-1">Training Information</span>
                Next information about training will be sent via Indonesia vACC Discord, so please join our Discord to stay updated.
              </div>
            </div>

            <div className="card-actions justify-end gap-2 mt-6">
              <button
                className="btn btn-primary btn-soft"
                onClick={() => {
                  navigator.clipboard.writeText(copyText);
                  alert("Template copied to clipboard!");
                }}
              >
                Copy Template
              </button>
              <button className="btn btn-ghost" onClick={() => router.push('/dashboard/exams')}>
                Close & Return
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg"></span></div>
  if (!exam) return <div className="p-10 text-center text-error">Exam not found or failed to load.</div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 relative">
      {/* Header Info */}
      <div className="text-center space-y-2 pt-8">
        {exam.isSelection ? (
          <div className="badge badge-warning font-bold badge-soft">SELECTION TEST</div>
        ) : (
          <div className="badge badge-primary badge-outline">{exam.module?.title || "Exam"}</div>
        )}
        <h1 className="text-3xl font-bold">{exam.title}</h1>
        <p className="text-base-content/60">Passing Score: {exam.passingScore}%</p>
      </div>

      {/* Materi Bacaan (Jika ada) */}
      {exam.module?.content && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body prose max-w-none">
            <h2 className="card-title">Study Material</h2>
            <div className="bg-base-200/50 p-6 rounded-lg text-sm">
              {exam.module.type === 'SLIDE' ? (
                <div className="w-full aspect-video rounded-xl overflow-hidden shadow-sm">
                  <iframe src={exam.module.content} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
                </div>
              ) : (
                <ReactMarkdown components={renderers}>{exam.module.content}</ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="divider">QUESTIONS</div>

      {/* List Soal */}
      <div className="space-y-6">
        {exam.questions.map((q: any, index: number) => (
          <div key={q.id} className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-4 flex gap-3">
                <span className="badge badge-neutral h-6 w-6 rounded-full flex items-center justify-center mt-1">{index + 1}</span>
                <div className="flex-1">
                  <ReactMarkdown components={renderers}>{q.text}</ReactMarkdown>
                </div>
                <span className="text-xs font-normal opacity-50 whitespace-nowrap">({q.points} pts)</span>
              </h3>

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
                    <label key={opt.id} className={`label cursor-pointer justify-start gap-4 p-3 border rounded-lg transition-all
                        ${answers[q.id] === opt.id ? 'border-primary bg-primary/5' : 'border-base-200 hover:bg-base-200/50'}
                    `}>
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

      {/* --- UI INPUT KHUSUS SELEKSI (REASON & EXPECTATION) --- */}
      {exam.isSelection && (
        <div className="card bg-base-100 border border-warning/50 shadow-md mt-8">
          <div className="card-body">
            <h3 className="font-bold text-lg flex items-center gap-2 text-warning-content">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Application Form (Required)
            </h3>
            <p className="text-xs opacity-60 mb-4">Your answers here will be included in the generated application template.</p>

            <div className="flex flex-wrap lg:flex-nowrap justify-center items-center gap-6">
              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-bold">
                  Reason for joining IDvACC
                </label>
                <textarea
                  className="textarea w-full h-24 focus:border-warning"
                  placeholder="Tell us your motivation..."
                  value={appData.reason}
                  onChange={e => handleAppChange('reason', e.target.value)}
                ></textarea>
                <span className="label">Min 20 chars</span>
              </fieldset>

              <fieldset className="fieldset w-full">
                <label className="fieldset-label font-bold">
                  Expectation from IDvACC Training
                </label>
                <textarea
                  className="textarea w-full h-24 focus:border-warning"
                  placeholder="What do you hope to achieve..."
                  value={appData.expectation}
                  onChange={e => handleAppChange('expectation', e.target.value)}
                ></textarea>
                <span className="label">Min 20 chars</span>
              </fieldset>
            </div>

          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 lg:left-80 right-0 p-4 bg-base-100 border-t border-base-200 flex justify-between items-center z-20 shadow-lg">
        <div className="flex items-center gap-2">
          {lastSaved ? (
            <div className="badge badge-success badge-soft animate-pulse gap-1 text-xs">
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          ) : (
            <div className="badge badge-ghost text-xs">Unsaved</div>
          )}
        </div>

        <div className={`text-xs font-bold ${areAllQuestionsAnswered ? 'text-success' : 'text-warning'}`}>
          {answeredCount} / {totalQuestions} Questions Answered
        </div>

        <div className="flex gap-3">
          <button className="btn btn-ghost flex-1 sm:flex-none" onClick={() => router.back()}>Cancel</button>
          <div className="tooltip tooltip-top" data-tip={!canSubmit ? "Complete all questions & forms first" : "Submit now"}>
            <button
              className="btn btn-primary px-8 w-full sm:w-auto btn-soft"
              onClick={handleSubmit}
              // Disable jika sedang submit ATAU form belum valid
              disabled={submitting || !canSubmit}
            >
              {submitting ? <span className="loading loading-spinner"></span> : "Submit Exam"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}