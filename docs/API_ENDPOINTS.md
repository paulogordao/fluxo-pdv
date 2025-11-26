# 📡 Documentação de Endpoints da API

## 🔧 Configuração Base

**Base URL:** `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV`

**API Key:** `0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975`

**Headers Padrão:**
```json
{
  "Content-Type": "application/json",
  "x-api-key": "0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975"
}
```

---

## 🔐 Autenticação (`authService`)

### 1. Validar Usuário (Login)

**Endpoint:** `POST /validaUsuario`

**Página:** `LoginScreen`

**Request:**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "senhaSegura123"
}
```

**Response - Sucesso:**
```json
{
  "mensagem": "Login realizado com sucesso",
  "code": 200,
  "id_usuario": "uuid-do-usuario",
  "primeiro_acesso": false
}
```

**Response - Primeiro Acesso:**
```json
{
  "mensagem": "Primeiro acesso detectado",
  "code": 200,
  "id_usuario": "uuid-do-usuario",
  "primeiro_acesso": true
}
```

**Response - Erro:**
```json
{
  "mensagem": "Credenciais inválidas",
  "code": 401
}
```

---

### 2. Solicitar Acesso

**Endpoint:** `POST /usuarios/solicitar_acesso`

**Página:** `LoginScreen` (Modal de solicitação de acesso)

**Request:**
```json
{
  "nome_empresa": "Empresa Exemplo LTDA",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@empresa.com",
  "nome": "João Silva"
}
```

**Response:**
```json
{
  "status": "success",
  "code": 200,
  "mensagem": "Solicitação enviada com sucesso"
}
```

---

### 3. Redefinir Senha

**Endpoint:** `POST /usuarios/redefinir_senha`

**Página:** `PrimeiroAcessoScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Request:**
```json
{
  "nova_senha": "novaSenhaSegura456"
}
```

**Response:**
```json
{
  "status": "success",
  "code": 200,
  "mensagem": "Senha redefinida com sucesso"
}
```

---

### 4. Esqueci Senha

**Endpoint:** `POST /usuarios/esqueci_senha`

**Página:** `LoginScreen` (Modal de esqueci senha)

**Request:**
```json
{
  "email": "usuario@exemplo.com"
}
```

**Response:**
```json
{
  "status": "success",
  "code": 200,
  "mensagem": "Email de recuperação enviado"
}
```

---

## 🛒 Fluxo PDV - Comandos (`comandoService`)

Todos os comandos do fluxo PDV utilizam o mesmo endpoint com diferentes valores no campo `comando`.

**Endpoint Base:** `POST /comando`

**Headers Adicionais para todos os comandos:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

---

### Estrutura Padrão de Response

Todos os comandos do fluxo PDV retornam uma estrutura padronizada:

```json
[
  {
    "request": {
      "route": "COMANDO",
      "version": 1,
      "input": {
        // Parâmetros enviados
      }
    },
    "response": {
      "data": {
        "transaction_id": "uuid-da-transacao",
        "customer_info_id": "cpf-do-cliente",
        "message": {
          "id": 0,
          "content": "Mensagem para o usuário",
          "link_image": null
        },
        "next_step": [
          {
            "code": 0,
            "description": "PROXIMO_COMANDO",
            "version": 1
          }
        ],
        "break_step": [
          {
            "code": 0,
            "description": "COMANDO_ALTERNATIVO",
            "version": 1
          }
        ]
      },
      "success": true
    }
  }
]
```

---

### 1. RLIINFO - Identificar CPF

**Página:** `CpfScreen`

**Request:**
```json
{
  "comando": "RLIINFO",
  "cpf": "12345678900",
  "version": "2"
}
```

**Response:**
```json
[
  {
    "request": {
      "route": "RLIINFO",
      "version": 2,
      "input": {
        "customer_info_id": "32373222884",
        "customer_info_id_type": 1,
        "employee_id": "teste_88375",
        "pos_id": "t51570",
        "order_id": "t279640"
      }
    },
    "response": {
      "data": {
        "customer": {
          "first_name": "PAULO",
          "document": "32373222884"
        },
        "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
        "customer_info_id": "32373222884",
        "message": {
          "id": 105,
          "content": "PAULO, Baixe o APP para GANHAR Dotz e pagar até R$0,00 com pontos + crédito pré aprovado em 7 dias sem juros ou até 6x!",
          "link_image": null
        },
        "next_step": [
          {
            "code": 2,
            "description": "RLICELL",
            "version": 2
          }
        ],
        "break_step": [
          {
            "code": 9,
            "description": "RLIFUND",
            "version": 1
          },
          {
            "code": 5,
            "description": "RLIQUIT",
            "version": 1
          }
        ]
      },
      "success": true
    }
  }
]
```

---

