'use client'
import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'

const CertForm = () => {
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant='outline' className='w-full'>Add Certificate</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>
            Add Certificate
          </DialogTitle>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CertForm