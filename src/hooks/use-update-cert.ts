/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';


export const useUpdateCert = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: any) => {
      return await axios.put(`/api/cert/${id}`, formData)
    },
    onSuccess: () => {
      toast.success('Certificate updated')
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Something went wrong')
  })
}