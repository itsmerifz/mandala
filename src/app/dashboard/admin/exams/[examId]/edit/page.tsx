/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useParams } from "next/navigation"
import MarkdownView from "@/components/markdown_view"
import { toast } from "sonner"
import LoadingSpinner from "@/components/loading_spinner"

export default function ExamEditorPage() {
  const { examId } = useParams()
  const [exam, setExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [isEditingQ, setIsEditingQ] = useState(false)
  const [editingQId, setEditingQId] = useState<string | null>(null)
  const [questionForm, setQuestionForm] = useState({
    text: "",
    type: "MULTIPLE_CHOICE",
    points: 10,
    options: [{ text: "", isCorrect: false }]
  })

  const [settings, setSettings] = useState({
    title: "",
    passingScore: 80,
    questionCount: 0
  })

  // Form State untuk Add Question
  const [isAdding, setIsAdding] = useState(false)
  const [newQ, setNewQ] = useState({
    text: "",
    type: "MULTIPLE_CHOICE",
    points: 10,
    options: [{ text: "", isCorrect: false }] // Default 1 opsi
  })

  const fetchExam = async () => {
    // @ts-expect-error data error
    const { data } = await api.api.exams[examId].get()
    if (data?.status === 'success') {
      setExam(data.data ?? [])
      setSettings({
        title: data.data.title,
        passingScore: data.data.passingScore,
        questionCount: data.data.questionCount || 0
      })
    }
    setLoading(false)
  }

  useEffect(() => { if (examId) fetchExam() }, [examId])

  // --- HANDLERS ---

  const handleUpdateSettings = async () => {
    setSavingSettings(true)
    try {
      // @ts-expect-error data error
      await api.api.exams[examId].put(settings)
      toast.success("Settings updated!")
      fetchExam()
    } catch (e) {
      console.error(e)
      toast.error("Failed update settings")
    }
    finally { setSavingSettings(false) }
  }

  const handleEditClick = (q: any) => {
    setIsEditingQ(true)
    setEditingQId(q.id)
    setQuestionForm({
      text: q.text,
      type: q.type,
      points: q.points,
      // Clone options agar tidak merusak state asli sebelum save
      options: q.options.length > 0
        ? q.options.map((o: any) => ({ text: o.text, isCorrect: o.isCorrect }))
        : [{ text: "", isCorrect: false }]
    })
    // Scroll ke form
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setIsEditingQ(false)
    setEditingQId(null)
    setQuestionForm({ text: "", type: "MULTIPLE_CHOICE", points: 10, options: [{ text: "", isCorrect: false }] })
  }

  const handleSaveQuestion = async () => {
    if (!questionForm.text) return toast.warning("Question text required")

    try {
      if (isEditingQ && editingQId) {
        // MODE UPDATE
        await api.api.exams.question[editingQId].put({
          text: questionForm.text,
          type: questionForm.type,
          points: Number(questionForm.points),
          options: questionForm.type === 'ESSAY' ? [] : questionForm.options
        })
      } else {
        // MODE CREATE
        await api.api.exams.question.post({
          examId: examId as string,
          text: questionForm.text,
          type: questionForm.type,
          points: Number(questionForm.points),
          order: (exam.questions.length || 0) + 1,
          options: questionForm.type === 'ESSAY' ? [] : questionForm.options
        })
      }

      handleCancelEdit() // Reset form
      fetchExam() // Refresh list
    } catch (e) {
      console.error(e)
      toast.error("Failed to save question")
    }
  }

  const handleDeleteQ = async (qId: string) => {
    if (!confirm("Delete question?")) return;
    await api.api.exams.question[qId].delete()
    fetchExam()
  }

  const handleAddOption = () => {
    setNewQ({ ...newQ, options: [...newQ.options, { text: "", isCorrect: false }] })
  }

  const handleOptionChange = (idx: number, field: string, val: any) => {
    const opts = [...newQ.options]
    // @ts-expect-error data error
    opts[idx][field] = val
    setNewQ({ ...newQ, options: opts })
  }

  if (loading) return <LoadingSpinner text='Loading Editor...'/>
  if (!exam) return <div>Exam not found</div>

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">

      {/* --- SECTION 1: EXAM SETTINGS --- */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h3 className="font-bold text-lg border-b border-base-200 pb-2 mb-4">Exam Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">Exam Title</label>
              <input type="text" className="input input-bordered"
                value={settings.title} onChange={e => setSettings({ ...settings, title: e.target.value })} />
            </div>
            <div className="form-control">
              <label className="label">Passing Score (%)</label>
              <input type="number" className="input input-bordered"
                value={settings.passingScore} onChange={e => setSettings({ ...settings, passingScore: parseInt(e.target.value) })} />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Questions to Ask</span>
                <span className="label-text-alt opacity-50">0 = All</span>
              </label>
              <input type="number" className="input input-bordered"
                value={settings.questionCount} onChange={e => setSettings({ ...settings, questionCount: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="card-actions justify-end mt-4">
            <button onClick={handleUpdateSettings} disabled={savingSettings} className="btn btn-primary btn-sm">
              {savingSettings ? "Saving..." : "Update Settings"}
            </button>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: QUESTION LIST --- */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Questions ({exam.questions.length})</h3>
          <span className="text-sm opacity-50">Total Points: {exam.questions.reduce((a: any, b: any) => a + b.points, 0)}</span>
        </div>

        {exam.questions.map((q: any, i: number) => (
          <div key={q.id} className={`card bg-base-100 shadow-sm border ${editingQId === q.id ? 'border-primary border-2' : 'border-base-200'}`}>
            <div className="card-body p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-2 flex-1">
                  <span className="badge badge-neutral badge-sm h-6 w-6 rounded-full shrink-0">{i + 1}</span>
                  <div className="font-bold w-full">
                    <MarkdownView content={q.text}/>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1">
                    <span className="badge badge-ghost badge-sm">{q.points} pts</span>
                    <span className="badge badge-outline badge-sm">{q.type}</span>
                  </div>
                  <div className="join">
                    <button onClick={() => handleEditClick(q)} className="btn btn-xs join-item btn-warning btn-outline">Edit</button>
                    <button onClick={() => handleDeleteQ(q.id)} className="btn btn-xs join-item btn-error btn-outline">Del</button>
                  </div>
                </div>
              </div>

              {/* Preview Options */}
              {q.type !== 'ESSAY' && (
                <div className="ml-8 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt: any) => (
                    <div key={opt.id} className={`text-xs px-2 py-1 rounded border flex items-center gap-2 ${opt.isCorrect ? 'bg-success/10 border-success text-success font-bold' : 'bg-base-200 border-transparent opacity-70'}`}>
                      {opt.isCorrect ? '✓' : '•'} {opt.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- SECTION 3: QUESTION FORM (ADD / EDIT) --- */}
      <div className="card bg-base-200 border border-base-300 shadow-xl mt-8">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-primary">
              {isEditingQ ? "✏️ Edit Question" : "➕ Add New Question"}
            </h3>
            {isEditingQ && (
              <button onClick={handleCancelEdit} className="btn btn-xs btn-ghost">
                Cancel Editing
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Type & Points */}
            <div className="flex gap-4">
              <select className="select select-bordered select-sm w-full max-w-xs"
                value={questionForm.type} onChange={e => setQuestionForm({ ...questionForm, type: e.target.value })}>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="ESSAY">Essay</option>
              </select>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">Points:</span>
                <input type="number" className="input input-bordered input-sm w-24"
                  value={questionForm.points} onChange={e => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })} />
              </div>
            </div>

            {/* Text */}
            <textarea className="textarea textarea-bordered w-full font-mono text-sm" placeholder="Question Text (Supports Markdown & Image URL)"
              value={questionForm.text} onChange={e => setQuestionForm({ ...questionForm, text: e.target.value })}></textarea>

            {/* Options Editor */}
            {questionForm.type !== 'ESSAY' && (
              <div className="space-y-2 pl-4 border-l-4 border-base-300 bg-base-100/50 p-2 rounded">
                <p className="text-xs font-bold opacity-50 uppercase">Answer Options</p>
                {questionForm.options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="checkbox" className="checkbox checkbox-success checkbox-sm"
                      checked={opt.isCorrect} onChange={e => handleOptionChange(idx, 'isCorrect', e.target.checked)} />
                    <input type="text" className="input input-bordered input-sm flex-1" placeholder={`Option ${idx + 1}`}
                      value={opt.text} onChange={e => handleOptionChange(idx, 'text', e.target.value)} />
                    {/* Hapus Opsi Button */}
                    <button className="btn btn-xs btn-circle btn-ghost text-error"
                      onClick={() => {
                        const newOpts = [...questionForm.options];
                        newOpts.splice(idx, 1);
                        setQuestionForm({ ...questionForm, options: newOpts });
                      }}>✕</button>
                  </div>
                ))}
                <button onClick={handleAddOption} className="btn btn-xs btn-ghost text-primary">+ Add Option</button>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button onClick={handleSaveQuestion} className={`btn ${isEditingQ ? 'btn-warning' : 'btn-primary'} w-32`}>
                {isEditingQ ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}