
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFakeProducts } from "@/hooks/useFakeProducts";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan }) => {
  const [open, setOpen] = useState(false);
  const { fakeProducts, isLoadingProducts } = useFakeProducts();

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
          {isLoadingProducts ? (
            <div className="text-center py-4 text-gray-500">Carregando produtos...</div>
          ) : fakeProducts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Nenhum produto disponível</div>
          ) : (
            fakeProducts.slice(0, 10).map((product) => (
              <Button
                key={product.ean}
                variant="outline"
                className="justify-between"
                onClick={() => handleSelectProduct(product.ean)}
              >
                <span>{product.name}</span>
                <span className="text-gray-500 ml-2">{product.ean}</span>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScanner;