### 2. RLICELL - Validar Telefone

**Página:** `TelefoneScreen`

**Request:**
```json
{
  "comando": "RLICELL",
  "cellphone": "11999999999",
  "id_transaction": "7c9f59ce-6b39-4e47-8967-4befab20d62a"
}
```

**Response:**
```json
[
  {
    "request": {
      "route": "RLICELL",
      "version": 1,
      "input": {
        "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
        "cell_phone_number": "11983045980"
      }
    },
    "response": {
      "data": {
        "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
        "customer_info_id": "32373222884",
        "message": {
          "id": 200,
          "content": "Quase lá! Enviaremos uma mensagem para que você complete seu cadastro na Dotz!",
          "link_image": null
        },
        "next_step": [
          {
            "code": 9,
            "description": "RLIFUND",
            "version": 1
          }
        ],
        "break_step": [
          {
            "code": 5,
            "description": "RLIQUIT",
            "version": 1
          }
        ]
      },
      "success": true
    }
  }
]
```

---

### 3. RLIFUND - Consultar Fundos Disponíveis

**Páginas:** `ScanScreen`, `MeiosDePagamentoScreen`

**Request:**
```json
{
  "comando": "RLIFUND",
  "id_transaction": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
  "payment_option_type": "default",
  "value_total": "21.97",
  "items": [
    {
      "ean": "0000000000072",
      "sku": "1801253214",
      "unit_price": 8.99,
      "discount": 1.17,
      "quantity": 2,
      "name": "Slotted Turner",
      "unit_type": "UN",
      "brand": "Unknown",
      "manufacturer": "Unknown",
      "categories": ["kitchen-accessories"],
      "gross_profit_amount": 1.65,
      "is_private_label": true,
      "is_on_sale": false
    }
  ]
}
```

**Response:**
```json
[
  {
    "request": {
      "data": {
        "route": "RLIFUND",
        "version": 1,
        "input": {
          "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
          "payment_option_type": "default",
          "order": {
            "value": 21.97,
            "discount": 0,
            "date": "2025-11-26T00:58:09.245Z",
            "items": [
              {
                "ean": "0000000000072",
                "sku": "1801253214",
                "unit_price": 8.99,
                "discount": 1.17,
                "quantity": 2,
                "name": "Slotted Turner",
                "unit_type": "UN",
                "brand": "Unknown",
                "manufacturer": "Unknown",
                "categories": ["kitchen-accessories"],
                "gross_profit_amount": 1.65,
                "is_private_label": true,
                "is_on_sale": false
              },
              {
                "ean": "0000000000029",
                "sku": "408067386",
                "unit_price": 3.99,
                "discount": 0.48,
                "quantity": 1,
                "name": "Juice",
                "unit_type": "UN",
                "brand": "Unknown",
                "manufacturer": "Unknown",
                "categories": ["groceries"],
                "gross_profit_amount": 0.45,
                "is_private_label": true,
                "is_on_sale": true
              }
            ]
          }
        }
      }
    },
    "response": {
      "data": {
        "payment_options": [
          {
            "option": "app",
            "message": "Pague até R$ 21,97 desta compra pelo aplicativo"
          },
          {
            "option": "livelo",
            "message": "Pague R$ 13,18 desta compra com Livelo pelo PDV"
          },
          {
            "option": "dotz",
            "message": "Pague R$ 3,00 desta compra com Dotz pelo PDV"
          }
        ],
        "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
        "customer_info_id": "32373222884",
        "message": {
          "id": 906,
          "content": "PAULO, pague até R$13,18 com seus pontos Livelo ou R$1.000,00 no crédito s/juros ou em até 6x com a Dotz!!\nQuer usar o Benefício?",
          "link_image": null
        },
        "next_step": [
          {
            "code": 3,
            "description": "RLIDEAL",
            "version": 2
          }
        ],
        "break_step": [
          {
            "code": 5,
            "description": "RLIQUIT",
            "version": 1
          }
        ]
      },
      "success": true
    }
  }
]
```

---

### 4. RLIDEAL - Iniciar Transação

**Página:** `MeiosDePagamentoScreen`

**Request:**
```json
{
  "comando": "RLIDEAL",
  "payment_option": "dotz",
  "id_transaction": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
  "version": "2"
}
```

**Response:**
```json
[
  {
    "request": {
      "route": "RLIDEAL",
      "version": 2,
      "input": {
        "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
        "payment_option": "dotz"
      }
    },
    "response": {
      "data": {
        "otp_payment_enabled": true,
        "token": {
          "required": true,
          "type": "birthdate"
        },
        "order": {
          "value": 21.97,
          "discount": 0,
          "paid_out": 0,
          "residual": 21.97,
          "date": "2025-11-26T00:58:09.245Z",
          "payments": []
        },
        "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
        "customer_info_id": "32373222884",
        "message": {
          "id": 302,
          "content": "Aguardando autenticação no Pdv.",
          "link_image": null
        },
        "next_step": [
          {
            "code": 10,
            "description": "RLIAUTH",
            "version": 1
          }
        ],
        "break_step": [
          {
            "code": 5,
            "description": "RLIQUIT",
            "version": 1
          }
        ]
      },
      "success": true
    }
  }
]
```

