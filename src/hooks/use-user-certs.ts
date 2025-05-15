import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export const useUserCerts = (userId: string) => {
  return useQuery({
    queryKey: ['user-certs', userId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/user-cert/${userId}`)
      return data.certs
    },
    enabled: !!userId
  })
}