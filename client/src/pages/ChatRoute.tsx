import { useCurrentUser } from "@/hooks/useCurrentUser";
import AdminLayout from "@/layouts/AdminLayout";
import UserLayout from "@/layouts/UserLayout";
import Chat from "@/pages/Chat";

const ChatRoute = () => {
  const { isAdmin } = useCurrentUser();

  if (isAdmin) {
    return (
      <AdminLayout>
        <Chat />
      </AdminLayout>
    );
  }

  return (
    <UserLayout>
      <Chat />
    </UserLayout>
  );
};

export default ChatRoute;
