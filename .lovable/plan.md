

## Plano: Habilitar edição do campo CNPJ

### Alteração

No arquivo `src/pages/ConfigEmpresaEditScreen.tsx`, o campo CNPJ está travado (`disabled`) com uma mensagem "CNPJ não pode ser alterado". A mudança consiste em:

1. **Remover `disabled` e classe `bg-gray-100 cursor-not-allowed`** do input CNPJ
2. **Adicionar máscara de formatação** (XX.XXX.XXX/XXXX-XX) usando `formatCNPJInput` de `src/utils/cnpjUtils.ts`
3. **Adicionar validação** no schema zod para garantir 14 dígitos
4. **Remover a mensagem** "🔒 CNPJ não pode ser alterado"
5. **Normalizar o CNPJ** (remover máscara) antes de enviar ao backend no `onSubmit`

### Arquivo alterado

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/ConfigEmpresaEditScreen.tsx` | Habilitar campo CNPJ com máscara e validação |

### Detalhes técnicos

- Importar `formatCNPJInput`, `normalizeCNPJ`, `validateCNPJ` de `@/utils/cnpjUtils`
- Criar `handleCnpjChange` similar ao `handleTelefoneChange` para aplicar máscara
- Atualizar schema: `cnpj: z.string().min(1, "CNPJ é obrigatório").refine(val => validateCNPJ(val), "CNPJ deve ter 14 dígitos")`
- No `onSubmit`, normalizar: `cnpj: normalizeCNPJ(data.cnpj)`

