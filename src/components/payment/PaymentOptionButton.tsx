
import { Button } from "@/components/ui/button";

interface PaymentOptionButtonProps {
  selected: boolean;
  onClick: () => void;
  label: string;
}

const PaymentOptionButton = ({ 
  selected, 
  onClick, 
  label 
}: PaymentOptionButtonProps) => {
  return (
    <Button 
      onClick={onClick}
      variant={selected ? "default" : "outline"}
      className={`w-full py-6 text-base font-medium ${
        selected 
          ? "bg-dotz-laranja hover:bg-dotz-laranja/90 text-white" 
          : "bg-gray-300 hover:bg-gray-400 text-black"
      }`}
    >
      {label}
    </Button>
  );
};

export default PaymentOptionButton;
