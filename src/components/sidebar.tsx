import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenuButton, SidebarSeparator } from "./ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { ChevronDown, ChevronUp, GraduationCap, Calendar, Users, Settings2, Home, LogOut, UserCircle } from "lucide-react";
import { auth } from "@root/auth";
import { redirect } from "next/navigation";
import SignOutAction from "@/app/actions/signout";
import { Permission as PrismaPermissionEnum } from '@root/prisma/generated'

type NavItem = {
  href: string
  label: string
  permission: PrismaPermissionEnum | PrismaPermissionEnum[]
}

type NavGroupProps = {
  label: string
  icon: React.ElementType
  links: NavItem[]
  userPermissions: PrismaPermissionEnum[]
}



const userHasPermissionOrIsAdmin = (
  userPermissions: PrismaPermissionEnum[],
  required: PrismaPermissionEnum | PrismaPermissionEnum[]
): boolean => {
  if (userPermissions.includes(PrismaPermissionEnum.ADMINISTRATOR)) return true;
  if (Array.isArray(required)) return required.some(p => userPermissions.includes(p))
  return userPermissions.includes(required)
}

const NavGroup = ({ label, icon: Icon, links, userPermissions }: NavGroupProps) => {
  const accessibleLinks = links.filter(link => userHasPermissionOrIsAdmin(userPermissions, link.permission));

  if (accessibleLinks.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="p-5">
          <Icon className="text-xl" /> {label}
          <ChevronDown className="ml-auto" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {accessibleLinks.map(link => (
          <DropdownMenuItem key={link.href} asChild>
            <Link href={link.href} className="w-full">{link.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const SidebarComponent = async () => {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
    return null
  }

  const appPermissions = session.user.appPermissions || []

  const navGroups: Omit<NavGroupProps, 'userPermissions'>[] = [
    {
      label: 'Training',
      icon: GraduationCap,
      links: [
        { href: '/training', label: 'Training Center', permission: [PrismaPermissionEnum.VIEW_TRAINING_RECORDS, PrismaPermissionEnum.MANAGE_TRAINING] },
        { href: '/training/manage', label: 'Manage Training', permission: PrismaPermissionEnum.MANAGE_TRAINING },
      ],
    },
    {
      label: 'Events',
      icon: Calendar,
      links: [
        { href: '/events', label: 'Event List', permission: PrismaPermissionEnum.VIEW_EVENT_RECORDS },
        { href: '/events/manage', label: 'Manage Events', permission: PrismaPermissionEnum.MANAGE_EVENTS },
      ],
    },
    {
      label: 'Roster',
      icon: Users,
      links: [
        { href: '/roster', label: 'Roster List', permission: PrismaPermissionEnum.VIEW_ROSTER },
        { href: '/roster/manage', label: 'Manage Roster', permission: PrismaPermissionEnum.MANAGE_USERS_ROSTER },
      ],
    },
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-4xl font-thin text-center">Mandala</h1>
      </SidebarHeader>
      <SidebarSeparator className="mt-4" />
      <SidebarContent>
        <div className="flex flex-col gap-2 p-2">
          <SidebarMenuButton className="p-5">
            <Link href={'/main'} className="flex gap-3 w-full items-center justify-center">
              <Home />
              <p>Home</p>
            </Link>
          </SidebarMenuButton>

          {navGroups.map(group => (
            <NavGroup
              key={group.label}
              userPermissions={appPermissions}
              {...group}
            />
          ))}

          {userHasPermissionOrIsAdmin(appPermissions, PrismaPermissionEnum.MANAGE_WEBSITE) && (
            <NavGroup
              label="Settings"
              icon={Settings2}
              links={[{ href: '/settings', label: 'Site Settings', permission: PrismaPermissionEnum.MANAGE_WEBSITE }]}
              userPermissions={appPermissions}
            />
          )}
        </div>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="p-5">
              <Avatar className="w-6 h-6">
                <AvatarImage src={`https://www.gradvatar.com/${session.user.name}`} alt={`${session.user.name} Avatar`} />
                <AvatarFallback>
                  {`${session.user?.vatsimPersonal?.name_first?.charAt(0) ?? 'U'}${session.user?.vatsimPersonal?.name_last?.charAt(0) ?? 'N'}`}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-left ml-2">
                {session?.user.name}
              </span>
              <ChevronUp className="ml-auto shrink-0" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
            <DropdownMenuItem asChild><Link href="/profile"><UserCircle className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/settings"><Settings2 className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <form action={SignOutAction} className="w-full">
                <button type="submit" className="w-full text-left flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default SidebarComponent