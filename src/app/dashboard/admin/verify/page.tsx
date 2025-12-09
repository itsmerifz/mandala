/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { api } from "@/lib/client"
import { Search, CheckCircle, XCircle, User, FileText, Calendar } from "lucide-react"

export default function VerifyCodePage() {
  const [code, setCode] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code) return

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await api.api.admin['verify-code'].post({ code })

      if (res.data?.status === 'success') {
        setResult(res.data.data)
      } else {
        setError(res.error?.value?.message || "Invalid Code")
      }
    } catch (err) {
      console.error(err)
      setError("Verification failed. Please check connection.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-2 pt-10">
        <h1 className="text-3xl font-bold">Application Verification</h1>
        <p className="text-base-content/60">Enter the unique code provided by the candidate to verify their result.</p>
      </div>

      {/* SEARCH BOX */}
      <div className="card bg-base-100 shadow-lg border border-base-200">
        <div className="card-body">
          <form onSubmit={handleVerify} className="flex gap-2">
            <input
              type="text"
              className="input input-bordered w-full font-mono text-lg uppercase"
              placeholder="IDvACC-SEL-XXXXXXX-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !code}
              className="btn btn-primary px-8 btn-soft"
            >
              {loading ? <div className="loading loading-spinner"></div> : <Search className="w-5 h-5" />}
              Verify
            </button>
          </form>
        </div>
      </div>

      {/* RESULT AREA */}
      {error && (
        <div className="alert alert-error bg-error/10 border-error/20 text-error animate-in fade-in slide-in-from-top-4">
          <XCircle className="w-6 h-6" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {result && (
        <div className="card bg-base-100 shadow-xl border border-success/30 animate-in zoom-in duration-300">
          <div className="card-body">
            {/* Status Header */}
            <div className="flex items-center gap-4 border-b border-base-200 pb-6 mb-6">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center text-success">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-success">Valid Application Code</h2>
                <p className="text-sm opacity-60 font-mono">{result.generatedCode}</p>
              </div>
              <div className="ml-auto text-right">
                <div className="badge badge-lg badge-success badge-soft font-bold">{result.status}</div>
                <div className="text-xs mt-1 opacity-50">Score: {result.score}%</div>
              </div>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Candidate Info */}
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-sm uppercase opacity-50">
                  <User className="w-4 h-4" /> Candidate Details
                </h3>
                <div className="bg-base-200/50 p-4 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between border-b border-base-300 pb-2">
                    <span className="opacity-70">Name</span>
                    <span className="font-bold">{result.user.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-base-300 pb-2">
                    <span className="opacity-70">CID</span>
                    <span className="font-mono font-bold">{result.user.cid}</span>
                  </div>
                  <div className="flex justify-between border-b border-base-300 pb-2">
                    <span className="opacity-70">Current Rating</span>
                    <span className="font-bold">{result.user.ratingShort} ({result.user.ratingLong})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Email</span>
                    <span className="font-mono">{result.user.email}</span>
                  </div>
                </div>
              </div>

              {/* Exam Info */}
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-sm uppercase opacity-50">
                  <Calendar className="w-4 h-4" /> Exam Context
                </h3>
                <div className="bg-base-200/50 p-4 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between border-b border-base-300 pb-2">
                    <span className="opacity-70">Exam Title</span>
                    <span className="font-bold">{result.exam.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Completed At</span>
                    <span className="font-mono">
                      {new Date(result.completedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Essays */}
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="font-bold flex items-center gap-2 text-sm uppercase opacity-50 mb-2">
                  <FileText className="w-4 h-4" /> Reason For Joining
                </h3>
                <div className="p-4 bg-base-200/30 rounded-lg text-sm italic">
                  &quot;{result.appReason}&quot;
                </div>
              </div>

              <div>
                <h3 className="font-bold flex items-center gap-2 text-sm uppercase opacity-50 mb-2">
                  <FileText className="w-4 h-4" /> Expectations
                </h3>
                <div className="p-4 bg-base-200/30 rounded-lg text-sm italic">
                  &quot;{result.appExpectation}&quot;
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}