---

### 5. RLIAUTH - Autenticar Token/Data Nascimento

**Páginas:** `ConfirmacaoPagamentoTokenScreen`, `OtpDataNascimentoScreen`

**Request:**
```json
{
  "comando": "RLIAUTH",
  "id_transaction": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
  "token": "06111983",
  "cancel": false
}
```

**Observação:** O campo `token` pode conter:
- Token de 6 dígitos (ex: "182101")
- Data de nascimento no formato DDMMAAAA (ex: "06111983")

**Response - Token Válido:**
```json
[
  {
    "request": {
      "route": "RLIAUTH",
      "version": 1,
      "input": {
        "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
        "token": "06111983",
        "cancel": false
      }
    },
    "response": {
      "data": {
        "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
        "customer_info_id": "32373222884",
        "message": {
          "id": 1000,
          "content": "Token validado com sucesso",
          "link_image": null
        },
        "next_step": [
          {
            "code": 6,
            "description": "RLIPAYS",
            "version": 1
          }
        ],
        "break_step": [
          {
            "code": 5,
            "description": "RLIQUIT",
            "version": 1
          }
        ]
      },
      "success": true
    }
  }
]
```

**Response - Token Inválido (Recuperável - messageId 1001):**
```json
[
  {
    "response": {
      "data": {
        "messageId": 1001,
        "message": {
          "content": "Token inválido. Tente novamente.",
          "link_image": null
        }
      },
      "success": false
    }
  }
]
```

**Response - Token Inválido (Fatal - messageId 1002):**
```json
[
  {
    "response": {
      "data": {
        "messageId": 1002,
        "message": {
          "content": "Limite de tentativas excedido. Tente novamente mais tarde.",
          "link_image": null
        }
      },
      "success": false
    }
  }
]
```

---

### 6. RLIPAYS - Confirmar Pagamento

**Página:** `ConfirmacaoPagamentoScreen`

**Request:**
```json
{
  "comando": "RLIPAYS",
  "id_transaction": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
  "payments": [
    {
      "type": 2,
      "bin": "978939",
      "amount": 18.97,
      "description": "Pagamento em cartão de crédito"
    }
  ]
}
```

**Response:**
```json
[
  {
    "request": {
      "data": {
        "route": "RLIPAYS",
        "version": 1,
        "input": {
          "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
          "payments": [
            {
              "type": 2,
              "bin": "978939",
              "amount": 18.97,
              "description": "Pagamento em cartão de crédito"
            }
          ]
        }
      }
    },
    "response": {
      "data": {
        "invoice_receipt": {
          "content": [
            "Parabens! Você ganhou Dotz!",
            "Dotz ganhos nessa compra: 1 Dotz.",
            "Baixe agora o APP Dotz ou acesse dotz.com.br e veja ainda mais benefícios!"
          ]
        },
        "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
        "customer_info_id": "32373222884",
        "message": {
          "id": 600,
          "content": "Parabéns, você irá acumular 1 Dotz nessa compra.",
          "link_image": null
        },
        "next_step": [],
        "break_step": [
          {
            "code": 7,
            "description": "RLIUNDO",
            "version": 1
          }
        ]
      },
      "success": true
    }
  }
]
```

---

### 7. RLIWAIT - Polling de Status (Pagamento por APP)

**Página:** `ConfirmacaoPagamentoAppScreen`

**Request:**
```json
{
  "comando": "RLIWAIT",
  "id_transaction": "f57941f9-4682-4656-a621-61340a2c9ac3",
  "cancel": false
}
```

**Response:**
```json
[
  {
    "request": {
      "route": "RLIWAIT",
      "version": 1,
      "input": {
        "transaction_id": "f57941f9-4682-4656-a621-61340a2c9ac3",
        "cancel": false
      }
    },
    "response": {
      "data": {
        "order": {
          "value": 7.78,
          "discount": 0,
          "paid_out": 0,
          "residual": 7.78,
          "date": "2025-11-26T01:26:54.508Z",
          "payments": []
        },
        "transaction_id": "f57941f9-4682-4656-a621-61340a2c9ac3",
        "customer_info_id": "32373222884",
        "message": {
          "id": 400,
          "content": "Aguardando pagamento no APP.",
          "link_image": null
        },
        "next_step": [
          {
            "code": 4,
            "description": "RLIWAIT",
            "version": 2
          }
        ],
        "break_step": [
          {
            "code": 9,
            "description": "RLIFUND",
            "version": 1
          },
          {
            "code": 5,
            "description": "RLIQUIT",
            "version": 1
          }
        ]
      },
      "success": true
    }
  }
]
```

