
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ScanScreen from "./ScanScreen";

const InteressePagamentoScreen = () => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const handleClose = () => {
    setOpen(false);
    navigate("/scan");
  };
  
  const handleUsePoints = () => {
    setOpen(false);
    navigate("/meios_de_pagamento");
  };

  return (
    <>
      {/* Display the ScanScreen component as background */}
      <div className="pointer-events-none opacity-70">
        <ScanScreen />
      </div>

      {/* Overlay the dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white bg-dotz-laranja p-4 -m-6 mb-4 text-center">
              Benefícios cliente A
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 text-center">
            <h3 className="text-xl font-semibold mb-3">Falta Pouco!</h3>
            <p className="mb-6">
              Você possui pontos para resgatar nessa compra.
              <br />
              Deseja usar esses pontos?
            </p>
            
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                className="min-w-[120px] bg-gray-300 hover:bg-gray-400"
                onClick={handleClose}
              >
                Nenhum
              </Button>
              
              <Button
                className="min-w-[120px] bg-dotz-laranja hover:bg-dotz-laranja/90"
                onClick={handleUsePoints}
              >
                Sim, quero usar!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InteressePagamentoScreen;
