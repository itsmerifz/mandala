import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import SidebarComponent from '@/components/sidebar';

interface Props {
  children: React.ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider className='flex flex-row h-screen w-screen overflow-auto'>
      <SidebarComponent/>
      <main className='w-full h-full p-5 flex-1'>
        {children}
      </main>
    </SidebarProvider>
  )
}

export default Layout