import React from 'react'
import { Certificate } from "@/app/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useDeleteCert } from '@/hooks/use-delete-cert';
import { Button } from './ui/button';

interface DeleteCertProps {
  cert: Certificate
  open: boolean
  onClose: () => void
}


const DeleteCertDialog = ({ cert, open, onClose }: DeleteCertProps) => {
  const { mutate, isPending } = useDeleteCert()

  const onDelete = () => {
    mutate(cert.id, {
      onSuccess: () => onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Certificate</DialogTitle>
        </DialogHeader>
        <p>Are you sure to delete this certificate <strong>{cert.name}</strong>? (It cannot be reverted!)</p>
        <div className='flex justify-end gap-2 mt-4'>
          <Button variant='outline' onClick={onClose}>Cancel</Button>
          <Button variant='destructive' onClick={onDelete} disabled={isPending}>{isPending ? 'Deleting...' : 'Delete'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteCertDialog