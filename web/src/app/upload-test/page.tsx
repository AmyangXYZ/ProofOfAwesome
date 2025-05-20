"use client"

import Image from "next/image"
import { ChangeEvent, useState } from "react"

export default function R2UploadTest() {
  const [fileUrl, setFileUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setError("")
    setFileUrl("")
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      // 1. Get presigned upload URL and public file URL from your API
      const res = await fetch(`/api/upload-url?filename=${encodeURIComponent(file.name)}`)
      const { uploadUrl, fileUrl: publicUrl, error: apiError } = await res.json()
      if (!uploadUrl) throw new Error(apiError || "Failed to get upload URL")

      // 2. Upload the file to R2 using the presigned URL
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      })
      if (!uploadRes.ok) throw new Error("Upload failed")

      // 3. Show the public file URL
      setFileUrl(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
      <h2>Test R2 Upload</h2>
      <input type="file" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p>Uploading...</p>}
      {fileUrl && (
        <div>
          <p>File uploaded! Public URL:</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            {fileUrl}
          </a>
          <br />
          {fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) && <Image src={fileUrl} alt="Uploaded" width={400} height={400} />}
        </div>
      )}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  )
}
