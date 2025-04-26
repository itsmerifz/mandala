import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { assignCertSchema } from "@/lib/zod";
import { z } from "zod";

export const useAssignCert = () => {
  return useMutation({
    mutationFn: async (data: z.infer<typeof assignCertSchema>) => {
      await axios.post('/api/user-cert', data)
    }
  })
}