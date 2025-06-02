import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenuButton, SidebarSeparator } from "./ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { ChevronDown, ChevronUp, GraduationCap, Calendar, Users, Settings2, Home } from "lucide-react";
import { auth } from "@root/auth";
import { redirect } from "next/navigation";
import SignOutAction from "@/app/actions/signout";
import { Permission as PrismaPermissionEnum } from "@root/prisma/generated";

const userHasPermissionOrIsAdmin = (
  userPermissions: PrismaPermissionEnum[] | undefined,
  required: PrismaPermissionEnum | PrismaPermissionEnum[]
): boolean => {
  if (!userPermissions || userPermissions.length === 0) return false;

  // Jika pengguna adalah ADMINISTRATOR, selalu berikan akses
  if (userPermissions.includes(PrismaPermissionEnum.ADMINISTRATOR)) {
    return true;
  }

  // Jika bukan admin, cek permission spesifik
  if (Array.isArray(required)) {
    return required.some(p => userPermissions.includes(p));
  }
  return userPermissions.includes(required);
};

const SidebarComponent = async () => {
  const session = await auth()

  if (!session?.user) {
    // Jika tidak ada sesi pengguna (seharusnya sudah ditangani middleware, tapi sebagai pengaman tambahan)
    redirect('/');
    return null; // Hindari rendering lebih lanjut jika redirect
  }

  const appPermissions = session.user.appPermissions || [];

  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-4xl font-thin text-center">Mandala</h1>
      </SidebarHeader>
      <SidebarSeparator className=" mt-4" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenuButton className="p-5">
            <Link href={'/main'} className="flex gap-3 w-full items-center justify-center">
              <Home />
              <p>Home</p>
            </Link>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="p-5">
                <GraduationCap className="text-xl" /> Training
                <ChevronDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem><Link href={'/training'} className="w-full">Request Training</Link></DropdownMenuItem>
              <DropdownMenuItem><Link href={'/'} className="w-full">Training Plan</Link></DropdownMenuItem>
              <DropdownMenuItem><Link href={'/'} className="w-full">Check Training Status</Link></DropdownMenuItem>
              {userHasPermissionOrIsAdmin(appPermissions, PrismaPermissionEnum.MANAGE_TRAINING) && (
                <DropdownMenuItem><Link href={'/training/manage'} className="w-full">Manage Training</Link></DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="p-5">
                <Calendar className="text-xl" /> Event
                <ChevronDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem><Link href={'/events'} className="w-full">Event List</Link></DropdownMenuItem>
              {userHasPermissionOrIsAdmin(appPermissions, PrismaPermissionEnum.MANAGE_EVENT) &&
                <DropdownMenuItem><Link href={'/'} className="w-full">Manage Event</Link></DropdownMenuItem>
              }
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="p-5">
                <Users className="text-xl" /> Roster
                <ChevronDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem><Link href={'/roster'} className="w-full">Roster List</Link></DropdownMenuItem>
              {
                userHasPermissionOrIsAdmin(appPermissions, PrismaPermissionEnum.MANAGE_ROSTER) &&
                <DropdownMenuItem><Link href={'/roster/manage'} className="w-full">Manage Roster</Link></DropdownMenuItem>
              }
            </DropdownMenuContent>
          </DropdownMenu>
          {
            userHasPermissionOrIsAdmin(appPermissions, PrismaPermissionEnum.MANAGE_WEB) &&
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="p-5">
                  <Settings2 className="text-xl" /> Settings
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem><Link href={'/settings'} className="w-full">Site Settings</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="p-5">
              <Avatar className="w-6 h-6">
                <AvatarImage src={`https://www.gradvatar.com/${session.user.name}`} alt={`${session.user.name} Avatar`} />
                <AvatarFallback>{`${session.user?.vatsimPersonal?.name_first.split('')[0]}${session.user?.vatsimPersonal?.name_last.split('')[0]}`}</AvatarFallback>
              </Avatar>
              {session?.user.name}
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem><Link href={'/'} className="w-full">Profile</Link></DropdownMenuItem>
            <DropdownMenuItem><Link href={'/'} className="w-full">Settings</Link></DropdownMenuItem>
            <DropdownMenuItem>
              <div className="w-full">
                <form action={SignOutAction}>
                  <button type="submit" className="w-full text-start hover:cursor-pointer">Logout</button>
                </form>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default SidebarComponent