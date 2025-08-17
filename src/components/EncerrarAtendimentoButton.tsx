import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useEncerrarAtendimento } from '@/hooks/useEncerrarAtendimento';
import EncerrarAtendimentoModal from './EncerrarAtendimentoModal';
import { Alert, AlertDescription } from '@/components/ui/alert';

const EncerrarAtendimentoButton = () => {
  const {
    isModalOpen,
    isLoading,
    error,
    openModal,
    closeModal,
    confirmarEncerramento
  } = useEncerrarAtendimento();

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={openModal}
        disabled={isLoading}
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        Encerrar Atendimento
      </Button>

      <EncerrarAtendimentoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={confirmarEncerramento}
        isLoading={isLoading}
      />

      {error && (
        <Alert className="mt-4 border-destructive">
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default EncerrarAtendimentoButton;