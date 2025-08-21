import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import TagManager from "./TagManager";
import { formatDateBR, parseDateISO, isValidDateString } from "@/utils/dateUtils";

interface EditableCellProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  placeholder?: string;
  type?: "text" | "tags" | "date";
  disabled?: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  className,
  placeholder = "Clique para editar",
  type = "text",
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setEditValue(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const parseTags = (tags: string): string[] => {
    if (!tags || !tags.trim()) return [];
    return tags.split(';').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  const formatTags = (tags: string[]): string => {
    return tags.join(';');
  };

  const handleTagsChange = (newTags: string[]) => {
    const formattedTags = formatTags(newTags);
    onSave(formattedTags);
  };

  if (disabled) {
    return (
      <div className={cn("min-h-8 flex items-center", className)}>
        {type === "tags" && value ? (
          <TagManager
            tags={parseTags(value)}
            onTagsChange={() => {}} // Disabled, no changes allowed
            disabled={true}
            className=""
          />
        ) : type === "date" && value ? (
          <span className="text-sm">{formatDateBR(value)}</span>
        ) : (
          <span className="text-sm">{value || placeholder}</span>
        )}
      </div>
    );
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const isoDate = selectedDate.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
      onSave(isoDate);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    if (type === "tags") {
      return (
        <TagManager
          tags={parseTags(editValue)}
          onTagsChange={handleTagsChange}
          className={cn("min-h-8", className)}
          placeholder={placeholder}
        />
      );
    }

    if (type === "date") {
      const currentDate = editValue ? new Date(editValue) : undefined;
      const isValidDate = currentDate && !isNaN(currentDate.getTime());
      
      return (
        <Popover open={true} onOpenChange={(open) => !open && setIsEditing(false)}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal min-h-8 text-sm",
                !isValidDate && "text-muted-foreground",
                className
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {isValidDate ? formatDateBR(editValue) : placeholder}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={isValidDate ? currentDate : undefined}
              onSelect={handleDateSelect}
              disabled={(date) => date > new Date()}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={cn("min-h-8 text-sm", className)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      className={cn(
        "min-h-8 flex items-center cursor-pointer hover:bg-accent/50 px-2 py-1 rounded transition-colors",
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      {type === "tags" && value ? (
        <div className="flex flex-wrap gap-1">
          {parseTags(value).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      ) : type === "date" ? (
        <div className="flex items-center">
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className={cn("text-sm", !value && "text-muted-foreground italic")}>
            {value ? formatDateBR(value) : placeholder}
          </span>
        </div>
      ) : (
        <span className={cn("text-sm", !value && "text-muted-foreground")}>
          {value || placeholder}
        </span>
      )}
    </div>
  );
};

export default EditableCell;