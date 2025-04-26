import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { editUserRoleSchema } from '@/lib/zod'
import { z } from 'zod'

interface EditUserRoleProps {
  userId: string, 
  data: z.infer<typeof editUserRoleSchema>
}

export const useEditUserRole = () => {
  return useMutation({
    mutationFn: async ({ userId, data }: EditUserRoleProps) => {
      await axios.patch(`/api/user-roles/${userId}`, data)
    }
  })
}
