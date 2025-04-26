import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { editUserCertSchema } from "@/lib/zod";
import { z } from "zod";

interface EditUserCertProps {
  userCertId: string,
  data: z.infer<typeof editUserCertSchema>
}

export const useEditUserCert = () => {
  return useMutation({
    mutationFn: async ({ data, userCertId }: EditUserCertProps) => {
      await axios.patch(`/api/user-cert/${userCertId}`, data)
    }
  })
}
