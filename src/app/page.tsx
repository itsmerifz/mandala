"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    signIn("vatsim", { redirectTo: "/dashboard" })
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card min-w-96 min-h-96 gap-3">
        <h1 className="text-5xl font-bold text-transparent bg-linear-to-r from-primary to-secondary bg-clip-text">Mandala IDvACC</h1>
        <p className="text-center">Sign in to continue</p>
        <button className="btn-primary btn btn-outline btn-lg" onClick={handleLogin} disabled={isLoading}>{isLoading ? <span className="loading loading-spinner loading-lg"></span> : null} {isLoading ? "Processing..." : "Login With VATSIM SSO"}</button>
      </div>
    </div>
  )
}