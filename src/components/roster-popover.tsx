import React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
import { Ellipsis } from 'lucide-react'
import Link from 'next/link'

const RosterPopover = ({ cid }: { cid: string }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost'>
          <Ellipsis />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-56'>
        <Button variant='ghost' className='w-full'>
          <Link className='text-sm w-full' href={`https://stats.vatsim.net/stats/${cid}`}>View Stats</Link>
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export default RosterPopover