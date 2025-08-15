
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
      className={`w-full min-h-[60px] h-auto px-4 py-3 text-base font-medium whitespace-normal leading-relaxed ${
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
