import React, { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagManagerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const TagManager: React.FC<TagManagerProps> = ({
  tags,
  onTagsChange,
  className,
  placeholder = "Digite uma tag e pressione Enter",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onTagsChange([...tags, trimmedValue]);
      setInputValue("");
    }
  };

  const removeTag = (indexToRemove: number) => {
    onTagsChange(tags.filter((_, index) => index !== indexToRemove));
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(tags[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const trimmedValue = editValue.trim();
      if (trimmedValue && !tags.includes(trimmedValue)) {
        const newTags = [...tags];
        newTags[editingIndex] = trimmedValue;
        onTagsChange(newTags);
      }
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  if (disabled) {
    return (
      <div className={cn("flex flex-wrap gap-1", className)}>
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Existing Tags */}
      <div className="flex flex-wrap gap-1">
        {tags.map((tag, index) => (
          <div key={index} className="relative group">
            {editingIndex === index ? (
              <Input
                ref={editInputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={handleEditKeyDown}
                className="h-6 text-xs px-2 w-20 min-w-fit"
                style={{ width: `${Math.max(editValue.length * 8 + 16, 80)}px` }}
              />
            ) : (
              <Badge
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-secondary/80 pr-6 relative group"
                onClick={() => startEditing(index)}
              >
                {tag}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(index);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 rounded-full p-0.5"
                >
                  <X size={10} className="text-red-600" />
                </button>
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Add New Tag Input */}
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        className="text-xs h-8"
      />
    </div>
  );
};

export default TagManager;
