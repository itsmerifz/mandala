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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { CalendarDaysIcon } from "lucide-react"
import { format, parse } from "date-fns"
import { Calendar } from "./ui/calendar"

interface EditUserCertProps {
  userId: string
  certId: string
  onClose: () => void
}

type EditUserCertSchemaInput = z.input<typeof editUserCertSchema>
type EditUserCertSchemaOutput = z.output<typeof editUserCertSchema>

const EditUserCertDialog = ({ userId, certId, onClose }: EditUserCertProps) => {
  const { mutate, isPending, data, isLoading, remove, isRemoving } = useEditUserCert(userId, certId)

  const form = useForm<EditUserCertSchemaInput, unknown, EditUserCertSchemaOutput>({
    resolver: zodResolver(editUserCertSchema),
    defaultValues: {
      isOnTraining: data?.isOnTraining ?? false,
      notes: data?.notes ?? '',
      upgradedAt: data?.upgradedAt ? data?.upgradedAt.split('T')[0] : '',
    }
  })

  const onSubmit = (data: z.infer<typeof editUserCertSchema>) => {
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

    const subscription = form.watch((value, { name }) => {
      if (name === 'isOnTraining' && value?.isOnTraining === false) form.setValue('upgradedAt', format(new Date(), 'yyyy-MM-dd'))
    })

    return () => subscription.unsubscribe()
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
                  <FormLabel htmlFor='upgradedAt'>Upgraded Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant='outline'>
                          {field.value ? (format(field.value as string, "PPP")) : <span>Pick a date</span>}
                          <CalendarDaysIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value && field.value !== '' ? parse(field.value as string, 'yyyy-MM-dd', new Date()) : undefined}
                        onSelect={(date) => {
                          form.setValue('upgradedAt', date ? format(date, 'yyyy-MM-dd') : '');
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4">
              <Button type="button" variant='destructive' disabled={isRemoving} onClick={() => remove(undefined, { onSuccess: onClose })} className="w-auto">{isRemoving ? 'Deleting...' : 'Delete'}</Button>
              <Button type="submit" variant='outline' disabled={isPending} className="w-auto">{isPending ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditUserCertDialog