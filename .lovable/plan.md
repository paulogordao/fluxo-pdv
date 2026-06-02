## Objetivo

Adicionar a opção **"Totvs - Versão 2"** no select **Tipo de Simulação** em todas as telas de empresa, e quando essa opção estiver selecionada, trocar a label do campo **"CNPJ *"** para **"Identificador loja (ID STORE) *"**.

## Arquivos afetados

1. `src/pages/ConfigEmpresaScreen.tsx`
2. `src/pages/ConfigEmpresaEditScreen.tsx`
3. `src/pages/CadastroEmpresaScreen.tsx`

## Mudanças por arquivo

Em cada um dos três arquivos:

1. **Adicionar o SelectItem** logo após `"Versão 2"`:
   ```tsx
   <SelectItem value="Totvs - Versão 2">Totvs - Versão 2</SelectItem>
   ```

2. **Tornar a label do CNPJ dinâmica** usando o valor atual de `tipo_simulacao` (já disponível via `watch("tipo_simulacao")`):
   ```tsx
   <Label htmlFor="cnpj">
     {watch("tipo_simulacao") === "Totvs - Versão 2"
       ? "Identificador loja (ID STORE) *"
       : "CNPJ *"}
   </Label>
   ```

## Fora do escopo

- Validação/máscara do campo CNPJ permanece inalterada (a máscara `XX.XXX.XXX/XXXX-XX` continua aplicada mesmo quando o label muda). Caso queira remover/alterar a validação quando for "Totvs - Versão 2", confirmar antes.
- Placeholder do input não será alterado (apenas o label) — confirmar se deseja também ajustar o placeholder.
