/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { assignRoleSchema } from "@/lib/zod";
import { z } from "zod";
import { toast } from "sonner";

export const useAssignRole = () => {
  return useMutation({
    mutationFn: async (data: z.infer<typeof assignRoleSchema>) => {
      await axios.post('/api/user-role', data)
    },
    onSuccess: () => {
      toast.success("Role assigned successfully!")
    },
    onError: (err: any) => {
      toast.error( err?.response?.data?.error || 'Something went wrong')
    }
  })
}