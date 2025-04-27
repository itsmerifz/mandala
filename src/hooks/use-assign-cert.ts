/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { assignCertSchema } from "@/lib/zod";
import { z } from "zod";
import { toast } from "sonner";

export const useAssignCert = () => {
  return useMutation({
    mutationFn: async (data: z.infer<typeof assignCertSchema>) => {
      await axios.post('/api/user-cert', data)
    },
    onSuccess: () => {
      toast.success("Certificate assigned successfully!")
    },
    onError: (err: any) => {
      toast.error( err?.response?.data?.error || 'Something went wrong')
    }
  })
}