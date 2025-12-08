/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/client"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx" // Import SheetJS
import FileUploader from "@/components/file_uploader"

export default function CreateExamPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [lastUploaded, setLastUploaded] = useState<{ url: string, type: string } | null>(null)

  // Form State
  const [examDetails, setExamDetails] = useState({
    title: "",
    passingScore: 80,
    prerequisiteId: "",
    questionCount: 0
  })

  const handleUploadComplete = (url: string, type: 'image' | 'file') => {
    setLastUploaded({ url, type })
    // Bisa juga auto-copy ke clipboard
    navigator.clipboard.writeText(url)
    alert("File uploaded! URL copied to clipboard.")
  }

  // Question State (Array of objects)
  const [questions, setQuestions] = useState<any[]>([])

  // Load Courses untuk Prerequisite dropdown
  useEffect(() => {
    // Panggil API list course (mode admin agar muncul semua)
    api.api.lms.get({ $query: { cid: "admin", mode: "admin" } }).then(({ data }) => {
      if (data?.status === 'success') setCourses(data.data ?? [])
    })
  }, [])

  // --- LOGIC 1: DOWNLOAD TEMPLATE ---
  const handleDownloadTemplate = () => {
    // Data Dummy untuk contoh
    const templateData = [
      {
        Type: "MULTIPLE_CHOICE",
        Question: "What is the squawk code for emergency?",
        Points: 10,
        "Option 1": "7500",
        "Option 2": "7600",
        "Option 3": "7700",
        "Option 4": "1200",
        "Correct Answer": "7700" // Harus sama persis dengan salah satu opsi
      },
      {
        Type: "TRUE_FALSE",
        Question: "VFR aircraft must request pushback.",
        Points: 5,
        "Option 1": "TRUE",
        "Option 2": "FALSE",
        "Option 3": "",
        "Option 4": "",
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

  // --- LOGIC 2: PARSE EXCEL ---
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

      // Mapping Excel Row -> App Question Structure
      const parsedQuestions = data.map((row) => {
        const options = [];

        // Ambil opsi 1-4 jika ada isinya
        if (row["Option 1"]) options.push({ text: String(row["Option 1"]), isCorrect: String(row["Option 1"]) == String(row["Correct Answer"]) });
        if (row["Option 2"]) options.push({ text: String(row["Option 2"]), isCorrect: String(row["Option 2"]) == String(row["Correct Answer"]) });
        if (row["Option 3"]) options.push({ text: String(row["Option 3"]), isCorrect: String(row["Option 3"]) == String(row["Correct Answer"]) });
        if (row["Option 4"]) options.push({ text: String(row["Option 4"]), isCorrect: String(row["Option 4"]) == String(row["Correct Answer"]) });

        return {
          text: row["Question"],
          type: row["Type"]?.toUpperCase().trim() || "MULTIPLE_CHOICE", // Safety
          points: Number(row["Points"]) || 1,
          options: options
        };
      });

      setQuestions([...questions, ...parsedQuestions]);
      alert(`Successfully imported ${parsedQuestions.length} questions!`);
    };
    reader.readAsBinaryString(file);
  };

  // --- LOGIC 3: SUBMIT KE SERVER ---
  const handleSubmit = async () => {
    if (!examDetails.title || questions.length === 0) {
      alert("Please fill exam title and add at least one question.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...examDetails,
        questions: questions
      };

      const res = await api.api.exams.create.post(payload);

      if (res.data?.status === 'success') {
        alert("Exam Created Successfully!");
        router.push("/dashboard/admin/courses"); // Balik ke course manager atau exam list
      } else {
        alert("Error: " + (res.data as any)?.message);
      }
    } catch (e) {
      console.error(e)
      alert("Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus soal dari list preview
  const removeQuestion = (idx: number) => {
    const newQ = [...questions];
    newQ.splice(idx, 1);
    setQuestions(newQ);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center border-b border-base-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Create New Exam</h1>
          <p className="text-sm opacity-60">Setup details and import questions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM KIRI: Settings */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-2">Exam Settings</h3>

              <div className="form-control">
                <label className="label">Title</label>
                <input type="text" className="input input-bordered" placeholder="e.g. S2 Theory Exam"
                  value={examDetails.title} onChange={e => setExamDetails({ ...examDetails, title: e.target.value })} />
              </div>

              <div className="form-control">
                <label className="label">Passing Score (%)</label>
                <input type="number" className="input input-bordered"
                  value={examDetails.passingScore} onChange={e => setExamDetails({ ...examDetails, passingScore: parseInt(e.target.value) })} />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Questions to Ask</span>
                  <span className="label-text-alt opacity-50">0 = All Questions</span>
                </label>
                <input type="number" className="input input-bordered" placeholder="0"
                  value={examDetails.questionCount} onChange={e => setExamDetails({ ...examDetails, questionCount: parseInt(e.target.value) })} />
              </div>

              <div className="form-control">
                <label className="label">Prerequisite Course (Optional)</label>
                <select className="select select-bordered"
                  value={examDetails.prerequisiteId}
                  onChange={e => setExamDetails({ ...examDetails, prerequisiteId: e.target.value })}>
                  <option value="">No Prerequisite</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body bg-base-200/30">
              <h3 className="font-bold text-sm mb-2">Asset Uploader</h3>
              <p className="text-xs opacity-60 mb-3">Upload images for questions here. Copy the URL into your question text.</p>

              <FileUploader onUploadComplete={handleUploadComplete} />

              {lastUploaded && (
                <div className="mt-3 p-2 bg-white rounded border text-xs break-all">
                  <span className="font-bold block text-success">Upload Success!</span>
                  {lastUploaded.type === 'image'
                    ? `Markdown: ![Image](${lastUploaded.url})`
                    : `Link: [Download PDF](${lastUploaded.url})`}
                </div>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body bg-base-200/50">
              <h3 className="font-bold text-lg mb-2">Import Questions</h3>
              <p className="text-xs mb-4 opacity-70">Supports .xlsx and .csv. Format: Type, Question, Points, Option 1-4, Correct Answer.</p>

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

        {/* KOLOM KANAN: Question Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Questions Preview ({questions.length})</h3>
            <button className="btn btn-xs btn-ghost text-error" onClick={() => setQuestions([])}>Clear All</button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-xl opacity-30">
              No questions added yet. Upload a file to populate.
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {questions.map((q, idx) => (
                <div key={idx} className="card bg-base-100 border border-base-200 card-compact relative group">
                  <button
                    onClick={() => removeQuestion(idx)}
                    className="btn btn-xs btn-circle btn-error absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>

                  <div className="card-body">
                    <div className="flex gap-2 mb-1">
                      <span className="badge badge-neutral badge-xs">{idx + 1}</span>
                      <span className="badge badge-primary badge-outline badge-xs">{q.type}</span>
                      <span className="badge badge-ghost badge-xs">{q.points} pts</span>
                    </div>
                    <p className="font-semibold">{q.text}</p>

                    {/* Preview Options */}
                    {q.options && q.options.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {q.options.map((opt: any, oIdx: number) => (
                          <li key={oIdx} className={`text-xs flex items-center gap-2 ${opt.isCorrect ? 'text-success font-bold' : 'opacity-60'}`}>
                            {opt.isCorrect ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            ) : (
                              <span className="w-3 h-3 border rounded-full block"></span>
                            )}
                            {opt.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 lg:left-80 right-0 p-4 bg-base-100 border-t border-base-200 flex justify-end gap-4 z-20">
        <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
        <button
          className="btn btn-primary px-8"
          onClick={handleSubmit}
          disabled={submitting || questions.length === 0}
        >
          {submitting ? <span className="loading loading-spinner"></span> : `Create Exam (${questions.length} Q)`}
        </button>
      </div>
    </div>
  )
}