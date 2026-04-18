import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Plus, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDeleteList, useUpdateList } from "@/hooks/useBoards";
import { useState } from "react";
import { toast } from "sonner";

interface KanbanListProps {
  list: { id: string; title: string; position: number; board_id: string };
  cards: any[];
  onAddCard: () => void;
  addingCard: boolean;
  newCardTitle: string;
  onNewCardTitleChange: (v: string) => void;
  onSubmitCard: () => void;
  onCancelAdd: () => void;
  onCardClick: (cardId: string) => void;
}

export function KanbanList({ list, cards, onAddCard, addingCard, newCardTitle, onNewCardTitleChange, onSubmitCard, onCancelAdd, onCardClick }: KanbanListProps) {
  const { setNodeRef } = useDroppable({ id: list.id });
  const deleteList = useDeleteList();
  const updateList = useUpdateList();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);

  const handleRename = async () => {
    if (editTitle.trim() && editTitle.trim() !== list.title) {
      await updateList.mutateAsync({ id: list.id, title: editTitle.trim() });
    }
    setEditing(false);
  };

  return (
    <div className="w-72 shrink-0 bg-card rounded-xl flex flex-col max-h-[calc(100vh-8rem)]">
      {/* List header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        {editing ? (
          <Input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditing(false); }}
            className="h-7 text-sm font-semibold"
          />
        ) : (
          <h3
            className="font-semibold text-sm cursor-pointer px-1"
            onClick={() => { setEditing(true); setEditTitle(list.title); }}
          >
            {list.title}
          </h3>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAddCard}>Thêm card</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                if (confirm("Xoá list này và tất cả cards?")) {
                  await deleteList.mutateAsync(list.id);
                  toast.success("Đã xoá list");
                }
              }}
            >
              Xoá list
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[4px]">
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onClick={() => onCardClick(card.id)} />
          ))}
        </SortableContext>

        {addingCard && (
          <div className="space-y-2">
            <textarea
              autoFocus
              className="w-full rounded-lg border bg-background p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={2}
              placeholder="Nhập tên card..."
              value={newCardTitle}
              onChange={(e) => onNewCardTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmitCard(); }
                if (e.key === "Escape") onCancelAdd();
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSubmitCard}>Thêm card</Button>
              <Button size="sm" variant="ghost" onClick={onCancelAdd}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Add card button */}
      {!addingCard && (
        <button
          onClick={onAddCard}
          className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-b-xl transition-colors"
        >
          <Plus className="h-4 w-4" /> Thêm card
        </button>
      )}
    </div>
  );
}
