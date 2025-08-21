import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  placeholder?: string;
  type?: "text" | "tags";
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

  if (disabled) {
    return (
      <div className={cn("min-h-8 flex items-center", className)}>
        {type === "tags" && value ? (
          <div className="flex flex-wrap gap-1">
            {parseTags(value).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-sm">{value || placeholder}</span>
        )}
      </div>
    );
  }

  if (isEditing) {
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
        "min-h-8 flex items-center cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors",
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
      ) : (
        <span className={cn("text-sm", !value && "text-gray-500")}>
          {value || placeholder}
        </span>
      )}
    </div>
  );
};

export default EditableCell;