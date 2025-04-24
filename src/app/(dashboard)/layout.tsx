import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import SidebarComponent from '@/components/sidebar';

interface Props {
  children: React.ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider className='flex flex-row h-screen w-screen'>
      <SidebarComponent/>
      <main className='w-full'>
        {children}
      </main>
    </SidebarProvider>
  )
}

export default Layout