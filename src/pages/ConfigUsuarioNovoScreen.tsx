
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, ArrowLeft } from "lucide-react";
import ConfigLayoutWithSidebar from "@/components/ConfigLayoutWithSidebar";

const ConfigUsuarioNovoScreen = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    usuario: "",
    nome: "",
    email: "",
    perfil: "",
    empresa: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Por enquanto, o botão não executa nenhuma ação
    console.log("Formulário seria salvo com os dados:", formData);
  };

  const handleCancel = () => {
    navigate("/config_usuario_edit");
  };

  // Validar se campos obrigatórios estão preenchidos
  const isFieldEmpty = (field: string) => {
    return !formData[field as keyof typeof formData];
  };

  return (
    <ConfigLayoutWithSidebar>
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="text-gray-600 hover:text-dotz-laranja"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="flex items-center justify-center space-x-3 text-2xl text-dotz-laranja flex-1">
              <UserPlus className="h-8 w-8" />
              <span>Cadastro de Novo Usuário</span>
            </CardTitle>
            <div className="w-10"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-sm font-medium text-gray-700">
                Usuário <span className="text-red-500">*</span>
              </Label>
              <Input
                id="usuario"
                value={formData.usuario}
                onChange={(e) => handleInputChange('usuario', e.target.value)}
                placeholder="Digite o nome de usuário"
                className={`w-full ${isFieldEmpty('usuario') ? 'border-red-300' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Digite o nome completo"
                className={`w-full ${isFieldEmpty('nome') ? 'border-red-300' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                E-mail <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Digite o e-mail"
                className={`w-full ${isFieldEmpty('email') ? 'border-red-300' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perfil" className="text-sm font-medium text-gray-700">
                Perfil
              </Label>
              <Select 
                value={formData.perfil} 
                onValueChange={(value) => handleInputChange('perfil', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {/* Por enquanto, sem opções carregadas */}
                  <SelectItem value="placeholder" disabled>
                    Nenhum perfil disponível
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="empresa" className="text-sm font-medium text-gray-700">
                Empresa
              </Label>
              <Select 
                value={formData.empresa} 
                onValueChange={(value) => handleInputChange('empresa', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {/* Por enquanto, sem opções carregadas */}
                  <SelectItem value="placeholder" disabled>
                    Nenhuma empresa disponível
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="px-6"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              variant="dotz"
              className="px-6"
            >
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </ConfigLayoutWithSidebar>
  );
};

export default ConfigUsuarioNovoScreen;
