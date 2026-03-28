import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useBoardDetail, useLists, useCards, useCreateList, useCreateCard, useUpdateCard, useUpdateList, useDeleteList, useLabels, useBoardMembers } from "@/hooks/useBoards";
import { useAuth } from "@/hooks/useAuth";
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanList } from "@/components/board/KanbanList";
import { KanbanCard } from "@/components/board/KanbanCard";
import { CardDetailDialog } from "@/components/board/CardDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Kanban, Plus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function BoardView() {
  const { id: boardId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: board } = useBoardDetail(boardId);
  const { data: lists = [] } = useLists(boardId);
  const { data: cards = [] } = useCards(boardId);
  const createList = useCreateList();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const updateList = useUpdateList();

  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingCardListId, setAddingCardListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const cardsByList = useMemo(() => {
    const map: Record<string, typeof cards> = {};
    lists.forEach(l => { map[l.id] = []; });
    cards.forEach(c => {
      if (map[c.list_id]) map[c.list_id].push(c);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.position - b.position));
    return map;
  }, [lists, cards]);

  const handleAddList = async () => {
    if (!newListTitle.trim() || !boardId) return;
    try {
      await createList.mutateAsync({ board_id: boardId, title: newListTitle.trim(), position: lists.length });
      setNewListTitle("");
      setAddingList(false);
    } catch { toast.error("Lỗi tạo list"); }
  };

  const handleAddCard = async (listId: string) => {
    if (!newCardTitle.trim()) return;
    const listCards = cardsByList[listId] || [];
    try {
      await createCard.mutateAsync({ list_id: listId, title: newCardTitle.trim(), position: listCards.length });
      setNewCardTitle("");
      setAddingCardListId(null);
    } catch { toast.error("Lỗi tạo card"); }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCard = cards.find(c => c.id === active.id);
    if (!activeCard) return;

    // Check if dropping over a list
    const overList = lists.find(l => l.id === over.id);
    const overCard = cards.find(c => c.id === over.id);

    let targetListId = overList?.id || overCard?.list_id;
    if (!targetListId || targetListId === activeCard.list_id) return;

    // Move card to new list optimistically
    await updateCard.mutateAsync({ id: activeCard.id, list_id: targetListId, position: (cardsByList[targetListId]?.length || 0) });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCard = cards.find(c => c.id === active.id);
    const overCard = cards.find(c => c.id === over.id);

    if (activeCard && overCard && activeCard.list_id === overCard.list_id) {
      // Reorder within same list
      const listCards = [...(cardsByList[activeCard.list_id] || [])];
      const oldIndex = listCards.findIndex(c => c.id === active.id);
      const newIndex = listCards.findIndex(c => c.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        listCards.splice(oldIndex, 1);
        listCards.splice(newIndex, 0, activeCard);
        
        // Update positions
        for (let i = 0; i < listCards.length; i++) {
          if (listCards[i].position !== i) {
            await supabase.from("cards").update({ position: i }).eq("id", listCards[i].id);
          }
        }
        qc.invalidateQueries({ queryKey: ["cards", boardId] });
      }
    }
  };

  const activeCard = cards.find(c => c.id === activeId);
  const selectedCard = cards.find(c => c.id === selectedCardId);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: board?.background_color || "#1e40af" }}>
      {/* Board header */}
      <header className="flex items-center gap-3 px-4 h-12 bg-black/20 text-white backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" asChild>
          <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="font-bold text-lg">{board?.title || "Loading..."}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <Users className="h-4 w-4 mr-1" /> Thành viên
          </Button>
        </div>
      </header>

      {/* Kanban area */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 p-4 items-start h-full min-h-0">
            {lists.map((list) => (
              <KanbanList
                key={list.id}
                list={list}
                cards={cardsByList[list.id] || []}
                onAddCard={() => { setAddingCardListId(list.id); setNewCardTitle(""); }}
                addingCard={addingCardListId === list.id}
                newCardTitle={newCardTitle}
                onNewCardTitleChange={setNewCardTitle}
                onSubmitCard={() => handleAddCard(list.id)}
                onCancelAdd={() => setAddingCardListId(null)}
                onCardClick={(cardId) => setSelectedCardId(cardId)}
              />
            ))}

            {/* Add list */}
            {addingList ? (
              <div className="w-72 shrink-0 bg-card rounded-xl p-3 space-y-2">
                <Input
                  autoFocus
                  placeholder="Nhập tên list..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddList(); if (e.key === "Escape") setAddingList(false); }}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddList} disabled={createList.isPending}>Thêm list</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingList(false)}><X className="h-4 w-4" /></Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingList(true)}
                className="w-72 shrink-0 rounded-xl bg-white/20 hover:bg-white/30 text-white p-3 text-left text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="h-4 w-4" /> Thêm list khác
              </button>
            )}
          </div>

          <DragOverlay>
            {activeCard && (
              <div className="bg-card rounded-lg shadow-lg p-3 w-64 opacity-90 rotate-3">
                <p className="text-sm">{activeCard.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Card detail dialog */}
      {selectedCard && (
        <CardDetailDialog
          card={selectedCard}
          boardId={boardId!}
          open={!!selectedCardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}
    </div>
  );
}
