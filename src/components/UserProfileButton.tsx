
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, User, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserProfileButtonProps {
  userName?: string;
  companyName?: string;
}

const UserProfileButton = ({ userName = "Usuário", companyName = "Empresa" }: UserProfileButtonProps) => {
  const navigate = useNavigate();

  return (
    <Card className="shadow-md border border-dotz-pessego hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/configuracoes")}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-dotz-laranja rounded-full">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center space-x-1 text-sm font-medium text-gray-900">
              <User className="h-4 w-4 text-dotz-laranja" />
              <span>{userName}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <Building2 className="h-3 w-3 text-dotz-laranja" />
              <span>{companyName}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileButton;
