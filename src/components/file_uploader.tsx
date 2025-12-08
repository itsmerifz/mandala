"use client"

import { useState } from "react"
import { api } from "@/lib/client"

interface FileUploaderProps {
  onUploadComplete: (url: string, type: 'image' | 'file') => void
}

export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Kirim via Eden Treaty
      // Note: Eden otomatis handle FormData untuk t.File()
      const { data } = await api.api.upload.post({
        file: file
      })

      if (data && data.status === 'success') {
        onUploadComplete(data.url, data.type as 'image' | 'file')
      } else {
        alert("Upload failed")
      }
    } catch (err) {
      console.error(err)
      alert("Upload error")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        className="hidden"
        id="file-upload-input"
        onChange={handleFileChange}
        accept="image/*,application/pdf"
      />
      <label
        htmlFor="file-upload-input"
        className={`btn btn-sm btn-outline gap-2 ${uploading ? 'btn-disabled' : ''}`}
      >
        {uploading ? (
          <span className="loading loading-spinner loading-xs"></span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        )}
        {uploading ? "Uploading..." : "Attach Image/PDF"}
      </label>
    </div>
  )
}