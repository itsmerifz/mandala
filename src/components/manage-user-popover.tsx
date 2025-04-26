'use client'
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { UserPlus, BadgeCheck } from "lucide-react"
import React from 'react'

interface ManageUserPopoverProps {
  onAddRole: () => void,
  onAddCert: () => void
}

const ManageUserPopover = ({ onAddRole, onAddCert }: ManageUserPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline'>Manage</Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 flex flex-col gap-2">
        <Button variant='ghost' onClick={onAddRole}>
          <UserPlus className="w-4 h-4 mr-2"/> Add Role
        </Button>
        <Button variant='ghost' onClick={onAddCert}>
          <BadgeCheck className="w-4 h-4 mr-2"/> Add Certificate
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export default ManageUserPopover