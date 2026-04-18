import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, CheckSquare, MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";

interface KanbanCardProps {
  card: any;
  onClick: () => void;
}

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const labels = card.card_labels?.map((cl: any) => cl.labels).filter(Boolean) || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-background rounded-lg shadow-sm border hover:border-primary/50 p-2 cursor-pointer group transition-colors"
    >
      {/* Cover color */}
      {card.cover_color && (
        <div className="h-8 rounded-md mb-2" style={{ backgroundColor: card.cover_color }} />
      )}

      {/* Labels */}
      {labels.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-1.5">
          {labels.map((label: any) => (
            <span
              key={label.id}
              className="h-2 w-10 rounded-full inline-block"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm leading-snug">{card.title}</p>

      {/* Badges */}
      <div className="flex items-center gap-2 mt-2 text-muted-foreground">
        {card.due_date && (
          <span className="flex items-center gap-0.5 text-xs">
            <Calendar className="h-3 w-3" />
            {format(new Date(card.due_date), "dd/MM")}
          </span>
        )}
        {card.description && <AlignLeft className="h-3 w-3" />}
      </div>
    </div>
  );
}