---

### 8. RLIQUIT - Encerrar Atendimento

**Componente:** `EncerrarAtendimentoButton`

**Request:**
```json
{
  "comando": "RLIQUIT",
  "id_transaction": "f57941f9-4682-4656-a621-61340a2c9ac3"
}
```

**Response:**
```json
[
  {
    "request": {
      "route": "RLIQUIT",
      "version": 1,
      "input": {
        "transaction_id": "f57941f9-4682-4656-a621-61340a2c9ac3"
      }
    },
    "response": {
      "data": {
        "transaction_id": "f57941f9-4682-4656-a621-61340a2c9ac3",
        "customer_info_id": null,
        "message": {
          "id": 500,
          "content": "Desistência da compra recebido com sucesso.",
          "link_image": null
        },
        "next_step": [],
        "break_step": []
      },
      "success": true
    }
  }
]
```

---

## 📊 Transações (`transacaoService`)

### 1. Buscar Transações

**Endpoint:** `GET /transacoes`

**Página:** `RelatorioTransacoesScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
[
  {
    "data": [
      {
        "id": 1231,
        "created_at": "2025-09-09T05:39:23.927799+00:00",
        "transaction_id": "bb075d13-c769-4230-ba5b-2c2746863a5e",
        "servico": "RLIINFO",
        "request": "{\"route\":\"RLIINFO\",\"version\":1,\"input\":{\"customer_info_id\":\"16428905027\",\"customer_info_id_type\":1,\"employee_id\":\"teste_36841\",\"pos_id\":\"t07359\",\"order_id\":\"t762478\"}}",
        "response": "{\"data\":{\"customer\":{\"first_name\":\"Strikerr\",\"document\":\"16428905027\",\"balance_dz\":639610},\"has_product_dz\":0,\"transaction_id\":\"bb075d13-c769-4230-ba5b-2c2746863a5e\",\"customer_info_id\":\"16428905027\",\"message\":{\"id\":105,\"content\":\"Strikerr, Baixe o APP para GANHAR Dotz e pagar até R$7.675,32 com pontos + crédito pré aprovado em 7 dias sem juros ou até 6x!\",\"link_image\":null},\"next_step\":[{\"code\":2,\"description\":\"RLICELL\",\"version\":1}],\"break_step\":[{\"code\":3,\"description\":\"RLIDEAL\",\"version\":1},{\"code\":5,\"description\":\"RLIQUIT\",\"version\":1}]},\"success\":true}",
        "id_usuario": "f647bfee-faa2-4293-a5f2-d192a9e9f3f1",
        "id_empresa": "94a5d5c3-054a-4385-b2e3-dae4e52f681d",
        "estornado": false
      }
    ]
  }
]
```

**Observação:** Os campos `request` e `response` contêm JSON em formato string.

---

### 2. Buscar Transações Pays (Para Estorno)

**Endpoint:** `GET /transacoes/pays`

**Página:** `RelatorioEstornosScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
[
  {
    "data": [
      {
        "id": 2383,
        "created_at": "2025-09-24T12:04:43.278088+00:00",
        "transaction_id": "ffdd3b69-1c26-4f78-a856-30bea29f73ba",
        "servico": "RLIPAYS",
        "request": "{\"data\":{\"route\":\"RLIPAYS\",\"version\":1,\"input\":{\"transaction_id\":\"ffdd3b69-1c26-4f78-a856-30bea29f73ba\"}}}",
        "response": "{\"data\":{\"invoice_receipt\":{\"content\":[\"Parabens! Você ganhou Dotz!\",\"Dotz ganhos nessa compra: 1 Dotz.\",\"Baixe agora o APP Dotz ou acesse dotz.com.br e veja ainda mais benefícios!\"]},\"transaction_id\":\"ffdd3b69-1c26-4f78-a856-30bea29f73ba\",\"customer_info_id\":\"32373222884\",\"message\":{\"id\":600,\"content\":\"Parabéns, você irá acumular 1 Dotz nessa compra.\",\"link_image\":null},\"next_step\":[],\"break_step\":[{\"code\":7,\"description\":\"RLIUNDO\"}]},\"success\":true}",
        "id_usuario": "f647bfee-faa2-4293-a5f2-d192a9e9f3f1",
        "id_empresa": "5d3b3ef4-09a1-4899-901e-df9942747dfa",
        "estornado": false
      }
    ]
  }
]
```

**Observação:** Os campos `request` e `response` contêm JSON em formato string.

---

### 3. Estornar Transação

