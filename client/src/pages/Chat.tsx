import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, MessageSquare, Plus, Search, Send, Users } from "lucide-react";

import { apiName } from "@/api/apiName";
import { handleApi } from "@/api/handleApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import {
  IChatContact,
  IChatGroup,
  IChatMessage,
  ICreateChatGroupRequest,
  IPagedChatMessage,
  ISendChatGroupMessageRequest,
  ISendChatMessageRequest,
} from "@/types/ChatInterface";
import { toast } from "sonner";

type ChatTab = "direct" | "group";

type SendMessagePayload =
  | {
      kind: "direct";
      targetId: number | string;
      content: string;
    }
  | {
      kind: "group";
      targetId: number | string;
      content: string;
    };

const ChatPage = () => {
  const { user, isAdmin } = useCurrentUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ChatTab>("direct");
  const [contactSearch, setContactSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  const [selectedDirectId, setSelectedDirectId] = useState<string | number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Array<string | number>>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const { data: contacts = [], isLoading: isContactsLoading } = useQuery({
    queryKey: [apiName.chats.contacts],
    queryFn: async (): Promise<IChatContact[]> => {
      const res = await handleApi({
        url: apiName.chats.contacts,
        method: "GET",
        withCredentials: true,
      });

      const payload = res.data?.data;
      return Array.isArray(payload) ? (payload as IChatContact[]) : [];
    },
  });

  const { data: groups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: [apiName.chats.groups],
    queryFn: async (): Promise<IChatGroup[]> => {
      const res = await handleApi({
        url: apiName.chats.groups,
        method: "GET",
        withCredentials: true,
      });

      const payload = res.data?.data;
      return Array.isArray(payload) ? (payload as IChatGroup[]) : [];
    },
  });

  const filteredContacts = useMemo(() => {
    const keyword = contactSearch.trim().toLowerCase();

    if (!keyword) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const searchable = [contact.username, contact.email, contact.roleName, contact.lastMessagePreview]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [contacts, contactSearch]);

  const filteredGroups = useMemo(() => {
    const keyword = groupSearch.trim().toLowerCase();

    if (!keyword) {
      return groups;
    }

    return groups.filter((group) => {
      const searchable = [group.name, group.description, group.creatorName, group.lastMessagePreview]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [groups, groupSearch]);

  useEffect(() => {
    if (filteredContacts.length === 0) {
      setSelectedDirectId(null);
      return;
    }

    if (!selectedDirectId || !filteredContacts.some((contact) => String(contact.id) === String(selectedDirectId))) {
      setSelectedDirectId(filteredContacts[0].id);
    }
  }, [filteredContacts, selectedDirectId]);

  useEffect(() => {
    if (filteredGroups.length === 0) {
      setSelectedGroupId(null);
      return;
    }

    if (!selectedGroupId || !filteredGroups.some((group) => String(group.id) === String(selectedGroupId))) {
      setSelectedGroupId(filteredGroups[0].id);
    }
  }, [filteredGroups, selectedGroupId]);

  useEffect(() => {
    setMessage("");
  }, [activeTab, selectedDirectId, selectedGroupId]);

  const selectedDirectContact = useMemo(
    () => contacts.find((contact) => String(contact.id) === String(selectedDirectId)) ?? null,
    [contacts, selectedDirectId],
  );

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === String(selectedGroupId)) ?? null,
    [groups, selectedGroupId],
  );

  const conversationQueryKey = activeTab === "direct"
    ? [apiName.chats.conversation, selectedDirectId]
    : [apiName.chats.groupConversation, selectedGroupId];

  const { data: conversationPage, isLoading: isMessagesLoading, isFetching } = useQuery({
    queryKey: conversationQueryKey,
    enabled: activeTab === "direct" ? Boolean(selectedDirectId) : Boolean(selectedGroupId),
    queryFn: async (): Promise<IPagedChatMessage> => {
      const url = activeTab === "direct"
        ? `${apiName.chats.conversation}/${selectedDirectId}`
        : `${apiName.chats.groupConversation}/${selectedGroupId}/conversation`;

      const res = await handleApi({
        url,
        method: "GET",
        params: {
          page: 0,
          size: 100,
        },
        withCredentials: true,
      });

      const data = res.data?.data;
      return {
        items: Array.isArray(data?.items) ? (data.items as IChatMessage[]) : [],
        totalElements: Number(data?.totalElements ?? 0),
        totalPages: Number(data?.totalPages ?? 0),
        page: Number(data?.page ?? 0),
        size: Number(data?.size ?? 100),
        hasNext: Boolean(data?.hasNext ?? false),
        hasPrevious: Boolean(data?.hasPrevious ?? false),
      };
    },
    refetchInterval: activeTab === "direct"
      ? selectedDirectId
        ? 3000
        : false
      : selectedGroupId
        ? 3000
        : false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const response = await handleApi({
        url: payload.kind === "direct"
          ? apiName.chats.send
          : `${apiName.chats.groupSend}/${payload.targetId}/send`,
        method: "POST",
        data: payload.kind === "direct"
          ? ({ receiverId: payload.targetId, content: payload.content } satisfies ISendChatMessageRequest)
          : ({ content: payload.content } satisfies ISendChatGroupMessageRequest),
        withCredentials: true,
      });

      return response.data?.data as IChatMessage;
    },
    onSuccess: async () => {
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: [apiName.chats.contacts] });
      await queryClient.invalidateQueries({ queryKey: [apiName.chats.groups] });
      await queryClient.invalidateQueries({ queryKey: conversationQueryKey });
    },
    onError: () => {
      toast.error("Không thể gửi tin nhắn.");
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const payload: ICreateChatGroupRequest = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        memberIds: selectedMemberIds,
      };

      const response = await handleApi({
        url: apiName.chats.groups,
        method: "POST",
        data: payload,
        withCredentials: true,
      });

      return response.data?.data as IChatGroup;
    },
    onSuccess: async (createdGroup) => {
      toast.success("Đã tạo nhóm chat.");
      queryClient.setQueryData<IChatGroup[]>([apiName.chats.groups], (current) => {
        const nextGroup = createdGroup;

        if (!nextGroup?.id) {
          return current ?? [];
        }

        const existingGroups = current ?? [];
        const filteredGroups = existingGroups.filter((group) => String(group.id) !== String(nextGroup.id));

        return [nextGroup, ...filteredGroups];
      });
      setCreateGroupOpen(false);
      setGroupName("");
      setGroupDescription("");
      setMemberSearch("");
      setSelectedMemberIds([]);
      setActiveTab("group");
      if (createdGroup?.id != null) {
        setSelectedGroupId(createdGroup.id);
      }
      await queryClient.invalidateQueries({ queryKey: [apiName.chats.groups] });
    },
    onError: () => {
      toast.error("Không thể tạo nhóm chat.");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationPage?.items?.length, activeTab, selectedDirectId, selectedGroupId]);

  const getInitials = (name?: string | null) => {
    if (!name) {
      return "NA";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const formatTime = (value?: string | null) => {
    if (!value) {
      return "";
    }

    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSend = async () => {
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    if (activeTab === "direct") {
      if (!selectedDirectId) {
        return;
      }

      await sendMessageMutation.mutateAsync({
        kind: "direct",
        targetId: selectedDirectId,
        content: trimmed,
      });
      return;
    }

    if (!selectedGroupId) {
      return;
    }

    await sendMessageMutation.mutateAsync({
      kind: "group",
      targetId: selectedGroupId,
      content: trimmed,
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const handleToggleMember = (memberId: string | number, checked: boolean) => {
    setSelectedMemberIds((current) => {
      if (checked) {
        return current.some((value) => String(value) === String(memberId)) ? current : [...current, memberId];
      }

      return current.filter((value) => String(value) !== String(memberId));
    });
  };

  const memberCandidates = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();

    if (!keyword) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const searchable = [contact.username, contact.email, contact.roleName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [contacts, memberSearch]);

  const selectedMemberPreview = selectedMemberIds
    .map((memberId) => contacts.find((contact) => String(contact.id) === String(memberId)))
    .filter((contact): contact is IChatContact => Boolean(contact));

  const activeConversationTitle = activeTab === "direct"
    ? selectedDirectContact?.username
    : selectedGroup?.name;

  const activeConversationSubtitle = activeTab === "direct"
    ? selectedDirectContact?.email
    : selectedGroup
      ? `${selectedGroup.memberCount} thành viên`
      : undefined;

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white shadow-xl">
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-sm text-slate-200">
              <MessageSquare className="h-4 w-4" />
              Chat nội bộ
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">Nhắn tin giữa admin, user và nhóm thành viên</h1>
            <p className="max-w-2xl text-sm text-slate-200">
              Gửi tin nhắn riêng tư hoặc chat theo nhóm. Nhóm mới có thể được tạo ngay trong màn hình chat để các member trao đổi với nhau.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-200">Direct</p>
              <p className="text-2xl font-semibold">{contacts.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-200">Groups</p>
              <p className="text-2xl font-semibold">{groups.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-xs text-slate-200">Mode</p>
              <p className="text-2xl font-semibold">{isAdmin ? "Admin" : "User"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="space-y-4 p-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChatTab)} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-muted/60">
                <TabsTrigger value="direct">Cá nhân</TabsTrigger>
                <TabsTrigger value="group">Nhóm</TabsTrigger>
              </TabsList>

              <TabsContent value="direct" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Danh sách liên hệ</h2>
                    <Badge variant="secondary">{filteredContacts.length}</Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={contactSearch}
                      onChange={(event) => setContactSearch(event.target.value)}
                      placeholder="Tìm theo tên, email, vai trò..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <ScrollArea className="h-[calc(100vh-20rem)] min-h-[460px] pr-2">
                  <div className="space-y-2">
                    {isContactsLoading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-xl border p-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))
                    ) : filteredContacts.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Không có liên hệ phù hợp.
                      </div>
                    ) : (
                      filteredContacts.map((contact) => {
                        const active = String(contact.id) === String(selectedDirectId);

                        return (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => setSelectedDirectId(contact.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:bg-accent/50",
                              active && "border-primary/50 bg-primary/10",
                            )}
                          >
                            <div className="relative">
                              <Avatar className="h-11 w-11 border">
                                <AvatarImage src={contact.avatarUrl || ""} alt={contact.username} />
                                <AvatarFallback>{getInitials(contact.username)}</AvatarFallback>
                              </Avatar>
                              {contact.unreadCount > 0 ? (
                                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                                  {contact.unreadCount}
                                </span>
                              ) : null}
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate font-medium">{contact.username}</p>
                                {contact.roleName ? <Badge variant="outline" className="h-5 text-[10px]">{contact.roleName}</Badge> : null}
                              </div>
                              <p className="truncate text-xs text-muted-foreground">{contact.email}</p>
                              <p className="truncate text-xs text-muted-foreground">{contact.lastMessagePreview || "Chưa có tin nhắn"}</p>
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>{contact.lastMessageAt ? formatTime(contact.lastMessageAt) : ""}</span>
                                <span>{contact.unreadCount > 0 ? `${contact.unreadCount} chưa đọc` : ""}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="group" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold">Nhóm chat</h2>
                      <p className="text-xs text-muted-foreground">Tạo nhóm để các member trao đổi với nhau.</p>
                    </div>
                    <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Tạo nhóm
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Tạo nhóm chat</DialogTitle>
                          <DialogDescription>
                            Chọn các member sẽ tham gia nhóm. Bạn sẽ được thêm tự động vào nhóm vừa tạo.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="group-name">Tên nhóm</Label>
                              <Input
                                id="group-name"
                                value={groupName}
                                onChange={(event) => setGroupName(event.target.value)}
                                placeholder="Ví dụ: Sprint 12 team"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="group-description">Mô tả</Label>
                              <Textarea
                                id="group-description"
                                value={groupDescription}
                                onChange={(event) => setGroupDescription(event.target.value)}
                                placeholder="Mô tả ngắn cho nhóm chat"
                                className="min-h-[120px]"
                              />
                            </div>

                            <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                              Đã chọn <span className="font-semibold text-foreground">{selectedMemberIds.length}</span> member.
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                value={memberSearch}
                                onChange={(event) => setMemberSearch(event.target.value)}
                                placeholder="Tìm member theo tên hoặc email..."
                                className="pl-10"
                              />
                            </div>

                            <ScrollArea className="h-[360px] rounded-xl border">
                              <div className="space-y-2 p-3">
                                {isContactsLoading ? (
                                  Array.from({ length: 5 }).map((_, index) => (
                                    <div key={index} className="flex items-center gap-3 rounded-xl border p-3">
                                      <Skeleton className="h-9 w-9 rounded-full" />
                                      <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-20" />
                                      </div>
                                    </div>
                                  ))
                                ) : memberCandidates.length === 0 ? (
                                  <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    Không có member phù hợp.
                                  </div>
                                ) : (
                                  memberCandidates.map((contact) => {
                                    const checked = selectedMemberIds.some((id) => String(id) === String(contact.id));

                                    return (
                                      <label
                                        key={contact.id}
                                        htmlFor={`member-${contact.id}`}
                                        className={cn(
                                          "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-accent/50",
                                          checked && "border-primary/50 bg-primary/10",
                                        )}
                                      >
                                        <Checkbox
                                          id={`member-${contact.id}`}
                                          checked={checked}
                                          onCheckedChange={(value) => handleToggleMember(contact.id, Boolean(value))}
                                        />
                                        <Avatar className="h-9 w-9 border">
                                          <AvatarImage src={contact.avatarUrl || ""} alt={contact.username} />
                                          <AvatarFallback>{getInitials(contact.username)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate font-medium">{contact.username}</p>
                                          <p className="truncate text-xs text-muted-foreground">{contact.email}</p>
                                        </div>
                                        {checked ? <Check className="h-4 w-4 text-primary" /> : null}
                                      </label>
                                    );
                                  })
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>

                        {selectedMemberPreview.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedMemberPreview.map((contact) => (
                              <Badge key={contact.id} variant="secondary" className="gap-1">
                                {contact.username}
                              </Badge>
                            ))}
                          </div>
                        ) : null}

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
                            Hủy
                          </Button>
                          <Button
                            onClick={() => void createGroupMutation.mutateAsync()}
                            disabled={createGroupMutation.isPending || !groupName.trim() || selectedMemberIds.length === 0}
                          >
                            {createGroupMutation.isPending ? (
                              <span className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang tạo
                              </span>
                            ) : (
                              "Tạo nhóm"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={groupSearch}
                      onChange={(event) => setGroupSearch(event.target.value)}
                      placeholder="Tìm theo tên nhóm, mô tả hoặc người tạo..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <ScrollArea className="h-[calc(100vh-20rem)] min-h-[460px] pr-2">
                  <div className="space-y-2">
                    {isGroupsLoading ? (
                      Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-xl border p-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))
                    ) : filteredGroups.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Chưa có nhóm chat nào.
                      </div>
                    ) : (
                      filteredGroups.map((group) => {
                        const active = String(group.id) === String(selectedGroupId);

                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => setSelectedGroupId(group.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all hover:bg-accent/50",
                              active && "border-primary/50 bg-primary/10",
                            )}
                          >
                            <Avatar className="h-11 w-11 border">
                              <AvatarFallback>{getInitials(group.name)}</AvatarFallback>
                            </Avatar>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate font-medium">{group.name}</p>
                                <Badge variant="outline" className="h-5 text-[10px]">
                                  {group.memberCount} member
                                </Badge>
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {group.description || `Tạo bởi ${group.creatorName || "hệ thống"}`}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {group.lastMessagePreview || "Chưa có tin nhắn"}
                              </p>
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>{group.creatorName ? `Creator: ${group.creatorName}` : ""}</span>
                                <span>{group.lastMessageAt ? formatTime(group.lastMessageAt) : ""}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex h-full min-h-[720px] flex-col p-4">
            {!activeConversationTitle ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                <Users className="h-10 w-10" />
                <div>
                  <p className="font-medium text-foreground">Chọn một cuộc trò chuyện để bắt đầu</p>
                  <p className="text-sm">Tin nhắn 1-1 hoặc nhóm sẽ hiển thị tại đây.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback>{getInitials(activeConversationTitle)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">{activeConversationTitle}</h2>
                        {activeTab === "group" ? (
                          <Badge variant="secondary">Nhóm</Badge>
                        ) : selectedDirectContact?.roleName ? (
                          <Badge variant="secondary">{selectedDirectContact.roleName}</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{activeConversationSubtitle}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-muted-foreground">
                    {isFetching ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải...
                      </span>
                    ) : (
                      "Live chat"
                    )}
                  </div>
                </div>

                <ScrollArea className="flex-1 pr-3">
                  <div className="space-y-3 pb-4">
                    {isMessagesLoading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className={cn("flex", index % 2 === 0 ? "justify-start" : "justify-end")}>
                          <div className="max-w-[75%] space-y-2 rounded-2xl border p-3">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-48" />
                          </div>
                        </div>
                      ))
                    ) : (conversationPage?.items ?? []).length === 0 ? (
                      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Chưa có tin nhắn nào. Hãy gửi tin nhắn đầu tiên.
                      </div>
                    ) : (
                      conversationPage?.items.map((chatMessage) => {
                        const isMine = String(chatMessage.senderId) === String(user?.id);

                        return (
                          <div key={chatMessage.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                            <div
                              className={cn(
                                "max-w-[78%] rounded-2xl border px-4 py-3 shadow-sm",
                                isMine
                                  ? "border-primary/30 bg-primary text-primary-foreground"
                                  : "border-border/70 bg-muted/40",
                              )}
                            >
                              <div className="mb-1 flex items-center justify-between gap-3 text-[11px] opacity-80">
                                <span className="font-medium">
                                  {isMine ? "Bạn" : chatMessage.senderName}
                                </span>
                                <span>{formatTime(chatMessage.createdAt)}</span>
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{chatMessage.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="mt-4 border-t pt-4">
                  <div className="space-y-3">
                    <Textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        activeTab === "direct"
                          ? `Nhắn cho ${activeConversationTitle}... (Enter để gửi, Shift+Enter để xuống dòng)`
                          : `Nhắn trong nhóm ${activeConversationTitle}... (Enter để gửi, Shift+Enter để xuống dòng)`
                      }
                      className="min-h-[100px] resize-none"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        {activeTab === "direct"
                          ? "Tin nhắn sẽ gửi riêng cho người bạn đang chọn."
                          : "Tin nhắn sẽ hiển thị cho tất cả thành viên trong nhóm."}
                      </p>
                      <Button
                        onClick={() => void handleSend()}
                        disabled={sendMessageMutation.isPending || !message.trim()}
                        className="min-w-28"
                      >
                        {sendMessageMutation.isPending ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang gửi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Gửi
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;
