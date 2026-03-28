import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useBoards() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["boards", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boards")
        .select("*, board_members(count), lists(cards(count))")
        .eq("is_deleted", false)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ title, description, background_color }: { title: string; description?: string; background_color?: string }) => {
      const { data, error } = await supabase
        .from("boards")
        .insert({ title, description, background_color: background_color || "#1e40af", owner_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["boards"] }),
  });
}

export function useBoardDetail(boardId: string | undefined) {
  return useQuery({
    queryKey: ["board", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("id", boardId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!boardId,
  });
}

export function useLists(boardId: string | undefined) {
  return useQuery({
    queryKey: ["lists", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("board_id", boardId!)
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!boardId,
  });
}

export function useCards(boardId: string | undefined) {
  return useQuery({
    queryKey: ["cards", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("*, card_labels(label_id, labels(*))")
        .in("list_id", 
          (await supabase.from("lists").select("id").eq("board_id", boardId!)).data?.map(l => l.id) || []
        )
        .order("position");
      if (error) throw error;
      return data;
    },
    enabled: !!boardId,
  });
}

export function useCreateList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ board_id, title, position }: { board_id: string; title: string; position: number }) => {
      const { data, error } = await supabase
        .from("lists")
        .insert({ board_id, title, position })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["lists", data.board_id] }),
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ list_id, title, position }: { list_id: string; title: string; position: number }) => {
      const { data, error } = await supabase
        .from("cards")
        .insert({ list_id, title, position, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; list_id?: string; position?: number; title?: string; description?: string; due_date?: string | null; cover_color?: string | null }) => {
      const { data, error } = await supabase
        .from("cards")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
  });
}

export function useUpdateList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; title?: string; position?: number }) => {
      const { data, error } = await supabase
        .from("lists")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["lists", data.board_id] }),
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
  });
}

export function useDeleteList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cards").delete().in("list_id", [id]);
      if (!error) {
        const { error: listErr } = await supabase.from("lists").delete().eq("id", id);
        if (listErr) throw listErr;
      } else throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lists"] });
      qc.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useLabels(boardId: string | undefined) {
  return useQuery({
    queryKey: ["labels", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labels")
        .select("*")
        .eq("board_id", boardId!);
      if (error) throw error;
      return data;
    },
    enabled: !!boardId,
  });
}

export function useComments(cardId: string | undefined) {
  return useQuery({
    queryKey: ["comments", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .eq("card_id", cardId!)
        .eq("is_hidden", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!cardId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ card_id, content }: { card_id: string; content: string }) => {
      const { data, error } = await supabase
        .from("comments")
        .insert({ card_id, content, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["comments", data.card_id] }),
  });
}

export function useChecklists(cardId: string | undefined) {
  return useQuery({
    queryKey: ["checklists", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists")
        .select("*, checklist_items(*)")
        .eq("card_id", cardId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!cardId,
  });
}

export function useCreateChecklist() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ card_id, title }: { card_id: string; title: string }) => {
      const { data, error } = await supabase
        .from("checklists")
        .insert({ card_id, title })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["checklists", data.card_id] }),
  });
}

export function useCreateChecklistItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ checklist_id, title, position }: { checklist_id: string; title: string; position: number }) => {
      const { data, error } = await supabase
        .from("checklist_items")
        .insert({ checklist_id, title, position })
        .select("*, checklists(card_id)")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => qc.invalidateQueries({ queryKey: ["checklists", data.checklists?.card_id] }),
  });
}

export function useToggleChecklistItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { data, error } = await supabase
        .from("checklist_items")
        .update({ is_completed })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });
}

export function useBoardMembers(boardId: string | undefined) {
  return useQuery({
    queryKey: ["board_members", boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_members")
        .select("*, profiles:user_id(full_name, avatar_url)")
        .eq("board_id", boardId!);
      if (error) throw error;
      return data;
    },
    enabled: !!boardId,
  });
}

export function useAddBoardMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ board_id, user_id, role }: { board_id: string; user_id: string; role?: string }) => {
      const { data, error } = await supabase
        .from("board_members")
        .insert({ board_id, user_id, role: (role || "member") as any })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["board_members", data.board_id] }),
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ board_id, name, color }: { board_id: string; name: string; color: string }) => {
      const { data, error } = await supabase
        .from("labels")
        .insert({ board_id, name, color })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["labels", data.board_id] }),
  });
}

export function useToggleCardLabel() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ card_id, label_id, action }: { card_id: string; label_id: string; action: "add" | "remove" }) => {
      if (action === "add") {
        const { error } = await supabase.from("card_labels").insert({ card_id, label_id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("card_labels").delete().eq("card_id", card_id).eq("label_id", label_id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards"] }),
  });
}
