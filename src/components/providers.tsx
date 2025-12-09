'use client'
import React from 'react'
import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
        {children}
        <Toaster position='top-right' theme='dark' richColors />
      </SessionProvider>
    </QueryClientProvider>
  )
}

export default Providers