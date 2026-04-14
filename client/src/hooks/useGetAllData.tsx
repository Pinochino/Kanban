import { handleApi } from "@/api/handleApi";
import { useQuery } from "@tanstack/react-query";

interface IUseGetAllData {
    url: string
}

export const useGetAllData = ({ url }: IUseGetAllData) => {

    return useQuery({
        queryKey: [`${url}`],
        queryFn: async () => {
            const res = await handleApi({ url, method: "GET", withCredentials: true });
            return res.data.data;
        },
    });

}