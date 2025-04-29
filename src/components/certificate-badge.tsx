'use client'

import React from "react"
import { Badge } from "./ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

interface CertificateBadgeProps {
  code: string,
  color: string,
  isOnTraining?: boolean
  notes?: string
}

const CertBadge = ({ code, color, isOnTraining = false, notes }: CertificateBadgeProps) => {
  const badgeClass = `bg-${color} text-black dark:text-white ${isOnTraining ? 'border-2 dark:border-white border-black border-dotted' : ''}`

  if (isOnTraining && notes?.trim()) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Badge className={badgeClass}>{code}</Badge>
            </div>
          </TooltipTrigger >
          <TooltipContent>{notes}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return <Badge className={badgeClass}>{code}</Badge>
}

export default CertBadge