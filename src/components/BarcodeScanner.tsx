
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MOCK_PRODUCTS } from "@/context/PdvContext";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan }) => {
  const [open, setOpen] = useState(false);

  const handleSelectProduct = (barcode: string) => {
    onScan(barcode);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Simular Leitor de Código de Barras
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecione um produto para simular a leitura</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {MOCK_PRODUCTS.map((product) => (
            <Button
              key={product.id}
              variant="outline"
              className="justify-between"
              onClick={() => handleSelectProduct(product.barcode)}
            >
              <span>{product.name}</span>
              <span className="text-gray-500 ml-2">{product.barcode}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
