/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: any) => {
      const { data } = await axios.post('/api/roles', formData);
      return data;
    },
    onSuccess: () => {
      toast.success("Role created successfully!")
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Something went wrong')
    }
  })
}
