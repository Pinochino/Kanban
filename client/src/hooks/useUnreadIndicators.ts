import { useQuery } from "@tanstack/react-query";

import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type ChatContactUnread = {
  unreadCount?: number;
};

const REFRESH_INTERVAL_MS = 5000;

export const useUnreadIndicators = () => {
  const { user } = useCurrentUser();
  const enabled = Boolean(user?.id);

  const unreadNotificationQuery = useQuery({
    queryKey: ["unread-notification-count", user?.id],
    enabled,
    queryFn: async (): Promise<number> => {
      const response = await handleApi({
        url: apiName.notifications.myList,
        method: "GET",
        params: {
          channel: "WEB",
          unreadOnly: true,
        },
      });

      const payload = response.data?.data;
      return Array.isArray(payload) ? payload.length : 0;
    },
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: 1000,
  });

  const unreadChatQuery = useQuery({
    queryKey: ["unread-chat-count", user?.id],
    enabled,
    queryFn: async (): Promise<number> => {
      const response = await handleApi({
        url: apiName.chats.contacts,
        method: "GET",
        withCredentials: true,
      });

      const payload = response.data?.data;

      if (!Array.isArray(payload)) {
        return 0;
      }

      return payload.reduce((sum: number, item: ChatContactUnread) => {
        const unread = Number(item?.unreadCount ?? 0);
        return sum + (Number.isFinite(unread) ? unread : 0);
      }, 0);
    },
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: 1000,
  });

  return {
    unreadNotifications: unreadNotificationQuery.data ?? 0,
    unreadMessages: unreadChatQuery.data ?? 0,
  };
};
