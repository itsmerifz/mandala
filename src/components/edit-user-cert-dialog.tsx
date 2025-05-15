'use client'
import { useEditUserCert } from "@/hooks/use-edit-user-cert"
import { editUserCertSchema } from "@/lib/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog"
import { Checkbox } from "./ui/checkbox"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { CalendarDaysIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "./ui/calendar"

interface EditUserCertProps {
  userId: string
  certId: string
  onClose: () => void
}

const EditUserCertDialog = ({ userId, certId, onClose }: EditUserCertProps) => {
  const { mutate, isPending, data, isLoading } = useEditUserCert(userId, certId)

  const form = useForm<z.infer<typeof editUserCertSchema>>({
    resolver: zodResolver(editUserCertSchema),
    defaultValues: {
      isOnTraining: data?.isOnTraining ?? false,
      notes: data?.notes ?? '',
      upgradedAt: data?.upgradedAt ? data?.upgradedAt.split('T')[0] : '',
    }
  })


  const onSubmit = async (data: z.infer<typeof editUserCertSchema>) => {
    mutate({ userId, certId, data }, {
      onSuccess: () => {
        form.reset()
        onClose()
      }
    })
  }

  React.useEffect(() => {
    if (data) {
      form.reset({
        isOnTraining: data.isOnTraining,
        notes: data.notes ?? '',
        upgradedAt: data.upgradedAt ? data.upgradedAt.split('T')[0] : ''
      })
    }
  }, [data, form])

  if (isLoading) return null

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>
          Edit Certificate
        </DialogTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox id="isOnTraining" checked={form.watch('isOnTraining')} onCheckedChange={(checked) => form.setValue('isOnTraining', Boolean(checked))} />
              </FormControl>
              <FormLabel htmlFor="isOnTraining">Is On Training?</FormLabel>
            </FormItem>

            <FormField
              name="notes"
              control={form.control}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name="upgradedAt"
              control={form.control}
              render={({ field }) => (
                <FormItem className='space-y-2 flex flex-col'>
                  <FormLabel htmlFor='issuedAt'>Issued Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant='outline'>
                          {field.value ? (format(field.value, "PPP")) : <span>Pick a date</span>}
                          <CalendarDaysIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            <Button type="submit" variant='outline' disabled={isPending} className="w-full">{isPending ? 'Saving...' : 'Save Changes'}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditUserCertDialog