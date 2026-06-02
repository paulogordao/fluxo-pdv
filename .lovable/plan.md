## Objetivo

Quando `tipo_simulacao === "Totvs - Versão 2"`, o campo "Identificador loja" deve:
- Aceitar apenas **inteiro de 3 dígitos** (`001` a `999`)
- **Não aplicar** máscara de CNPJ
- Validar conforme a faixa acima (em vez da validação de CNPJ)
- Usar placeholder apropriado (ex.: `001`) e `maxLength={3}`

## Arquivos afetados

1. `src/pages/CadastroEmpresaScreen.tsx`
2. `src/pages/ConfigEmpresaScreen.tsx`
3. `src/pages/ConfigEmpresaEditScreen.tsx`

## Mudanças por arquivo

### Schema (zod) — em cada arquivo
Tornar a validação do campo `cnpj` condicional ao `tipo_simulacao` via `superRefine` (ou `discriminatedUnion`/`refine`):

```ts
const schema = z.object({
  ...,
  cnpj: z.string().min(1, "Campo obrigatório"),
  tipo_simulacao: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.tipo_simulacao === "Totvs - Versão 2") {
    if (!/^\d{3}$/.test(data.cnpj) || +data.cnpj < 1 || +data.cnpj > 999) {
      ctx.addIssue({ path: ["cnpj"], code: "custom",
        message: "Identificador deve ter 3 dígitos (001 a 999)" });
    }
  } else {
    // manter a validação de CNPJ atual de cada tela
  }
});
```

> Observação: `ConfigEmpresaEditScreen` usa `validateCNPJ` do utils; `Cadastro` e `ConfigEmpresaScreen` usam regex de máscara. Cada tela preservará sua regra atual no `else`.

### Handler de digitação
Criar handler único `handleIdentificadorChange` que escolhe a transformação conforme tipo:

```ts
const isTotvs = watch("tipo_simulacao") === "Totvs - Versão 2";

const handleIdentificadorChange = (e) => {
  if (isTotvs) {
    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 3);
    setValue("cnpj", onlyDigits, { shouldValidate: true });
  } else {
    // fluxo atual de máscara CNPJ (formatCNPJ / formatCNPJInput)
  }
};
```

No `ConfigEmpresaScreen.tsx`, manter o auto-preenchimento via BrasilAPI **somente quando não for Totvs** (pular `fetchCNPJData` se `isTotvs`).

### Input JSX
- `placeholder`: `isTotvs ? "001" : "XX.XXX.XXX/XXXX-XX"`
- `maxLength`: `isTotvs ? 3 : 18`
- `inputMode`: `isTotvs ? "numeric" : "text"`
- Loader/spinner do BrasilAPI ocultado quando `isTotvs`.

### Persistência (envio para API)
- `ConfigEmpresaEditScreen` atualmente envia `normalizeCNPJ(data.cnpj)`. Para Totvs, enviar o valor cru (3 dígitos) sem normalizar.
- `ConfigEmpresaScreen` (criar) já envia `data.cnpj` cru — sem alteração no submit.
- `CadastroEmpresaScreen` (simulado) — sem alteração.

### Carga inicial (Edit)
Em `ConfigEmpresaEditScreen` linha ~100, ao carregar a empresa: se `data.tipo_simulacao === "Totvs - Versão 2"`, **não** aplicar `formatCNPJInput`; setar o valor cru.

## Fora do escopo

- Backend / banco: o valor continuará sendo persistido no mesmo campo `cnpj` da empresa. Caso seja necessário um campo dedicado `id_store`, confirmar antes.
