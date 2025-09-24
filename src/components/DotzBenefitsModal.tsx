import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DotzBenefitsModalProps {
  isOpen: boolean;
  onUsePoints: () => void;
  onSkipPoints: () => void;
  dynamicMessage?: string;
}

const DotzBenefitsModal: React.FC<DotzBenefitsModalProps> = ({
  isOpen,
  onUsePoints,
  onSkipPoints,
  dynamicMessage,
}) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-0 rounded-2xl overflow-hidden">
        {/* Header laranja */}
        <div className="bg-dotz-laranja p-4 flex items-center justify-between">
          <h2 className="text-white text-lg font-bold">Benefícios</h2>
          <button
            onClick={onSkipPoints}
            className="text-white hover:text-white/80 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Conteúdo principal */}
        <div className="p-6 bg-white">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-gray-900">
              Falta Pouco!
            </h3>
            
            <p className="text-gray-600 text-base leading-relaxed whitespace-pre-line">
              {dynamicMessage || "Você tem pontos disponíveis para usar nesta compra e economizar ainda mais!"}
            </p>

            {/* Botões */}
            <div className="flex flex-col space-y-3 mt-6">
              <Button
                onClick={onUsePoints}
                className="w-full bg-dotz-laranja hover:bg-dotz-laranja/90 text-white font-semibold py-3 rounded-xl text-base"
              >
                Sim, quero usar!
              </Button>
              
              <Button
                onClick={onSkipPoints}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-xl text-base"
              >
                Nenhum
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DotzBenefitsModal;