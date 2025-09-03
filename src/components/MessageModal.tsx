import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MessageModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  message,
  onConfirm,
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            Mensagem Dotz
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base leading-relaxed">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-center pt-4">
          <AlertDialogAction
            onClick={onConfirm}
            className="px-8 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Sim/Avançar
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};