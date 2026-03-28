import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBoards, useCreateBoard } from "@/hooks/useBoards";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Kanban, LogOut, Plus, Shield, Star, Clock, Users } from "lucide-react";
import { toast } from "sonner";

const BOARD_COLORS = [
  "#1e40af", "#0f766e", "#9333ea", "#dc2626",
  "#ea580c", "#ca8a04", "#16a34a", "#6366f1",
  "#ec4899", "#64748b",
];

export default function Boards() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { data: boards, isLoading } = useBoards();
  const createBoard = useCreateBoard();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [bgColor, setBgColor] = useState(BOARD_COLORS[0]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await createBoard.mutateAsync({ title: title.trim(), background_color: bgColor });
      toast.success("Tạo board thành công!");
      setTitle("");
      setOpen(false);
    } catch {
      toast.error("Lỗi khi tạo board");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <Kanban className="h-5 w-5" />
              TaskFlow
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/admin"><Shield className="h-4 w-4 mr-1" />Admin</Link>
              </Button>
            )}
            <span className="text-sm opacity-80">{profile?.full_name}</span>
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Your boards */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Các board của bạn</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
              ))
            ) : (
              <>
                {boards?.map((board) => (
                  <Link
                    key={board.id}
                    to={`/board/${board.id}`}
                    className="group relative h-24 rounded-lg p-3 text-white font-semibold text-sm overflow-hidden hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: board.background_color || "#1e40af" }}
                  >
                    <span className="relative z-10">{board.title}</span>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  </Link>
                ))}

                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <button className="h-24 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-sm text-muted-foreground transition-colors">
                      <Plus className="h-4 w-4 mr-1" />
                      Tạo board mới
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Tạo board mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Preview */}
                      <div
                        className="h-28 rounded-lg p-3 text-white font-semibold"
                        style={{ backgroundColor: bgColor }}
                      >
                        {title || "Tên board"}
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Màu nền</label>
                        <div className="flex gap-2 flex-wrap">
                          {BOARD_COLORS.map((c) => (
                            <button
                              key={c}
                              className={`w-8 h-8 rounded-md transition-all ${bgColor === c ? "ring-2 ring-offset-2 ring-ring" : ""}`}
                              style={{ backgroundColor: c }}
                              onClick={() => setBgColor(c)}
                            />
                          ))}
                        </div>
                      </div>

                      <Input
                        placeholder="Nhập tên board..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        autoFocus
                      />

                      <Button
                        onClick={handleCreate}
                        disabled={!title.trim() || createBoard.isPending}
                        className="w-full"
                      >
                        Tạo board
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
