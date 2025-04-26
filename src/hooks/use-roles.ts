import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await axios.get('/api/roles')
      return data.roles
    },
    // select: data => data.map(role => ({ id: role.id, name: role.name }))
  })
}