import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { editUserRoleSchema } from '@/lib/zod'
import { z } from 'zod'

export const useEditUserRole = (userId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: z.infer<typeof editUserRoleSchema>) => {
      await axios.patch(`/api/user-role/${userId}`, data)
    },
    onSuccess: () => {
      toast.success('User roles updated')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: () => toast.error('Failed to update roles')
  })
}
