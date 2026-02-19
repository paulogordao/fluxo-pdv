
## Correção: Build Error — @hookform/resolvers incompatível com zod v3

### Causa Raiz

O `@hookform/resolvers` na versão `^5.0.1` foi instalado no projeto, mas essa versão requer `zod` v4. O projeto utiliza `zod` v3 (`^3.23.8`), gerando o erro:

```
[commonjs--resolver] Missing "./v4/core" specifier in "zod" package
```

O `@hookform/resolvers` v5 tenta importar `zod/v4/core`, que simplesmente não existe no `zod` v3.

### Solução

Alterar **apenas** a versão do `@hookform/resolvers` no `package.json` de `^5.0.1` para `^4.3.0`, que é totalmente compatível com `zod` v3 (versão atual do projeto).

**Arquivo:** `package.json` — linha 14

```
// ANTES
"@hookform/resolvers": "^5.0.1"

// DEPOIS
"@hookform/resolvers": "^4.3.0"
```

### Impacto

- Nenhuma alteração em lógica, telas, serviços ou fluxos de dados
- Nenhuma mudança no `id_usuario` ou em qualquer serviço de API
- Todas as validações de formulário com Zod continuam funcionando normalmente
- O build será desbloqueado e o preview carregará com o novo domínio `n8n-prod.plsm.com.br` já configurado

### Arquivo Alterado

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| `package.json` | 14 | `@hookform/resolvers` `^5.0.1` → `^4.3.0` |
