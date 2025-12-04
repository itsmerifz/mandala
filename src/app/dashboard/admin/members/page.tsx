/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/client"
import Link from "next/link"

export default function MemberManagementList() {
  const [members, setMembers] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Kita pakai endpoint publik /roster saja karena datanya cukup (CID & Nama)
    api.api.roster.get().then(({ data }) => {
      if (data?.status === 'success') setMembers(data.data ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.cid.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-base-300 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Member Management</h1>
          <p className="text-sm opacity-60">Manage roster status and certifications.</p>
        </div>
        <input
          type="text"
          placeholder="Search by Name/CID..."
          className="input input-bordered input-sm w-64"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200 p-3">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>CID</th>
              <th>Current Status</th>
              <th>Rating</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr> :
              filtered.map(m => (
                <tr key={m.cid} className="hover">
                  <td className="font-bold">{m.name}</td>
                  <td className="font-mono opacity-70">{m.cid}</td>
                  <td>
                    <div className={`badge badge-sm ${m.rosterStatus === 'ACTIVE' ? 'badge-success' : 'badge-ghost'}`}>
                      {m.rosterStatus}
                    </div>
                  </td>
                  <td>{m.ratingShort}</td>
                  <td className="text-right">
                    <Link href={`/dashboard/admin/members/${m.cid}`} className="btn btn-xs btn-neutral">
                      Manage Profile
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}