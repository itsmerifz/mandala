/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

export const useCreateCert = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: any) => {
      const { data } = await axios.post('/api/cert', formData);
      return data;
    },
    onSuccess: () => {
      toast.success('Certificate created successfully!');
      queryClient.invalidateQueries({ queryKey: ['cert'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Something went wrong');
    }
  })
}