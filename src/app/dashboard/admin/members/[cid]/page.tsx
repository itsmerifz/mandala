/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"

export default function AdminMemberDetail() {
  const { cid } = useParams()
  const { data: session } = useSession()

  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Fetch Data
  const fetchMember = async () => {
    try {
      // @ts-expect
      const { data } = await api.api.admin.members[cid as string].get()
      if (data?.status === 'success') setMember(data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => {

    if (cid) fetchMember()
  }, [cid])

  // Handler: Ganti Status
  const handleStatusUpdate = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return
    setProcessing(true)
    // @ts-expect
    await api.api.admin.members.status.post({ cid: cid as string, status: newStatus })
    await fetchMember()
    setProcessing(false)
  }

  // Handler: Toggle Sertifikat
  const handleCertToggle = async (code: string, action: 'ADD' | 'REMOVE') => {
    setProcessing(true)
    // @ts-expect 
    await api.api.admin.members.certificate.post({
      targetCid: cid as string,
      code,
      action,
      issuerId: session?.user?.id as string
    })
    await fetchMember()
    setProcessing(false)
  }

  if (loading) return <div className="p-10 text-center loading loading-spinner">Loading Profile...</div>
  if (!member) return <div className="p-10 text-center text-error">Member not found</div>

  const ALL_CERTS = ['DEL', 'GND', 'TWR', 'APP', 'CTR']
  const STATUS_OPTIONS = ['ACTIVE', 'LOA', 'VISITOR', 'SUSPENDED']

  return (
    <div className="space-y-8 pb-20">
      {/* Header Profil */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between border-b border-base-200 pb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">{member.name}</h1>
            <div className="flex gap-2 text-sm opacity-70 mt-1">
              <span className="font-mono bg-base-200 px-2 rounded">{member.cid}</span>
              <span>•</span>
              <span className="font-bold">{member.ratingLong} ({member.ratingShort})</span>
            </div>
            <div className="mt-2">
              <div className={`badge ${member.rosterStatus === 'ACTIVE' ? 'badge-success' : 'badge-warning'} badge-outline`}>
                {member.rosterStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Status Control */}
        <div className="card bg-base-100 border border-base-200 p-4">
          <div className="text-xs font-bold uppercase opacity-50 mb-2">Change Roster Status</div>
          <div role="tablist" className="tabs tabs-box gap-2">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                disabled={processing}
                onClick={() => handleStatusUpdate(s)}
                className={`tab ${member.rosterStatus === s ? 'tab-active' : ''}`}
              >
                <span className="p-2">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* 1. CERTIFICATE MANAGER */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-base mb-4">Manual Endorsements</h2>
            <div className="grid grid-cols-5 gap-2">
              {ALL_CERTS.map(code => {
                const hasCert = member.certificates.some((uc: any) => uc.certificate.code === code)
                return (
                  <button
                    key={code}
                    disabled={processing}
                    onClick={() => handleCertToggle(code, hasCert ? 'REMOVE' : 'ADD')}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all 
                      ${hasCert
                        ? 'bg-success text-white border-success hover:bg-success/80'
                        : 'bg-base-100 text-base-content/40 border-base-200 hover:border-base-300 hover:bg-base-200'
                      }`}
                  >
                    <span className="font-bold text-sm">{code}</span>
                    <span className="text-[10px] uppercase mt-1">
                      {hasCert ? 'Active' : '-'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 2. STATISTIK / LOGS */}
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-base">Activity Summary</h2>
            <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
              <div className="stat">
                <div className="stat-title">Trainings</div>
                <div className="stat-value text-primary">{member.trainingsAsStudent.length}</div>
                <div className="stat-desc">Sessions recorded</div>
              </div>
              <div className="stat">
                <div className="stat-title">Exams</div>
                <div className="stat-value text-secondary">{member.examSubmissions.length}</div>
                <div className="stat-desc">Attempts made</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HISTORY TABLES (Tabs) */}
      <div role="tablist" className="tabs tabs-lift">

        {/* Tab Training */}
        <input type="radio" name="history_tabs" role="tab" className="tab" aria-label="Training Logs" defaultChecked />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6 rounded-tl-none">
          <table className="table table-xs">
            <thead>
              <tr>
                <th>Date</th>
                <th>Position</th>
                <th>Mentor</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {member.trainingsAsStudent.flatMap((t: any) => t.sessions).map((sess: any) => (
                <tr key={sess.id}>
                  <td>{new Date(sess.startTime).toLocaleDateString()}</td>
                  <td className="font-bold">{sess.position}</td>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs">{sess.mentor?.name || "Unknown"}</span>
                      <span className="font-mono text-[10px] opacity-50">{sess.mentor?.cid || sess.mentorId}</span>
                    </div>
                  </td>
                  <td>{sess.rating}</td>
                </tr>
              ))}
              {member.trainingsAsStudent.length === 0 && <tr><td colSpan={4} className="text-center opacity-50">No training records.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Tab Exams */}
        <input type="radio" name="history_tabs" role="tab" className="tab" aria-label="Exam Results" />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          <table className="table table-xs">
            <thead>
              <tr>
                <th>Date</th>
                <th>Exam Title</th>
                <th>Score</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {member.examSubmissions.map((sub: any) => (
                <tr key={sub.id}>
                  <td>{new Date(sub.startedAt).toLocaleDateString()}</td>
                  <td>{sub.exam.title}</td>
                  <td>{sub.score}%</td>
                  <td>
                    <span className={`badge badge-xs ${sub.status === 'PASSED' ? 'badge-success' : 'badge-error'}`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
              {member.examSubmissions.length === 0 && <tr><td colSpan={4} className="text-center opacity-50">No exam records.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}