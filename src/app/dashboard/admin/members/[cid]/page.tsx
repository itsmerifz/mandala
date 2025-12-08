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
  const [mentors, setMentors] = useState<any[]>([])
  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const [selectedRole, setSelectedRole] = useState("")
  const [selectedMentor, setSelectedMentor] = useState("")
  const [soloForm, setSoloForm] = useState({
    position: "",
    validFrom: new Date().toISOString().split('T')[0], // Hari ini (YYYY-MM-DD)
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +30 Hari
  })

  // Fetch Data
  const fetchMember = async () => {
    try {
      // @ts-expect-error data error
      const resMember = await api.api.admin.members[cid].get()
      const resMentors = await api.api.admin.list.mentors.get()
      if (resMember.data?.status === 'success') {
        const m = resMember.data.data
        setMember(m)
        setSelectedRole(m.role) // Set default role

        // --- POPULATE FORM SOLO JIKA ADA ---
        // Cari training yang sedang aktif dan punya soloDetail
        const activeTr = m.trainingsAsStudent.find((t: any) => t.status === 'IN_PROGRESS' && t.soloDetail);
        if (activeTr && activeTr.soloDetail) {
          setSoloForm({
            position: activeTr.soloDetail.position,
            validFrom: new Date(activeTr.soloDetail.validFrom).toISOString().split('T')[0],
            validUntil: new Date(activeTr.soloDetail.validUntil).toISOString().split('T')[0]
          })
        } else {
          // Reset jika tidak ada solo aktif
          setSoloForm({
            position: "",
            validFrom: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        }

        // Cari mentor yang sedang aktif (dari training terakhir)
        const currentTraining = m.trainingsAsStudent[0] // Ambil yg terbaru
        if (currentTraining && currentTraining.status === 'IN_PROGRESS') {
          setSelectedMentor(currentTraining.mentorId || "")
        }
      }
      if (resMentors.data?.status === 'success') setMentors(resMentors.data.data)
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

  // Handler Assign Solo
  const handleAssignSolo = async () => {
    if (!soloForm.position) return alert("Position required");

    setProcessing(true)
    try {
      await api.api.admin.members['assign-solo'].post({
        studentCid: cid as string,
        position: soloForm.position,
        validFrom: new Date(soloForm.validFrom).toISOString(),
        validUntil: new Date(soloForm.validUntil).toISOString()
      })
      alert("Solo Endorsement Assigned!")
      fetchMember()
    } catch (e) {
      console.error(e)
      alert("Failed")
    }
    finally { setProcessing(false) }
  }

  // Handler Revoke Solo
  const handleRevokeSolo = async () => {
    if (!confirm("Revoke current solo endorsement?")) return;
    setProcessing(true)
    try {
      await api.api.admin.members['revoke-solo'].post({ studentCid: cid as string })
      fetchMember()
    } catch (e) {
      console.error(e)
      alert("Failed")
    }
    finally { setProcessing(false) }
  }

  // Helper cek apakah sedang punya solo aktif
  const currentSolo = member?.trainingsAsStudent.find((t: any) => t.status === 'IN_PROGRESS' && t.soloDetail)?.soloDetail

  const handleRoleUpdate = async () => {
    if (!confirm(`Promote/Demote this user to ${selectedRole}?`)) return;
    setProcessing(true)
    try {
      await api.api.admin.members.role.post({
        targetCid: cid as string,
        role: selectedRole
      })
      alert("Role updated!")
      fetchMember()
    } catch (e) {
      console.error(e)
      alert("Failed")
    }
    finally { setProcessing(false) }
  }

  const handleAssignMentor = async () => {
    setProcessing(true)
    try {
      await api.api.admin.members['assign-mentor'].post({
        studentCid: cid as string,
        mentorId: selectedMentor
      })
      alert("Mentor assigned successfully!")
      fetchMember()
    } catch (e) {
      console.error(e)
      alert("Failed to assign mentor")
    }
    finally { setProcessing(false) }
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
  const ROLES = ['MEMBER', 'MENTOR', 'STAFF', 'ADMIN']

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

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-base mb-4 flex items-center gap-2">
            Administration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. ROLE CHANGER */}
            <div className="form-control">
              <label className="label font-bold">App Role</label>
              <div className="flex gap-2">
                <select
                  className="select w-full"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <button
                  onClick={handleRoleUpdate}
                  disabled={processing || selectedRole === member.role}
                  className="btn btn-primary"
                >
                  Update
                </button>
              </div>
              <div className="label text-xs text-base-content/60">
                MENTOR/STAFF/ADMIN can access instructor station.
              </div>
            </div>

            {/* 2. MENTOR ASSIGNMENT */}
            <div className="form-control">
              <label className="label font-bold">Assigned Mentor</label>
              <div className="flex gap-2">
                <select
                  className="select select-bordered w-full"
                  value={selectedMentor}
                  onChange={(e) => setSelectedMentor(e.target.value)}
                >
                  <option value="">-- No Mentor Assigned --</option>
                  {mentors
                    .filter((m: any) => m.cid !== cid) // Jangan tampilkan diri sendiri
                    .map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.ratingShort})
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAssignMentor}
                  disabled={processing}
                  className="btn btn-neutral"
                >
                  Assign
                </button>
              </div>
              <div className="label text-xs text-base-content/60">
                Sets primary mentor for active training.
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title text-base flex items-center gap-2">
              Solo Endorsement
            </h2>
            {currentSolo && (
              <div className="badge badge-warning text-xs font-bold animate-pulse">
                ACTIVE: {currentSolo.position}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="input">
              <span className="label font-bold">Position</span>
              <input type="text" className="font-mono uppercase" placeholder="WIII_TWR"
                value={soloForm.position} onChange={e => setSoloForm({ ...soloForm, position: e.target.value })} />
            </label>

            <div className="flex gap-4">
              <label className="input">
                <span className="label font-bold">Start Date</span>
                <input type="date"
                  value={soloForm.validFrom} onChange={e => setSoloForm({ ...soloForm, validFrom: e.target.value })} />
              </label>
              <label className="input">
                <span className="label font-bold">End Date</span>
                <input type="date"
                  value={soloForm.validUntil} onChange={e => setSoloForm({ ...soloForm, validUntil: e.target.value })} />
              </label>
            </div>
          </div>

          <div className="card-actions justify-end mt-4">
            {currentSolo && (
              <button onClick={handleRevokeSolo} disabled={processing} className="btn btn-error btn-outline btn-sm">
                Revoke Solo
              </button>
            )}
            <button onClick={handleAssignSolo} disabled={processing} className="btn btn-warning btn-sm">
              {currentSolo ? "Update Solo" : "Grant Solo"}
            </button>
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