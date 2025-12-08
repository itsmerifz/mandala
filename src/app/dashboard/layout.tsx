import SidebarContent from "@/components/dashboard/sidebar"
import pkg from "@root/package.json"
import { auth } from "@root/auth"
import { redirect } from "next/navigation"

const APP_VERSION = pkg.version

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/')
  return (
    <div className="drawer lg:drawer-open bg-base-200">
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />

      {/* --- KONTEN UTAMA (KANAN) --- */}
      <div className="drawer-content flex flex-col min-h-screen">

        {/* Navbar (Mobile Only) */}
        {/* Navbar ini statis (kecuali tombol toggle yg pake CSS murni), jadi aman di Server Component */}
        <div className="w-full navbar bg-base-100 lg:hidden shadow-sm sticky top-0 z-30">
          <div className="flex-none">
            <label htmlFor="dashboard-drawer" className="btn btn-square btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </label>
          </div>
          <div className="flex-1 px-2 mx-2 font-bold text-xl">Mandala IDvACC</div>
        </div>

        {/* Page Content */}
        <main className="p-6 md:p-10 grow">
          {children}
        </main>
      </div>

      {/* --- SIDEBAR (KIRI) --- */}
      <div className="drawer-side z-40">
        <label htmlFor="dashboard-drawer" aria-label="close sidebar" className="drawer-overlay"></label>

        {/* Kita panggil Client Component di sini untuk isi sidebarnya */}
        <SidebarContent version={APP_VERSION} user={session.user} />

      </div>
    </div>
  )
}