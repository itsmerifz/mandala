import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Role } from '@/app/types'
import { useDeleteRole } from '@/hooks/use-delete-role'
import { Button } from './ui/button'

interface DeleteRoleProps {
  role: Role
  open: boolean
  onClose: () => void
}

const DeleteRoleDialog = ({ role, open, onClose }: DeleteRoleProps) => {
  const { mutate, isPending } = useDeleteRole()

  const onDelete = () => {
    mutate(role.id, {
      onSuccess: () => onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Role</DialogTitle>
        </DialogHeader>
        <p>Are you sure to delete this role <strong>{role.name}</strong>? (It cannot be reverted!)</p>
        <div className='flex justify-end gap-2 mt-4'>
          <Button variant='outline' onClick={onClose}>Cancel</Button>
          <Button variant='destructive' onClick={onDelete} disabled={isPending}>{isPending ? 'Deleting...' : 'Delete'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteRoleDialog