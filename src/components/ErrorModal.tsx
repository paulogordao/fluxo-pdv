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
import { useState } from "react";
import { createLogger } from '@/utils/logger';

const log = createLogger('ErrorModal');

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
  errorCode: string;
  errorMessage: string;
  fullRequest?: any;
  fullResponse?: any;
  apiType?: 'RLIFUND' | 'RLIDEAL' | string;
}

const ErrorModal = ({ 
  isOpen, 
  onClose, 
  onRetry, 
  errorCode, 
  errorMessage, 
  fullRequest, 
  fullResponse,
  apiType = 'RLIFUND'
}: ErrorModalProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getErrorMessage = (code: string, originalMessage: string) => {
    switch (code) {
      case '008':
        return 'Timeout: O serviço não respondeu em tempo hábil. Tente novamente.';
      default:
        return originalMessage;
    }
  };

  const displayMessage = getErrorMessage(errorCode, errorMessage);

  const copyToClipboard = async () => {
    const details = {
      error: {
        code: errorCode,
        message: errorMessage
      },
      request: fullRequest,
      response: fullResponse,
      timestamp: new Date().toISOString()
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(details, null, 2));
      // Poderia adicionar um toast aqui para confirmar que foi copiado
    } catch (error) {
      log.error('Erro ao copiar para clipboard:', error);
    }
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Erro na API {apiType}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                <div className="font-semibold text-destructive">
                  Código: {errorCode}
                </div>
                 <div className="text-sm mt-2">
                   {displayMessage}
                 </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  {showDetails ? '▼' : '▶'} Detalhes técnicos
                </button>

                {showDetails && (
                  <div className="space-y-3 text-xs">
                    {fullRequest && (
                      <div>
                        <div className="font-semibold mb-1">Request:</div>
                        <pre className="bg-muted p-3 rounded border overflow-x-auto">
                          {JSON.stringify(fullRequest, null, 2)}
                        </pre>
                      </div>
                    )}

                    {fullResponse && (
                      <div>
                        <div className="font-semibold mb-1">Response:</div>
                        <pre className="bg-muted p-3 rounded border overflow-x-auto">
                          {JSON.stringify(fullResponse, null, 2)}
                        </pre>
                      </div>
                    )}

                    <button
                      onClick={copyToClipboard}
                      className="bg-secondary text-secondary-foreground px-3 py-1 rounded text-xs hover:bg-secondary/80"
                    >
                      Copiar detalhes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {onRetry && (
            <AlertDialogAction onClick={onRetry} className="bg-primary">
              Tentar Novamente
            </AlertDialogAction>
          )}
          <AlertDialogCancel onClick={onClose}>
            Fechar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ErrorModal;