import { handleApi } from "@/api/handleApi";
import { useQuery } from "@tanstack/react-query";

interface IUseGetAllData {
    url: string,
    enabled?: boolean,
}

export const useGetAllData = ({ url, enabled = true }: IUseGetAllData) => {

    return useQuery({
        queryKey: [`${url}`],
        enabled,
        queryFn: async () => {
            const res = await handleApi({ url, method: "GET", withCredentials: true });
            return res.data.data;
        },
    });

}