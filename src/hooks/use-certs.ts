import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useCerts = () => {
  return useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const { data } = await axios.get('/api/cert')
      return data.certificates
    }
  })
}