**Endpoint:** `POST /transacoes/estorno`

**Página:** `RelatorioEstornosScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Request:**
```json
{
  "id": "2383",
  "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
  "cpf": "32373222884"
}
```

**Response:**
```json
[
  {
    "request": {
      "route": "RLIUNDO",
      "version": 1,
      "input": {
        "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
        "customer_id": "32373222884"
      }
    },
    "response": {
      "data": {
        "customer_id": "32373222884",
        "transaction_id": "7c9f59ce-6b39-4e47-8967-4befab20d62a",
        "customer_info_id": null,
        "message": {
          "id": 801,
          "content": "Estorno realizado com sucesso.",
          "link_image": null
        },
        "next_step": [],
        "break_step": []
      },
      "success": true
    }
  }
]
```

**Observação:** Internamente o endpoint utiliza o comando `RLIUNDO` para processar o estorno.

---

## 🏢 Empresas (`empresaService`)

### 1. Listar Empresas

**Endpoint:** `GET /empresas`

**Página:** `ConfigEmpresaListScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "empresa-001",
      "nome": "Empresa Exemplo LTDA",
      "cnpj": "12.345.678/0001-90",
      "telefone": "11999999999",
      "email": "contato@empresa.com",
      "endereco": "Rua Exemplo, 123",
      "cidade": "São Paulo",
      "estado": "SP",
      "descricao": "Descrição da empresa",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2. Buscar Empresa por ID

**Endpoint:** `GET /empresas?id=<empresa_id>`

**Página:** `ConfigEmpresaEditScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "data": {
    "id": "empresa-001",
    "nome": "Empresa Exemplo LTDA",
    "cnpj": "12.345.678/0001-90",
    "telefone": "11999999999",
    "email": "contato@empresa.com",
    "endereco": "Rua Exemplo, 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "descricao": "Descrição da empresa",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. Criar Empresa

**Endpoint:** `POST /empresas`

**Página:** `ConfigEmpresaScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Request:**
```json
{
  "nome": "Nova Empresa LTDA",
  "cnpj": "98.765.432/0001-10",
  "telefone": "11988888888",
  "email": "contato@novaempresa.com",
  "endereco": "Av. Nova, 456",
  "cidade": "Rio de Janeiro",
  "estado": "RJ",
  "descricao": "Descrição da nova empresa"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "empresa-002",
    "mensagem": "Empresa criada com sucesso"
  }
}
```

---

### 4. Atualizar Empresa

**Endpoint:** `PUT /empresas?id=<empresa_id>`

**Página:** `ConfigEmpresaEditarScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Request:**
```json
{
  "nome": "Empresa Atualizada LTDA",
  "telefone": "11977777777",
  "email": "novo@empresa.com",
  "endereco": "Rua Atualizada, 789",
  "descricao": "Descrição atualizada"
}
```

**Response:**
```json
{
  "status": "success",
  "mensagem": "Empresa atualizada com sucesso"
}
```

---

## 👥 Usuários (`userService`)

### 1. Listar Usuários

**Endpoint:** `GET /usuarios`

**Página:** `ConfigUsuarioEditScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "user-001",
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "perfil": "ADMIN",
      "ativo": true,
      "empresa_id": "empresa-001",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2. Buscar Usuário por ID

**Endpoint:** `GET /usuarios?id_usuario_consulta=<id>`

**Página:** `ConfigUsuarioEditIndividualScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "data": {
    "id": "user-001",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "perfil": "ADMIN",
    "ativo": true,
    "empresa_id": "empresa-001",
    "permissoes": ["VER_TRANSACOES", "ESTORNAR_TRANSACOES"],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. Criar Usuário

**Endpoint:** `POST /usuarios`

**Página:** `ConfigUsuarioNovoScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Request:**
```json
{
  "nome": "Maria Santos",
  "email": "maria@exemplo.com",
  "perfil": "OPERADOR",
  "empresa_id": "empresa-001",
  "senha_temporaria": "senha123temp"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "user-002",
    "mensagem": "Usuário criado com sucesso"
  }
}
```

---

### 4. Atualizar Usuário

**Endpoint:** `PUT /usuarios`

**Página:** `ConfigUsuarioEditIndividualScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario",
  "id_usuario_consulta": "user-002"
}
```

**Request:**
```json
{
  "nome": "Maria Santos Silva",
  "perfil": "SUPERVISOR",
  "ativo": true
}
```

**Response:**
```json
{
  "status": "success",
  "mensagem": "Usuário atualizado com sucesso"
}
```

---

### 5. Listar Solicitações de Acesso

**Endpoint:** `GET /usuarios/solicitar_acesso`

