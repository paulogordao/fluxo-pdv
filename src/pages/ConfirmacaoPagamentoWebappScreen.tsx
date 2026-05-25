import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, RefreshCw, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TechnicalFooter from "@/components/TechnicalFooter";
import GuiaDeNavegacaoAPI from "@/components/GuiaDeNavegacaoAPI";
import EncerrarAtendimentoButton from "@/components/EncerrarAtendimentoButton";
import { useRliwaitPolling } from "@/hooks/useRliwaitPolling";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { createLogger } from "@/utils/logger";

const log = createLogger("ConfirmacaoPagamentoWebappScreen");

const ConfirmacaoPagamentoWebappScreen = () => {
  const navigate = useNavigate();
  const transactionId = localStorage.getItem("transactionId");

  const [technicalRequestData, setTechnicalRequestData] = useState<string | undefined>();
  const [technicalResponseData, setTechnicalResponseData] = useState<string | undefined>();
  const [technicalPreviousRequestData, setTechnicalPreviousRequestData] = useState<string | undefined>();
  const [timeoutModalOpen, setTimeoutModalOpen] = useState(false);

  const { pollingStatus, startPolling, stopPolling, sendCancelRequest } = useRliwaitPolling(
    transactionId,
    false
  );

  const pollingStartedRef = useRef(false);

  // Load technical data
  useEffect(() => {
    const rlidealResponse = localStorage.getItem("rlidealResponse");
    if (rlidealResponse) {
      try {
        const parsed = JSON.parse(rlidealResponse);
        if (Array.isArray(parsed) && parsed[0]) {
          if (parsed[0].request) {
            setTechnicalPreviousRequestData(JSON.stringify(parsed[0].request, null, 2));
          }
          if (parsed[0].response) {
            setTechnicalResponseData(JSON.stringify(parsed[0].response, null, 2));
          }
        }
      } catch (err) {
        log.error("Erro ao parsear rlidealResponse:", err);
        setTechnicalResponseData(rlidealResponse);
      }
    }

    if (transactionId) {
      setTechnicalRequestData(
        JSON.stringify(
          { route: "RLIWAIT", version: 1, input: { transaction_id: transactionId } },
          null,
          2
        )
      );
    }
  }, [transactionId]);

  // Start polling once on mount
  useEffect(() => {
    if (transactionId && !pollingStartedRef.current) {
      log.info("Starting RLIWAIT polling for webapp flow (ONCE)");
      pollingStartedRef.current = true;
      startPolling();
    }
    return () => {
      if (pollingStartedRef.current) {
        stopPolling();
        pollingStartedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pollingStatus.status === "timeout") {
      setTimeoutModalOpen(true);
    }
  }, [pollingStatus.status]);

  const handleFinalizarPagamento = () => {
    if (pollingStatus.orderData) {
      localStorage.setItem(
        "orderData",
        JSON.stringify({
          order: pollingStatus.orderData.order,
          payments: pollingStatus.orderData.payments,
          transaction_id: pollingStatus.orderData.transaction_id,
          customer_info_id: pollingStatus.orderData.customer_info_id,
          next_step: pollingStatus.nextStepData,
        })
      );
      navigate("/confirmacao_pagamento", { state: { fromWebappScreen: true } });
    }
  };

  const handleCancel = async () => {
    log.info("User clicked cancel button");
    if (transactionId) {
      await sendCancelRequest();
      if (pollingStatus.isPolling) stopPolling();
    }
    navigate("/confirmacao_pagamento", { state: { fromWebappScreen: true } });
  };

  const handleTimeoutRestart = () => {
    setTimeoutModalOpen(false);
    startPolling();
  };

  const handleTimeoutCancel = () => {
    setTimeoutModalOpen(false);
    navigate("/meios_de_pagamento");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-16">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Panel - PDV */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-dotz-laranja text-white p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pagamento</h2>
            <EncerrarAtendimentoButton />
          </div>
          <div className="p-6 text-center">
            <p className="text-lg mb-6">
              Aguardando o cliente concluir o resgate no celular (webapp).
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Um link foi enviado ao cliente. Ele finalizará o pagamento navegando pelo navegador
              do próprio celular.
            </p>
            <div className="flex justify-center gap-4 mt-8">
              {pollingStatus.status === "completed" ? (
                <Button
                  variant="dotz"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleFinalizarPagamento}
                >
                  Finalizar Pagamento
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Polling status */}
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full">
            <div className="bg-blue-600 text-white p-4 text-center">
              <h3 className="text-lg font-semibold">Status do Pagamento (Webapp)</h3>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {pollingStatus.isPolling ? (
                    <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
                  ) : pollingStatus.status === "completed" ? (
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl">✓</span>
                    </div>
                  ) : pollingStatus.status === "error" ? (
                    <AlertTriangle className="h-12 w-12 text-red-500" />
                  ) : (
                    <Smartphone className="h-12 w-12 text-gray-400" />
                  )}
                </div>

                <h4 className="text-xl font-semibold mb-2">
                  {pollingStatus.status === "polling" && "Aguardando confirmação no celular..."}
                  {pollingStatus.status === "completed" && "Pagamento confirmado!"}
                  {pollingStatus.status === "error" && "Erro na verificação"}
                  {pollingStatus.status === "cancelled" && "Verificação cancelada"}
                  {pollingStatus.status === "waiting" && "Preparando verificação..."}
                </h4>

                <p className="text-gray-600 mb-4">
                  {pollingStatus.status === "polling" &&
                    "O cliente está concluindo o resgate pelo navegador do celular (webapp)."}
                  {pollingStatus.status === "completed" && "O pagamento foi processado com sucesso."}
                  {pollingStatus.status === "error" && "Houve um erro ao verificar o status."}
                  {pollingStatus.status === "cancelled" && "A verificação foi interrompida."}
                  {pollingStatus.status === "waiting" && "Aguarde enquanto preparamos a verificação."}
                </p>
              </div>

              {pollingStatus.isPolling && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <div className="text-sm text-blue-800">
                    <p className="mb-1">
                      <strong>Tentativa:</strong> {pollingStatus.attempts}
                    </p>
                    {pollingStatus.lastAttemptTime && (
                      <p className="mb-1">
                        <strong>Última verificação:</strong>{" "}
                        {pollingStatus.lastAttemptTime.toLocaleTimeString()}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-2">
                      ⏱️ Verificação automática a cada 10 segundos
                    </p>
                  </div>
                </div>
              )}

              {pollingStatus.status === "error" && pollingStatus.error && (
                <div className="bg-red-50 p-4 rounded-lg mb-4">
                  <div className="text-sm text-red-800">
                    <p>
                      <strong>Erro:</strong> {pollingStatus.error}
                    </p>
                  </div>
                </div>
              )}

              {pollingStatus.nextStepData && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="text-sm text-gray-800">
                    <p>
                      <strong>Status atual:</strong> {pollingStatus.nextStepData.description}
                    </p>
                    <p>
                      <strong>Código:</strong> {pollingStatus.nextStepData.code}
                    </p>
                  </div>
                </div>
              )}

              {pollingStatus.isPolling && (
                <Button variant="outline" className="w-full" onClick={handleCancel}>
                  Cancelar Verificação
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <GuiaDeNavegacaoAPI />

      <TechnicalFooter
        requestData={technicalRequestData}
        responseData={technicalResponseData}
        previousRequestData={technicalPreviousRequestData}
        isLoading={false}
        slug="RLIDEALRLIWAIT"
        loadOnMount={false}
        sourceScreen="confirmacao_pagamento_webapp"
        previousServiceName="RLIDEAL"
      />

      <AlertDialog open={timeoutModalOpen} onOpenChange={setTimeoutModalOpen}>
        <AlertDialogContent className="p-0 overflow-hidden max-w-md">
          <AlertDialogHeader className="bg-red-600 text-white px-6 py-4">
            <div className="flex items-center justify-center space-x-2">
              <Clock className="h-5 w-5" />
              <AlertDialogTitle className="text-lg font-semibold">Tempo Esgotado</AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <div className="p-6">
            <p className="text-center mb-6">
              Não foi possível detectar o pagamento em 5 minutos. Deseja tentar novamente?
            </p>
            <div className="flex justify-center space-x-3">
              <AlertDialogAction
                className="bg-dotz-laranja hover:bg-dotz-laranja/90 text-white"
                onClick={handleTimeoutRestart}
              >
                Tentar Novamente
              </AlertDialogAction>
              <Button variant="outline" onClick={handleTimeoutCancel}>
                Cancelar
              </Button>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConfirmacaoPagamentoWebappScreen;
