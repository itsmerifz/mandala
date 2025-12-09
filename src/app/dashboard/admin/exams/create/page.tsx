/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/client"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import FileUploader from "@/components/file_uploader" // Pastikan komponen ini sudah dibuat
import { toast } from "sonner"

export default function CreateExamPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [lastUploaded, setLastUploaded] = useState<{ url: string, type: string } | null>(null)

  // Form State
  const [examDetails, setExamDetails] = useState({
    title: "",
    passingScore: 80,
    questionCount: 0,
    prerequisiteId: "",
    isSelection: false, // Default: Bukan ujian seleksi
    minRating: 1        // Default: OBS (1)
  })

  // Question State
  const [questions, setQuestions] = useState<any[]>([])

  // Load Courses untuk Prerequisite dropdown
  useEffect(() => {
    api.api.lms.get({ $query: { cid: "admin", mode: "admin" } }).then(({ data }) => {
      if (data?.status === 'success') setCourses(data.data ?? [])
    })
  }, [])

  // --- 1. DOWNLOAD TEMPLATE EXCEL ---
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Type: "MULTIPLE_CHOICE",
        Question: "What is the squawk code for emergency?",
        Points: 10,
        "Option 1": "7500", "Option 2": "7600", "Option 3": "7700", "Option 4": "1200",
        "Correct Answer": "7700"
      },
      {
        Type: "TRUE_FALSE",
        Question: "VFR aircraft must request pushback.",
        Points: 5,
        "Option 1": "TRUE", "Option 2": "FALSE", "Option 3": "", "Option 4": "",
        "Correct Answer": "FALSE"
      },
      {
        Type: "ESSAY",
        Question: "Explain the missed approach procedure.",
        Points: 20,
        "Option 1": "", "Option 2": "", "Option 3": "", "Option 4": "", "Correct Answer": ""
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Exam_Import_Template.xlsx");
  }

  // --- 2. PARSE EXCEL UPLOAD ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      const parsedQuestions = data.map((row) => {
        const options = [];
        if (row["Option 1"]) options.push({ text: String(row["Option 1"]), isCorrect: String(row["Option 1"]) == String(row["Correct Answer"]) });
        if (row["Option 2"]) options.push({ text: String(row["Option 2"]), isCorrect: String(row["Option 2"]) == String(row["Correct Answer"]) });
        if (row["Option 3"]) options.push({ text: String(row["Option 3"]), isCorrect: String(row["Option 3"]) == String(row["Correct Answer"]) });
        if (row["Option 4"]) options.push({ text: String(row["Option 4"]), isCorrect: String(row["Option 4"]) == String(row["Correct Answer"]) });

        return {
          text: row["Question"],
          type: row["Type"]?.toUpperCase().trim() || "MULTIPLE_CHOICE",
          points: Number(row["Points"]) || 1,
          options: options
        };
      });

      setQuestions([...questions, ...parsedQuestions]);
      toast.success(`Successfully imported ${parsedQuestions.length} questions!`);
    };
    reader.readAsBinaryString(file);
  };

  // --- 3. HANDLE ASSET UPLOAD ---
  const handleAssetUpload = (url: string, type: 'image' | 'file') => {
    setLastUploaded({ url, type })
    navigator.clipboard.writeText(url)
    toast.success("File uploaded! URL copied to clipboard.")
  }

  // --- 4. SUBMIT FINAL ---
  const handleSubmit = async () => {
    if (!examDetails.title || questions.length === 0) {
      toast.warning("Please fill exam title and add at least one question.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.api.exams.create.post({
        ...examDetails,
        questions: questions as any
      });

      if (res.data?.status === 'success') {
        toast.success("Exam Created Successfully!");
        router.push("/dashboard/admin/exams");
      } else {
        toast.error("Error: " + (res.data as any)?.message);
      }
    } catch (e) {
      console.error(e)
      
      toast.error("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeQuestion = (idx: number) => {
    const newQ = [...questions];
    newQ.splice(idx, 1);
    setQuestions(newQ);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-base-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Create New Exam</h1>
          <p className="text-sm opacity-60">Setup details and import questions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* KOLOM KIRI: SETTINGS & TOOLS */}
        <div className="space-y-6">

          {/* Card 1: Exam Settings */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-2">Exam Settings</h3>

              <div className="form-control">
                <label className="label">Title</label>
                <input type="text" className="input input-bordered" placeholder="e.g. S2 Theory Exam"
                  value={examDetails.title} onChange={e => setExamDetails({ ...examDetails, title: e.target.value })} />
              </div>

              {/* Prerequisite (Hanya jika bukan Seleksi) */}
              {!examDetails.isSelection && (
                <div className="form-control">
                  <label className="label">Prerequisite Course</label>
                  <select className="select select-bordered"
                    value={examDetails.prerequisiteId}
                    onChange={e => setExamDetails({ ...examDetails, prerequisiteId: e.target.value })}>
                    <option value="">No Prerequisite</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">Pass Score (%)</label>
                  <input type="number" className="input input-bordered"
                    value={examDetails.passingScore} onChange={e => setExamDetails({ ...examDetails, passingScore: parseInt(e.target.value) })} />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Random Qty</span>
                    <span className="label-text-alt opacity-50">0=All</span>
                  </label>
                  <input type="number" className="input input-bordered" placeholder="0"
                    value={examDetails.questionCount} onChange={e => setExamDetails({ ...examDetails, questionCount: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="divider my-2"></div>

              {/* --- SELECTION MODE TOGGLE --- */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={examDetails.isSelection}
                    onChange={e => setExamDetails({ ...examDetails, isSelection: e.target.checked })}
                  />
                  <div className="flex flex-col">
                    <span className="label-text font-bold">Selection Mode</span>
                    <span className="text-[10px] opacity-60">Enables App Form & Code Generation</span>
                  </div>
                </label>
              </div>

              {/* Max Rating Input (Hanya jika Seleksi ON) */}
              {examDetails.isSelection && (
                <div className="form-control bg-base-200/50 p-3 rounded-lg border border-base-300 mt-2">
                  <label className="label pt-0">
                    <span className="label-text font-bold text-xs">Max Rating Allowed</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={examDetails.minRating}
                    onChange={e => setExamDetails({ ...examDetails, minRating: parseInt(e.target.value) })}
                  >
                    <option value="1">OBS - Observer Only</option>
                    <option value="2">S1 - Tower Trainee</option>
                    <option value="3">S2 - Tower Controller</option>
                  </select>
                  <div className="label pb-0">
                    <span className="text-[10px] text-warning">Users above this will NOT see this exam.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Asset Uploader */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body bg-base-200/30">
              <h3 className="font-bold text-sm mb-2">Asset Uploader</h3>
              <p className="text-xs opacity-60 mb-3">Upload images/PDF for questions. Copy the URL to your Excel/Form.</p>

              <FileUploader onUploadComplete={handleAssetUpload} />

              {lastUploaded && (
                <div className="mt-3 p-2 bg-white rounded border text-xs break-all">
                  <span className="font-bold block text-success mb-1">Upload Success!</span>
                  <code className="bg-base-200 p-1 rounded select-all block">
                    {lastUploaded.type === 'image'
                      ? `![Image](${lastUploaded.url})`
                      : `[Download PDF](${lastUploaded.url})`}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Import Excel */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body bg-base-200/50">
              <h3 className="font-bold text-lg mb-2">Import Questions</h3>

              <button onClick={handleDownloadTemplate} className="btn btn-outline btn-sm w-full mb-4 gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Template
              </button>

              <input
                type="file"
                accept=".xlsx, .csv"
                className="file-input file-input-bordered file-input-primary w-full file-input-sm"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: PREVIEW SOAL */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Questions Preview ({questions.length})</h3>
            <button className="btn btn-xs btn-ghost text-error" onClick={() => setQuestions([])}>Clear All</button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl opacity-30 flex flex-col items-center justify-center gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>No questions added yet. Upload a file to populate.</span>
            </div>
          ) : (
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
              {questions.map((q, idx) => (
                <div key={idx} className="card bg-base-100 border border-base-200 card-compact relative group hover:border-primary/50 transition-colors">
                  <button
                    onClick={() => removeQuestion(idx)}
                    className="btn btn-xs btn-circle btn-error absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>

                  <div className="card-body">
                    <div className="flex gap-2 mb-1">
                      <span className="badge badge-neutral badge-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">{idx + 1}</span>
                      <span className="badge badge-primary badge-outline badge-xs">{q.type}</span>
                      <span className="badge badge-ghost badge-xs">{q.points} pts</span>
                    </div>
                    <p className="font-semibold text-sm whitespace-pre-wrap">{q.text}</p>

                    {/* Preview Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt: any, oIdx: number) => (
                          <div key={oIdx} className={`text-xs px-2 py-1 rounded border flex items-center gap-2 ${opt.isCorrect ? 'bg-success/10 border-success text-success font-bold' : 'bg-base-200 border-transparent opacity-70'}`}>
                            {opt.isCorrect ? '✓' : '•'} {opt.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Action */}
      <div className="fixed bottom-0 left-0 lg:left-80 right-0 p-4 bg-base-100 border-t border-base-200 flex justify-end gap-4 z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
        <button
          className="btn btn-primary px-8"
          onClick={handleSubmit}
          disabled={submitting || questions.length === 0 || !examDetails.title}
        >
          {submitting ? <span className="loading loading-spinner"></span> : `Create Exam (${questions.length} Q)`}
        </button>
      </div>
    </div>
  )
}