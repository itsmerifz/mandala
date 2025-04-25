import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useRoles = () => {
  useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await axios.get('/api/roles')
      return data.roles
    }
  })
}