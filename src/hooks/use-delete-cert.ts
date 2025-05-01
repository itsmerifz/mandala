/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';


export const useDeleteCert= () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return await axios.delete(`/api/cert/${id}`)
    },
    onSuccess: () => {
      toast.success('Certificate deleted')
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Something went wrong')
  })
}