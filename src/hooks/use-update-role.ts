/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';


export const useUpdateRole = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: any) => {
      return await axios.put(`/api/role/${id}`, formData)
    },
    onSuccess: () => {
      toast.success('Role updated')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Something went wrong')
  })
}