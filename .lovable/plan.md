

## Correcao: Implementar Delete no ConfigEmpresaEditarScreen

### Problema

A rota `/config_empresa_list` renderiza `ConfigEmpresaEditarScreen.tsx`, onde o `handleDelete` apenas loga e nao faz nada:

```typescript
const handleDelete = (empresa: Empresa) => {
  log.info('Apagar empresa:', empresa);
  // Funcionalidade será implementada posteriormente
};
```

### Solucao

Alterar `src/pages/ConfigEmpresaEditarScreen.tsx` para:

1. Adicionar estados `empresaToDelete` e `deleting`
2. Importar `AlertDialog`, `Loader2`, `toast`
3. Substituir `handleDelete` por logica que abre o modal de confirmacao
4. Adicionar `handleDeleteConfirm` que chama `empresaService.deleteEmpresa(id, userId)` e atualiza a lista
5. Adicionar o `AlertDialog` no JSX com botoes Cancelar/Excluir

### Arquivo alterado

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/ConfigEmpresaEditarScreen.tsx` | Implementar modal de confirmacao + chamada ao `deleteEmpresa` |

O servico `empresaService.deleteEmpresa` ja existe e esta correto (DELETE com header `id-usuario`).

