import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ValidationModalProps {
  isOpen: boolean;
  onPrimaryAction: () => void;
  onCancel: () => void;
  message: string;
  title?: string;
  primaryButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
}

const ValidationModal = ({ 
  isOpen, 
  onPrimaryAction, 
  onCancel, 
  message, 
  title = "Validação do Token",
  primaryButtonText = "Tentar Novamente",
  cancelButtonText = "Cancelar",
  showCancelButton = true
}: ValidationModalProps) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {showCancelButton && (
            <AlertDialogCancel onClick={onCancel}>
              {cancelButtonText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction onClick={onPrimaryAction}>
            {primaryButtonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ValidationModal;