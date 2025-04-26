import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { assignRoleSchema } from "@/lib/zod";
import { z } from "zod";

export const useAssignRole = () => {
  return useMutation({
    mutationFn: async (data: z.infer<typeof assignRoleSchema>) => {
      await axios.post('/api/user-role', data)
    }
  })
}