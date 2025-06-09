import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import SidebarComponent from '@/components/sidebar';

interface Props {
  children: React.ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider className='flex min-h-screen w-full flex-row overflow-hidden'>
      <SidebarComponent/>
      <main className='flex flex-1 flex-col overflow-y-auto'>
        <div className="flex-grow p-6">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}

export default Layout