import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  useUpdateCard, useDeleteCard, useComments, useCreateComment,
  useChecklists, useCreateChecklist, useCreateChecklistItem, useToggleChecklistItem,
  useLabels, useCreateLabel, useToggleCardLabel
} from "@/hooks/useBoards";
import { useAuth } from "@/hooks/useAuth";
import {
  AlignLeft, Calendar as CalendarIcon, CheckSquare, CreditCard, MessageSquare,
  Plus, Tag, Trash2, X
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CardDetailDialogProps {
  card: any;
  boardId: string;
  open: boolean;
  onClose: () => void;
}

export function CardDetailDialog({ card, boardId, open, onClose }: CardDetailDialogProps) {
  const { user } = useAuth();
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();
  const { data: comments = [] } = useComments(card.id);
  const createComment = useCreateComment();
  const { data: checklists = [] } = useChecklists(card.id);
  const createChecklist = useCreateChecklist();
  const createItem = useCreateChecklistItem();
  const toggleItem = useToggleChecklistItem();
  const { data: boardLabels = [] } = useLabels(boardId);
  const createLabel = useCreateLabel();
  const toggleCardLabel = useToggleCardLabel();

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [editingDesc, setEditingDesc] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [addingItemId, setAddingItemId] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(card.due_date ? new Date(card.due_date) : undefined);

  const cardLabelIds = card.card_labels?.map((cl: any) => cl.label_id) || [];

  const handleSaveTitle = async () => {
    if (title.trim() && title !== card.title) {
      await updateCard.mutateAsync({ id: card.id, title: title.trim() });
    }
    setEditingTitle(false);
  };

  const handleSaveDesc = async () => {
    await updateCard.mutateAsync({ id: card.id, description });
    setEditingDesc(false);
    toast.success("Đã lưu mô tả");
  };

  const handleDueDateChange = async (date: Date | undefined) => {
    setDueDate(date);
    await updateCard.mutateAsync({ id: card.id, due_date: date ? date.toISOString() : null });
    toast.success(date ? "Đã cập nhật deadline" : "Đã xoá deadline");
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await createComment.mutateAsync({ card_id: card.id, content: commentText.trim() });
    setCommentText("");
  };

  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    await createChecklist.mutateAsync({ card_id: card.id, title: newChecklistTitle.trim() });
    setNewChecklistTitle("");
    setAddingChecklist(false);
  };

  const handleAddChecklistItem = async (checklistId: string) => {
    if (!newItemTitle.trim()) return;
    const checklist = checklists.find((c: any) => c.id === checklistId);
    const itemCount = checklist?.checklist_items?.length || 0;
    await createItem.mutateAsync({ checklist_id: checklistId, title: newItemTitle.trim(), position: itemCount });
    setNewItemTitle("");
    setAddingItemId(null);
  };

  const handleDelete = async () => {
    if (!confirm("Xoá card này?")) return;
    await deleteCard.mutateAsync(card.id);
    onClose();
    toast.success("Đã xoá card");
  };

  const LABEL_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        {/* Title */}
        <DialogHeader>
          <div className="flex items-start gap-2">
            <CreditCard className="h-5 w-5 mt-1 text-muted-foreground shrink-0" />
            {editingTitle ? (
              <Input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                className="text-lg font-semibold"
              />
            ) : (
              <DialogTitle
                className="cursor-pointer hover:bg-muted px-2 py-1 rounded text-left"
                onClick={() => setEditingTitle(true)}
              >
                {card.title}
              </DialogTitle>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_170px] gap-4 mt-2">
          {/* Main content */}
          <div className="space-y-5">
            {/* Labels */}
            {cardLabelIds.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Nhãn</p>
                <div className="flex gap-1 flex-wrap">
                  {boardLabels.filter((l: any) => cardLabelIds.includes(l.id)).map((label: any) => (
                    <Badge key={label.id} style={{ backgroundColor: label.color }} className="text-white text-xs">
                      {label.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Due date badge */}
            {dueDate && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Deadline</p>
                <Badge variant="outline" className="gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {format(dueDate, "dd/MM/yyyy")}
                </Badge>
              </div>
            )}

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlignLeft className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Mô tả</h4>
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <Textarea
                    autoFocus
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Thêm mô tả chi tiết..."
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDesc}>Lưu</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>Huỷ</Button>
                  </div>
                </div>
              ) : (
                <div
                  className="min-h-[60px] bg-muted rounded-lg p-3 text-sm cursor-pointer hover:bg-muted/80"
                  onClick={() => setEditingDesc(true)}
                >
                  {description || "Thêm mô tả chi tiết..."}
                </div>
              )}
            </div>

            {/* Checklists */}
            {checklists.map((checklist: any) => {
              const items = checklist.checklist_items || [];
              const done = items.filter((i: any) => i.is_completed).length;
              const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
              return (
                <div key={checklist.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-sm flex-1">{checklist.title}</h4>
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full mb-2">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="space-y-1">
                    {items.sort((a: any, b: any) => a.position - b.position).map((item: any) => (
                      <label key={item.id} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted cursor-pointer">
                        <Checkbox
                          checked={item.is_completed}
                          onCheckedChange={(checked) => toggleItem.mutate({ id: item.id, is_completed: !!checked })}
                        />
                        <span className={cn("text-sm", item.is_completed && "line-through text-muted-foreground")}>{item.title}</span>
                      </label>
                    ))}
                  </div>
                  {addingItemId === checklist.id ? (
                    <div className="mt-2 space-y-2">
                      <Input
                        autoFocus
                        placeholder="Thêm mục..."
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddChecklistItem(checklist.id); if (e.key === "Escape") setAddingItemId(null); }}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAddChecklistItem(checklist.id)}>Thêm</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddingItemId(null)}>Huỷ</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="mt-1" onClick={() => { setAddingItemId(checklist.id); setNewItemTitle(""); }}>
                      <Plus className="h-3 w-3 mr-1" /> Thêm mục
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Bình luận</h4>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Viết bình luận..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                {commentText.trim() && (
                  <Button size="sm" onClick={handleAddComment} disabled={createComment.isPending}>Gửi</Button>
                )}
                {comments.map((comment: any) => (
                  <div key={comment.id} className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{(comment as any).profiles?.full_name || "User"}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(comment.created_at), "dd/MM HH:mm")}</span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar actions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Thêm vào card</p>

            {/* Labels */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" size="sm" className="w-full justify-start gap-2">
                  <Tag className="h-3.5 w-3.5" /> Nhãn
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60" align="start">
                <p className="text-sm font-medium mb-2">Nhãn</p>
                <div className="space-y-1">
                  {boardLabels.map((label: any) => (
                    <label key={label.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer">
                      <Checkbox
                        checked={cardLabelIds.includes(label.id)}
                        onCheckedChange={(checked) =>
                          toggleCardLabel.mutate({ card_id: card.id, label_id: label.id, action: checked ? "add" : "remove" })
                        }
                      />
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: label.color }} />
                      <span className="text-sm">{label.name}</span>
                    </label>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Tạo nhãn mới</p>
                  <div className="flex gap-1 flex-wrap mb-2">
                    {LABEL_COLORS.map(c => (
                      <button key={c} className="w-6 h-6 rounded" style={{ backgroundColor: c }}
                        onClick={async () => {
                          const name = prompt("Tên nhãn?");
                          if (name) await createLabel.mutateAsync({ board_id: boardId, name, color: c });
                        }}
                      />
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Checklist */}
            {addingChecklist ? (
              <div className="space-y-2">
                <Input
                  autoFocus
                  placeholder="Tên checklist..."
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddChecklist(); if (e.key === "Escape") setAddingChecklist(false); }}
                />
                <Button size="sm" onClick={handleAddChecklist} className="w-full">Thêm</Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" className="w-full justify-start gap-2"
                onClick={() => { setAddingChecklist(true); setNewChecklistTitle("Checklist"); }}>
                <CheckSquare className="h-3.5 w-3.5" /> Checklist
              </Button>
            )}

            {/* Due date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" size="sm" className="w-full justify-start gap-2">
                  <CalendarIcon className="h-3.5 w-3.5" /> Deadline
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={handleDueDateChange}
                  className="p-3 pointer-events-auto"
                />
                {dueDate && (
                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-destructive" onClick={() => handleDueDateChange(undefined)}>
                      Xoá deadline
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <div className="border-t pt-2 mt-4">
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" /> Xoá card
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
