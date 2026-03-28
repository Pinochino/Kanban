import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Trash2, RotateCcw, ArrowRightLeft } from "lucide-react";

export default function BoardManagement() {
  const [search, setSearch] = useState("");
  const [transferBoardId, setTransferBoardId] = useState<string | null>(null);
  const [newOwnerId, setNewOwnerId] = useState("");
  const queryClient = useQueryClient();

  const { data: boards, isLoading } = useQuery({
    queryKey: ["admin-boards"],
    queryFn: async () => {
      const { data } = await supabase.from("boards").select("*, board_members(count), profiles!boards_owner_id_fkey(full_name)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users-simple"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data || [];
    },
  });

  const softDelete = useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase.from("boards").update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-boards"] }); toast.success("Đã xóa board!"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const restore = useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase.from("boards").update({ is_deleted: false, deleted_at: null }).eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-boards"] }); toast.success("Đã khôi phục board!"); },
    onError: (err: Error) => toast.error(err.message),
  });

  const transfer = useMutation({
    mutationFn: async ({ boardId, newOwner }: { boardId: string; newOwner: string }) => {
      const { error } = await supabase.from("boards").update({ owner_id: newOwner }).eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-boards"] });
      toast.success("Đã chuyển chủ board!");
      setTransferBoardId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const activeBoards = boards?.filter((b) => !b.is_deleted && (b.title.toLowerCase().includes(search.toLowerCase()))) ?? [];
  const deletedBoards = boards?.filter((b) => b.is_deleted && (b.title.toLowerCase().includes(search.toLowerCase()))) ?? [];

  const BoardTable = ({ items, showRestore }: { items: typeof activeBoards; showRestore?: boolean }) => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên board</TableHead>
            <TableHead>Chủ sở hữu</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
          ) : items.map((board) => (
            <TableRow key={board.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: board.background_color || "#1e40af" }} />
                  {board.title}
                </div>
              </TableCell>
              <TableCell>{(board as any).profiles?.full_name || "—"}</TableCell>
              <TableCell>{(board as any).board_members?.[0]?.count ?? 0}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{new Date(board.created_at).toLocaleDateString("vi-VN")}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {showRestore ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => restore.mutate(board.id)} title="Khôi phục">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      <Dialog open={transferBoardId === board.id} onOpenChange={(open) => !open && setTransferBoardId(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTransferBoardId(board.id)} title="Chuyển chủ">
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Chuyển quyền sở hữu</DialogTitle></DialogHeader>
                          <Select onValueChange={setNewOwnerId}>
                            <SelectTrigger><SelectValue placeholder="Chọn người dùng mới" /></SelectTrigger>
                            <SelectContent>
                              {users?.filter((u) => u.user_id !== board.owner_id).map((u) => (
                                <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || u.user_id}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={() => transfer.mutate({ boardId: board.id, newOwner: newOwnerId })} disabled={!newOwnerId}>
                            Xác nhận chuyển
                          </Button>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa board?</AlertDialogTitle>
                            <AlertDialogDescription>Board "{board.title}" sẽ được chuyển vào thùng rác. Bạn có thể khôi phục sau.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => softDelete.mutate(board.id)} className="bg-destructive text-destructive-foreground">Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Quản lý Boards</h2>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm board..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Đang hoạt động ({activeBoards.length})</TabsTrigger>
          <TabsTrigger value="deleted">Đã xóa ({deletedBoards.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active"><BoardTable items={activeBoards} /></TabsContent>
        <TabsContent value="deleted"><BoardTable items={deletedBoards} showRestore /></TabsContent>
      </Tabs>
    </div>
  );
}
