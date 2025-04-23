import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenuButton, SidebarSeparator } from "./ui/sidebar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import Link from "next/link";
import { ChevronUp } from "lucide-react";

const SidebarComponent = () => {
  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-4xl font-thin text-center">Mandala</h1>
      </SidebarHeader>
      <SidebarSeparator className=" mt-4" />
      <SidebarContent>
        <SidebarGroup title="General">
          <Accordion type="single" collapsible>
            <AccordionItem value="training">
              <AccordionTrigger>Training</AccordionTrigger>
              <AccordionContent><Link href={'/'} className="w-full">Request Training</Link></AccordionContent>
              <AccordionContent><Link href={'/'} className="w-full">Training Plan</Link></AccordionContent>
              <AccordionContent><Link href={'/'} className="w-full">Check Training Status</Link></AccordionContent>
            </AccordionItem>
            <AccordionItem value="events">
              <AccordionTrigger>Events</AccordionTrigger>
              <AccordionContent><Link href={'/'} className="w-full">Event List</Link></AccordionContent>
            </AccordionItem>
            <AccordionItem value="roster">
              <AccordionTrigger>Roster</AccordionTrigger>
              <AccordionContent><Link href={'/'} className="w-full">Roster List</Link></AccordionContent>
            </AccordionItem>
          </Accordion>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              Muhammad Arief
              <ChevronUp className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem><Link href={'/'} className="w-full">Profile</Link></DropdownMenuItem>
            <DropdownMenuItem><Link href={'/'} className="w-full">Settings</Link></DropdownMenuItem>
            <DropdownMenuItem><Link href={'/'} className="w-full">Logout</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default SidebarComponent