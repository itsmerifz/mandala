/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React from 'react'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'
import EditUserCertDialog from './edit-user-cert-dialog'
import { useUserCerts } from '@/hooks/use-user-certs'
import AssignCert from './assign-cert-dialog'

interface ManageUserCertsDialogProps {
  userId: string
  onClose: () => void
}

const ManageUserCertsDialog = ({ userId, onClose }: ManageUserCertsDialogProps) => {
  const { data: certs = [], isLoading } = useUserCerts(userId)
  const [selectedCertId, setSelectedCertId] = React.useState<string | null>(null)
  const [assignCertDialogOpen, setAssignCertDialogOpen] = React.useState(false)


  const openEdit = (id: string) => setSelectedCertId(id)
  const closeEdit = () => setSelectedCertId(null)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className='max-w-lg'>
        <DialogTitle>Manage Certificate(s)</DialogTitle>
        <Button variant='outline' onClick={() => setAssignCertDialogOpen(true)} className='w-48'>Assign Certificate</Button>
        <ScrollArea className='max-h-96 space-y-4 mt-4'>
          {isLoading && <p className='text-sm text-muted-foreground'>Loading Certificate(s)...</p>}
          {certs.length === 0 && !isLoading && <p className='text-sm text-muted-foreground'>No certificate assigned.</p>}
          {certs.map((cert: any) => (
            <div key={cert.id} className='flex justify-between items-center border p-2 rounded-md'>
              <div className="text-sm">
                <h2 className="font-semibold">{cert.certificate.code}</h2>
                <p className='text-xs text-muted-foreground'>{cert.notes || 'No notes'}</p>
              </div>
              <Button variant='outline' size='sm' onClick={() => openEdit(cert.id)}>Edit</Button>
            </div>
          ))}
        </ScrollArea>
      </DialogContent>

      {selectedCertId && (
        <EditUserCertDialog userId={userId} certId={selectedCertId} onClose={closeEdit} />
      )}

      {assignCertDialogOpen && (
        <AssignCert onClose={() => setAssignCertDialogOpen(false)} userId={userId} />
      )}
    </Dialog>
  )
}

export default ManageUserCertsDialog