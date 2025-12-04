/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client" // Eden Client kita
import { getRatingLabel, getRatingColor } from "@/lib/utils"
import { getPositionStatus, type CertStatus } from "@/lib/roster-utils"

// Definisikan tipe data member sesuai return API
type Member = {
  cid: string
  name: string
  ratingId: number
  ratingShort: string
  ratingLong: string
  division: string | null
  rosterStatus: string
  joinDate: string | Date
}

// Komponen Kecil untuk Indikator Checkbox
const CertIndicator = ({ status }: { status: CertStatus }) => {
  if (status === 'PASSED') {
    return (
      <div className="w-5 h-5 rounded bg-success text-success-content flex items-center justify-center mx-auto shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 font-bold" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }
  if (status === 'SOLO') {
    return (
      <div className="w-5 h-5 rounded bg-warning text-warning-content flex items-center justify-center mx-auto border border-warning ring-1 ring-offset-0 ring-warning/30 shadow-sm">
        <span className="text-[10px] font-bold font-mono">S</span>
      </div>
    )
  }
  // Status None
  return <div className="w-5 h-5 rounded bg-base-200 mx-auto opacity-30"></div>
}

export default function RosterPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // 1. Fetch Data saat halaman dibuka
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Panggil API Elysia via Eden
        const { data, error } = await api.api.roster.get()
        console.log("🔍 CEK DATA API:", data);
        console.log("❌ CEK ERROR API:", error);

        if (error) {
          console.error("Gagal ambil data:", error)
        }
        // Cek apakah struktur data benar
        // Kadang data langsung berupa array, kadang terbungkus object
        else if (data) {
          // UPDATE LOGIC INI:
          if (Array.isArray(data)) {
            // Kasus A: Backend langsung kirim array []
            setMembers(data)
          } else if (data.data && Array.isArray(data.data)) {
            // Kasus B: Backend kirim { status: 'success', data: [] }
            const mappedMembers = data.data.map((item: any) => ({
              cid: item.cid,
              name: item.name,
              ratingId: item.ratingId,
              ratingShort: item.ratingShort,
              ratingLong: item.ratingLong,
              division: item.division || null,
              rosterStatus: item.rosterStatus || 'INACTIVE', // Default value bagus
              joinDate: item.joinDate || new Date(), // Default value bagus
              userCertificates: item.certificates || [],
              trainingsAsStudent: item.trainingsAsStudent || []
            }))
            setMembers(mappedMembers)
          } else {
            console.warn("Struktur data tidak dikenali:", data)
          }
        }
      } catch (err) {
        console.error("Error fetching roster:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 2. Logic Filter Pencarian
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.cid.includes(search)
  )

  // Daftar Kolom Sertifikat yang mau ditampilkan
  const CERT_COLUMNS = ['DEL', 'GND', 'TWR', 'APP', 'CTR']

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Controller Roster</h1>
          <p className="text-base-content/60 text-sm">List of all registered IDvACC controllers.</p>
        </div>

        <div className="form-control w-full md:w-auto">
          <div className="input-group">
            <input
              type="text"
              placeholder="Search Name or CID..."
              className="input input-bordered w-full md:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="card bg-base-100 shadow-sm border border-base-200 w-full p-3">
        <div className="overflow-x-hidden">
          {/* table-zebra untuk baris selang-seling, w-full agar rapi tapi tetap responsif */}
          <table className="table table-sm table-zebra w-full whitespace-nowrap">
            <thead className="bg-base-200/50 text-base-content/70">
              <tr>
                {/* Kolom Data Diri */}
                <th className="font-semibold">Name</th>
                <th className="font-mono font-semibold">CID</th>
                <th className="font-semibold text-center">Rank</th>

                {/* Kolom Sertifikat */}
                {CERT_COLUMNS.map(col => (
                  <th key={col} className="text-center w-12 border-l border-base-200/50">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="h-10 bg-base-100 animate-pulse"></td></tr>
                ))
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <tr key={member.cid} className="hover">
                    {/* 1. NAMA */}
                    <td className="font-medium">{member.name}</td>

                    {/* 2. CID */}
                    <td className="font-mono opacity-70">{member.cid}</td>

                    {/* 3. RANK */}
                    <td className="text-center">
                      <div className={`badge ${getRatingColor(member.ratingId)} badge-soft badge-md font-bold`}>
                        {getRatingLabel(member.ratingId)}
                      </div>
                    </td>

                    {/* 4. SERTIFIKAT */}
                    {CERT_COLUMNS.map((col) => (
                      <td key={col} className="text-center border-l border-base-200/50 px-auto">
                        <CertIndicator status={getPositionStatus(member, col)} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 opacity-50">
                    No controllers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Count */}
        <div className="px-6 py-3 bg-base-100 border-t border-base-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          {/* Keterangan */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success text-success-content flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 font-bold" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="opacity-70 font-medium">Certified / Passed</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-warning text-warning-content flex items-center justify-center border border-warning ring-1 ring-offset-0 ring-warning/30 shadow-sm">
                <span className="text-[8px] font-bold font-mono">S</span>
              </div>
              <span className="opacity-70 font-medium">Solo Endorsement</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-base-200"></div>
              <span className="opacity-50">Not Certified</span>
            </div>
          </div>

          {/* Counter */}
          <div className="text-base-content/40 font-mono text-[10px]">
            Total: {filteredMembers.length} record(s)
          </div>
        </div>
      </div>
    </div>
  )
}