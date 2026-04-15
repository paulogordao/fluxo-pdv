

## Plano: Corrigir Build + Implementar Delete de Empresa

### 1. Corrigir erros de build (`NodeJS.Timeout`)

Dois arquivos usam `NodeJS.Timeout` que nao existe no contexto browser/Vite. Trocar por `ReturnType<typeof setInterval>`:

- **`src/hooks/useRliwaitPolling.ts`** (linha 31): `useRef<NodeJS.Timeout | null>` → `useRef<ReturnType<typeof setInterval> | null>`
- **`src/pages/ConfirmacaoPagamentoScreen.tsx`** (linha 559): `let interval: NodeJS.Timeout` → `let interval: ReturnType<typeof setInterval>`

### 2. Adicionar `deleteEmpresa` ao service

**`src/services/empresaService.ts`** — novo metodo:

```typescript
async deleteEmpresa(id: string, userId: string) {
  const response = await fetch(`${API_CONFIG.baseUrl}/empresas?id=${id}`, {
    method: 'DELETE',
    headers: {
      ...API_CONFIG.defaultHeaders,
      'id-usuario': userId,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
  }

  return response.json();
}
```

O backend espera:
- **DELETE** `simuladorPDV/empresas?id={empresa_id}`
- Header `id-usuario` + `x-api-key`
- Retorna `{ empresa_id, code, mensagem }`

### 3. Implementar delete na tela `ConfigEmpresaListScreen`

- Adicionar modal de confirmacao (AlertDialog) antes de excluir
- Mostrar nome da empresa no modal: "Tem certeza que deseja excluir a empresa X?"
- Ao confirmar, chamar `empresaService.deleteEmpresa(empresa.id, userId)`
- Exibir toast de sucesso ou erro
- Recarregar a lista apos exclusao bem-sucedida
- Estado de loading no botao durante a requisicao

### Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useRliwaitPolling.ts` | Fix `NodeJS.Timeout` |
| `src/pages/ConfirmacaoPagamentoScreen.tsx` | Fix `NodeJS.Timeout` |
| `src/services/empresaService.ts` | Adicionar `deleteEmpresa` |
| `src/pages/ConfigEmpresaListScreen.tsx` | Modal de confirmacao + logica de delete |