**Contexto:** Admin/Configurações

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "req-001",
      "nome": "Pedro Costa",
      "email": "pedro@empresa.com",
      "nome_empresa": "Empresa Pedro LTDA",
      "cnpj": "11.222.333/0001-44",
      "status": "PENDENTE",
      "data_solicitacao": "2024-01-10T08:00:00Z"
    }
  ]
}
```

---

## 🔑 Credenciais (`credentialsService`)

### 1. Listar Credenciais

**Endpoint:** `GET /credenciais`

**Página:** `ConfigCredenciaisScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "cred-001",
      "id_parceiro": "PARTNER_001",
      "ambiente": "PRODUCAO",
      "enabled": true,
      "description": "Credencial de produção",
      "cnpj_id": "12.345.678/0001-90",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2. Buscar Credencial por ID

**Endpoint:** `GET /credenciais?id=<credencial_id>`

**Contexto:** Configurações de credenciais

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "data": {
    "ambiente": "PRODUCAO"
  }
}
```

---

### 3. Criar Credencial

**Endpoint:** `POST /credenciais`

**Página:** `ConfigCredenciaisScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Request:**
```json
{
  "id_parceiro": "PARTNER_002",
  "ambiente": "HOMOLOGACAO",
  "enabled": true,
  "description": "Credencial de testes",
  "cnpj_id": "12.345.678/0001-90",
  "api_key": "chave-secreta-aqui",
  "api_secret": "segredo-aqui"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "cred-002",
    "mensagem": "Credencial criada com sucesso"
  }
}
```

---

### 4. Atualizar Status da Credencial

**Endpoint:** `PUT /credenciais?id_credencial=<partner_id>`

**Página:** `ConfigCredenciaisScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Request:**
```json
{
  "enabled": false
}
```

**Response:**
```json
{
  "status": "success",
  "mensagem": "Credencial atualizada com sucesso"
}
```

---

### 5. Verificar Saúde da Credencial

**Endpoint:** `GET /credenciais?id=<partner_id>&status=true`

**Página:** `ConfigCredenciaisScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response - Saudável:**
```json
{
  "status": "healthy",
  "mensagem": "Credencial funcionando corretamente",
  "last_check": "2024-01-15T10:30:00Z"
}
```

**Response - Com Problemas:**
```json
{
  "status": "unhealthy",
  "mensagem": "Erro ao conectar com o parceiro",
  "error": "Connection timeout",
  "last_check": "2024-01-15T10:30:00Z"
}
```

---

### 6. Buscar Credencial por Usuário

**Endpoint:** `GET /credencialPorUsuario`

