import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { editUserCertSchema } from "@/lib/zod";
import { z } from "zod";
import { toast } from "sonner";

interface EditUserCertProps {
  userId: string
  certId: string
  data: z.infer<typeof editUserCertSchema>
}

export const useEditUserCert = (userId: string, certId: string) => {
  const queryClient = useQueryClient()

  const certQuery = useQuery({
    queryKey: ['user-cert', userId, certId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/user-cert/${userId}/${certId}`)
      return data.data
    }
  })

  const mutation = useMutation({
    mutationFn: async ({ data, userId, certId }: EditUserCertProps) => {
      await axios.patch(`/api/user-cert/${userId}/${certId}`, data)
    },
    onSuccess: () => {
      toast.success('Certificate updated')
      queryClient.invalidateQueries({ queryKey: ['user-certs']})
    },
    onError: () => toast.error('Failed to update certificate')
  })

  return {
    ...certQuery,
    mutate: mutation.mutate,
    isPending: mutation.isPending
  }
}
