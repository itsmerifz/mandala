'use client'
import React from 'react'
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient()

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          >
          {children}
          <Toaster />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}

export default Providers