**Contexto:** Verificação de credenciais do usuário logado

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "data": {
    "ambiente": "PRODUCAO",
    "description": "Credencial principal",
    "cnpj_id": "12.345.678/0001-90",
    "enabled": true
  }
}
```

---

## 🧪 Usuários de Teste (`testUserService`)

### 1. Listar Usuários de Teste

**Endpoint:** `GET /usuarios_teste`

**Página:** `ConfigUsuariosTesteScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "data": [
    {
      "id": "test-user-001",
      "identificacao_usuario": "12345678900",
      "nome": "Usuário Teste 1",
      "tem_interesse_pagamento": true,
      "tem_fundos": true,
      "cliente_bloqueado": false,
      "pagamento_negado": false,
      "usar_token": true,
      "usar_data_nascimento": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2. Criar Usuário de Teste

**Endpoint:** `POST /usuarios_teste`

**Página:** `ConfigUsuariosTesteScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Request:**
```json
{
  "cpf": "98765432100"
}
```

**Response:**
```json
{
  "status": "success",
  "mensagem": "Usuário de teste criado com sucesso"
}
```

---

### 3. Atualizar Usuário de Teste

**Endpoint:** `PUT /usuarios_teste`

**Página:** `ConfigUsuariosTesteScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Request:**
```json
{
  "id": "test-user-001",
  "identificacao_usuario": "12345678900",
  "nome": "Usuário Teste Atualizado",
  "tem_interesse_pagamento": false,
  "tem_fundos": true,
  "cliente_bloqueado": false,
  "pagamento_negado": true,
  "usar_token": false,
  "usar_data_nascimento": true
}
```

**Response:**
```json
{
  "status": "success",
  "mensagem": "Usuário de teste atualizado com sucesso"
}
```

---

## 🔒 Permissões (`permissionService`)

### 1. Buscar Permissões do Usuário

**Endpoint:** `GET /permissoes_usuario?id_usuario=<userId>`

**Contexto:** Hook `useUserPermissions`

**Response:**
```json
{
  "data": [
    {
      "permissao": "VER_TRANSACOES",
      "perfil": "ADMIN"
    },
    {
      "permissao": "ESTORNAR_TRANSACOES",
      "perfil": "ADMIN"
    },
    {
      "permissao": "GERENCIAR_USUARIOS",
      "perfil": "ADMIN"
    },
    {
      "permissao": "GERENCIAR_EMPRESAS",
      "perfil": "ADMIN"
    }
  ]
}
```

---

## 🔍 Consulta de Fluxo (`consultaFluxoService`)

### 1. Consultar Fluxo do Usuário

**Endpoint:** `GET /consultaFluxo?cpf=<cpf>&SLUG=<slug>`

**Página:** `MeiosDePagamentoScreen`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "data": {
    "cpf": "12345678900",
    "slug": "identificacao-123",
    "etapa_atual": "MEIOS_PAGAMENTO",
    "historico": [
      {
        "etapa": "CPF",
        "timestamp": "2024-01-15T10:25:00Z",
        "sucesso": true
      },
      {
        "etapa": "TELEFONE",
        "timestamp": "2024-01-15T10:26:00Z",
        "sucesso": true
      },
      {
        "etapa": "FUNDOS",
        "timestamp": "2024-01-15T10:27:00Z",
        "sucesso": true
      }
    ]
  }
}
```

---

### 2. Consultar Detalhe do Fluxo (Request/Response)

**Endpoint:** `GET /consultaFluxoDetalhe?SLUG=<slug>`

**Componente:** `TechnicalFooter`

**Headers Adicionais:**
```json
{
  "id_usuario": "uuid-do-usuario"
}
```

**Response:**
```json
{
  "data": {
    "slug": "identificacao-123",
    "servico": "RLIFUND",
    "request": {
      "comando": "RLIFUND",
      "slug": "identificacao-123",
      "cpf": "12345678900",
      "transaction_id": "TXN-123456789",
      "transaction_amount": 150.50
    },
    "response": {
      "success": true,
      "data": [
        {
          "SLUG": "identificacao-123",
          "messageId": 1000,
          "message": {
            "content": "Fundos disponíveis"
          },
          "fundos_disponiveis": true,
          "valor_disponivel": 200.00
        }
      ]
    },
    "timestamp": "2024-01-15T10:27:00Z"
  }
}
```

---

## 📦 Produtos (`produtoService`)

### 1. Buscar Produtos Fake

**Endpoint:** `GET /produtosFakes`

**Página:** `ScanScreen`

**Response:**
```json
{
  "items": [
    {
      "ean": "7891234567890",
      "sku": "SKU-001",
      "unit_price": 15.90,
      "discount": 0,
      "quantity": 1,
      "name": "Produto Exemplo 1",
      "unit_type": "UN",
      "brand": "Marca A",
      "manufacturer": "Fabricante X",
      "categories": ["Alimentos", "Bebidas"],
      "gross_profit_amount": 3.50,
      "is_private_label": false,
      "is_on_sale": true,
      "image": "https://exemplo.com/imagem1.jpg"
    },
    {
      "ean": "7891234567891",
      "sku": "SKU-002",
      "unit_price": 25.50,
      "discount": 2.50,
      "quantity": 1,
      "name": "Produto Exemplo 2",
      "unit_type": "UN",
      "brand": "Marca B",
      "manufacturer": "Fabricante Y",
      "categories": ["Limpeza"],
      "gross_profit_amount": 5.00,
      "is_private_label": true,
      "is_on_sale": false,
      "image": "https://exemplo.com/imagem2.jpg"
    }
  ]
}
```

---

## 🌐 APIs Externas

### Brasil API - Consultar CNPJ

**Endpoint:** `GET https://brasilapi.com.br/api/cnpj/v1/<cnpj>`

**Página:** `LoginScreen` (Modal de solicitação de acesso)

**Sem autenticação necessária**

**Response:**
```json
{
  "cnpj": "12345678000190",
  "identificador_matriz_filial": 1,
  "descricao_matriz_filial": "Matriz",
  "razao_social": "EMPRESA EXEMPLO LTDA",
  "nome_fantasia": "Empresa Exemplo",
  "situacao_cadastral": "02",
  "descricao_situacao_cadastral": "Ativa",
  "data_situacao_cadastral": "2020-01-01",
  "motivo_situacao_cadastral": 0,
  "nome_cidade_exterior": "",
  "codigo_natureza_juridica": 2062,
  "data_inicio_atividade": "2020-01-01",
  "cnae_fiscal": 4711302,
  "cnae_fiscal_descricao": "Comércio varejista de mercadorias em geral",
  "descricao_tipo_logradouro": "Rua",
  "logradouro": "Exemplo",
  "numero": "123",
  "complemento": "Sala 1",
  "bairro": "Centro",
  "cep": "01234567",
  "uf": "SP",
  "codigo_municipio": 3550308,
  "municipio": "São Paulo",
  "ddd_telefone_1": "1133334444",
  "ddd_telefone_2": "",
  "ddd_fax": "",
  "qualificacao_do_responsavel": 50,
  "capital_social": 100000,
  "porte": "03",
  "descricao_porte": "Empresa de Pequeno Porte",
  "opcao_pelo_simples": true,
  "data_opcao_pelo_simples": "2020-01-01",
  "data_exclusao_do_simples": "",
  "opcao_pelo_mei": false,
  "situacao_especial": "",
  "data_situacao_especial": "",
  "faturamento_presumido": 0,
  "entrar_em_contato": "",
  "email": "contato@exemplo.com"
}
```

---

## 📝 Códigos de Mensagem (messageId)

### Sucesso
- **105**: CPF identificado com sucesso (RLIINFO)
- **200**: Cadastro em andamento, mensagem enviada ao telefone (RLICELL)
- **302**: Aguardando autenticação no PDV (RLIDEAL)
- **400**: Aguardando pagamento no APP (RLIWAIT)
- **500**: Desistência da compra recebida com sucesso (RLIQUIT)
- **600**: Pontos acumulados com sucesso na transação (RLIPAYS)
- **801**: Estorno realizado com sucesso (RLIUNDO)
- **906**: Opções de pagamento disponíveis apresentadas (RLIFUND)
- **1000**: Operação realizada com sucesso (genérico)

### Erros Recuperáveis (permite nova tentativa)
- **1001**: Token inválido - usuário pode tentar novamente na mesma tela
- **2001**: CPF não encontrado
- **2002**: Telefone não corresponde ao cadastrado

### Erros Fatais (não permite nova tentativa)
- **1002**: Limite de tentativas excedido - redireciona para próxima etapa
- **3001**: Pagamento negado - fundos insuficientes
- **3002**: Pagamento cancelado pelo usuário

---

## 🔄 Padrões de Retry

### Configuração de Retry
Implementado em `src/utils/retryUtils.ts`:

```typescript
{
  maxAttempts: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  exponentialBackoff: true
}
```

### Endpoints com Retry Automático
- Todos os comandos do fluxo PDV (`comandoService`)
- Buscar transações (`transacaoService`)
- Buscar produtos fake (`produtoService`)

---

## 🔐 Segurança e Headers

### Headers Obrigatórios em Todas as Requisições
```json
{
  "Content-Type": "application/json",
  "x-api-key": "0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975"
}
```

### Headers Adicionais (quando aplicável)
```json
{
  "id_usuario": "uuid-do-usuario-logado",
  "id_usuario_consulta": "uuid-do-usuario-sendo-consultado"
}
```

---

## 📊 Exportação de Dados

### Export Service
Implementado em `src/services/exportService.ts` para exportação local de dados em formato CSV.

**Não há endpoint de API** - a exportação é realizada client-side usando os dados já carregados na aplicação.

---

## 🛠️ Utilitários de Validação

Implementados em `src/schemas/validationSchemas.ts` usando Zod:

- **CPF**: `cpfSchema` - valida formato e dígitos verificadores
- **Telefone**: `telefoneSchema` - valida formato com DDD
- **Email**: `emailSchema` - validação padrão de email
- **CNPJ**: `cnpjSchema` - valida formato e dígitos verificadores
- **Token**: `tokenSchema` - valida 6 dígitos numéricos
- **Data de Nascimento**: `birthDateSchema` - valida formato e idade mínima
- **EAN**: `eanSchema` - valida código de barras
- **Valor**: `paymentAmountSchema` - valida valores monetários

---

## 📖 Documentação Adicional

- **[Guia de Arquitetura](ARCHITECTURE.md)** - Estrutura geral do projeto
- **[Guia de Testes](TESTING_GUIDE.md)** - Testes unitários e E2E
- **[Guia de Retry](RETRY_GUIDE.md)** - Lógica de retry e tratamento de erros
- **[Guia de Validação](VALIDATION_GUIDE.md)** - Schemas de validação Zod
- **[E2E Tests](../e2e/README.md)** - Testes end-to-end com Playwright

---

## 🎯 Postman/Insomnia Collection

Para importar essa documentação no Postman ou Insomnia:

1. Crie uma nova collection chamada "Simulador PDV API"
2. Configure as variáveis de ambiente:
   - `base_url`: `https://umbrelosn8n.plsm.com.br/webhook/simuladorPDV`
   - `api_key`: `0e890cb2ed05ed903e718ee9017fc4e88f9e0f4a8607459448e97c9f2539b975`
   - `id_usuario`: (será preenchido após login)
3. Configure os headers globais:
   - `Content-Type`: `application/json`
   - `x-api-key`: `{{api_key}}`
4. Para endpoints autenticados, adicione o header:
   - `id_usuario`: `{{id_usuario}}`

---

**Última atualização:** 2025-11-26
