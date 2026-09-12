# CriaPesquisa — Modelo ER (banco de dados)

Diagrama entidade-relacionamento do banco (PostgreSQL via Prisma). Renderiza no
preview de Markdown do VS Code (com extensão Mermaid) e no GitHub.

```mermaid
erDiagram
  USUARIO ||--o{ PESQUISA : "é responsável"
  USUARIO ||--o{ PESQUISA : "criou"
  USUARIO ||--o{ RESPOSTA : "coletou"
  USUARIO |o--o{ RESPOSTA : "revisou"
  USUARIO ||--o{ LOG_ALTERACAO : "gerou"
  USUARIO ||--o{ PESQUISA_VERSAO : "salvou"

  PESQUISA ||--o{ SECAO : "tem"
  PESQUISA ||--o{ PERGUNTA : "tem"
  PESQUISA ||--o{ RESPOSTA : "recebe"
  PESQUISA ||--o{ PESQUISA_VERSAO : "versiona"

  SECAO |o--o{ PERGUNTA : "agrupa"
  PERGUNTA ||--o{ OPCAO_PERGUNTA : "tem"
  PERGUNTA ||--o{ ITEM_RESPOSTA : "é respondida em"
  RESPOSTA ||--o{ ITEM_RESPOSTA : "contém"

  USUARIO {
    uuid id PK
    string nome
    string email UK
    string senhaHash
    enum papel "ADMIN, GESTOR, COLETADOR, VISUALIZADOR"
    boolean ativo
    datetime createdAt
    datetime updatedAt
  }

  PESQUISA {
    uuid id PK
    string titulo
    string descricao "nulo"
    enum status "RASCUNHO, PUBLICADA, ENCERRADA, ARQUIVADA"
    date periodoInicio "nulo"
    date periodoFim "nulo"
    datetime publicadaEm "nulo"
    datetime encerradaEm "nulo"
    int versaoAtual
    uuid responsavelId FK
    uuid createdById FK
    uuid updatedById "nulo"
    datetime deletedAt "soft-delete"
    uuid deletedById "nulo"
    datetime createdAt
    datetime updatedAt
  }

  SECAO {
    uuid id PK
    uuid pesquisaId FK
    string titulo
    string descricao "nulo"
    int ordem
  }

  PERGUNTA {
    uuid id PK
    uuid pesquisaId FK
    uuid secaoId FK "nulo"
    string enunciado
    enum tipo "TEXTO, NUMERO, DATA, ESCOLHA_UNICA, MULTIPLA_ESCOLHA, CAMPO_ABERTO"
    boolean obrigatoria
    int ordem
    string ajuda "nulo"
  }

  OPCAO_PERGUNTA {
    uuid id PK
    uuid perguntaId FK
    string texto
    int ordem
  }

  RESPOSTA {
    uuid id PK
    uuid pesquisaId FK
    uuid coletadorId FK
    string municipio "nulo"
    string unidade "nulo"
    string regional "nulo"
    enum status "PENDENTE, APROVADA, REPROVADA"
    string observacao "nulo"
    uuid revisadoPorId FK "nulo"
    datetime revisadoEm "nulo"
    datetime enviadaEm
    string ip "nulo"
    datetime deletedAt "soft-delete"
    uuid deletedById "nulo"
    datetime createdAt
    datetime updatedAt
  }

  ITEM_RESPOSTA {
    uuid id PK
    uuid respostaId FK
    uuid perguntaId FK
    string valorTexto "nulo"
    float valorNumero "nulo"
    date valorData "nulo"
    array opcoesSelecionadas "textos das opções"
  }

  PESQUISA_VERSAO {
    uuid id PK
    uuid pesquisaId FK
    int versao
    json snapshot
    uuid usuarioId FK
    datetime createdAt
  }

  LOG_ALTERACAO {
    uuid id PK
    string entidade
    string entidadeId
    enum acao "CREATE, UPDATE, DELETE, RESTORE, PUBLICAR, ENCERRAR, ARQUIVAR, APROVAR, REPROVAR"
    uuid usuarioId FK
    json dadosAntes "nulo"
    json dadosDepois "nulo"
    string ip "nulo"
    datetime createdAt
  }

  MUNICIPIO_MENSAL {
    int id PK
    int ano
    int mes
    string mesNome
    string municipio
    string regional
    int totalBeneficiarios
    int criancas
    int gestantes
    float valorTotal
    float rendaMedia
  }

  BENEFICIO_COMPOSICAO {
    int id PK
    int ano
    int mes
    string label
    int quantidade
  }
```

## Como ler as relações

| Relação | Cardinalidade | Significado |
|---|---|---|
| Usuário → Pesquisa (responsável) | 1 : N | cada pesquisa tem **um** responsável (`responsavelId`) |
| Usuário → Pesquisa (criou) | 1 : N | quem cadastrou (`createdById`) |
| Usuário → Resposta (coletou) | 1 : N | quem enviou a resposta (`coletadorId`) |
| Usuário → Resposta (revisou) | 0..1 : N | quem aprovou/reprovou (`revisadoPorId`, opcional) |
| Pesquisa → Seção / Pergunta / Resposta / Versão | 1 : N | uma pesquisa tem várias |
| Seção → Pergunta | 0..1 : N | a pergunta **pode** estar numa seção (`secaoId` opcional) |
| Pergunta → Opção | 1 : N | opções das perguntas de escolha |
| Resposta → Item / Pergunta → Item | 1 : N | cada resposta tem um item por pergunta respondida |

## Notas importantes

- **Soft-delete**: `PESQUISA` e `RESPOSTA` usam `deletedAt` + `deletedById` — os registros não são apagados de fato (proteção contra perda de dados / funcionário desligado).
- **Auditoria**: `LOG_ALTERACAO` guarda toda ação (create/update/delete, publicar, aprovar, reprovar…) com `dadosAntes`/`dadosDepois` em JSON. `entidade`/`entidadeId` referenciam qualquer registro (relação polimórfica, sem FK).
- **Versionamento**: `PESQUISA_VERSAO` guarda um `snapshot` (JSON) da pesquisa por versão; único por (`pesquisaId`, `versao`).
- **`ITEM_RESPOSTA.opcoesSelecionadas`** guarda os **textos** das opções escolhidas (array), e **não** uma FK para `OPCAO_PERGUNTA` — decisão de simplicidade (a resposta preserva o texto mesmo se a opção mudar depois).
- **`MUNICIPIO_MENSAL`** e **`BENEFICIO_COMPOSICAO`** são tabelas **independentes** (sem FK) que alimentam o **Dashboard** (`GET /api/painel`): totais de beneficiários, mapa, top municípios, evolução do investimento e composição do benefício.
- **Índices/únicos** relevantes: `USUARIO.email` (único); `PESQUISA_VERSAO (pesquisaId, versao)` (único); `MUNICIPIO_MENSAL (ano, mes, municipio)` (único).
