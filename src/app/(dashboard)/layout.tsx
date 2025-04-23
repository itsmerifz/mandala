import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import SidebarComponent from '@/components/sidebar';

interface Props {
  children: React.ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <SidebarComponent/>
      <main>
        {children}
      </main>
    </SidebarProvider>
  )
}

export default Layout