# Indicadores do Cartão CRIA — desenho

Data: 2026-09-24 — revisto em 2026-09-25 com as respostas do Emerson
Estado: aguardando revisão

## O problema

Hoje os indicadores do programa vivem numa planilha do Google Sheets com 290 linhas, 110
delas do Cartão CRIA (56 Criança, 54 Gestante). A planilha descreve cada indicador em
português — `(Raça X / Total) × 100`, `(< ensino médio completo / Total) × 100` — e
alguém calcula o número à mão, fora do sistema.

Queremos que o CriaPesquisa cadastre indicadores ligados às perguntas de verdade,
calcule sozinho a partir das respostas coletadas e exiba em painel.

## Decisões tomadas

| Decisão | Escolha | Por quê |
|---|---|---|
| Fonte da verdade | O sistema. A planilha é importada uma vez e vira registro histórico | Só assim dá para validar, no cadastro, que o indicador aponta para pergunta e opção existentes |
| Como a conta é especificada | Catálogo fechado de tipos, com parâmetros | Cobre os padrões observados e não deixa escrever fórmula que não roda |
| Onde a configuração mora | JSON validado por Zod, por tipo | Mesmo mecanismo do resto do sistema; tipo novo não exige migration |
| Quando calcula | Sob demanda, com cache invalidado por evento | Número sempre coerente com o dado atual, sem job para operar |

## O que os dados obrigaram

**Uma pergunta tem vários indicadores.** `% Baixo peso ao nascer` e `% Peso adequado ao
nascer` saem da mesma pergunta; `% Sem pré-natal`, `% Início precoce` e `% Pré-natal
tardio` saem de outra. Logo, indicador é entidade própria — não um campo da pergunta.

**A numeração da planilha não serve para ligar.** O `Nº Pergunta` foi escrito contra uma
versão anterior do questionário. Conferindo por texto, só 21 das 78 linhas numeradas
apontam para a pergunta certa; o desvio cresce ao longo do formulário e chega a +8. O
vínculo é feito por casamento de texto sobre a coluna `Pergunta (Descrição)`, com revisão
humana.

**O cálculo é por indivíduo, depois agregado.** Confirmado: "gerado por usuário e depois
vira média geral". É o que as classificações exigiam — "percentual de crianças com IDTC
entre 0% e 25%" só faz sentido se o IDTC existir criança por criança.

## Catálogo de tipos

| Tipo | f(resposta) | Agregação | Exemplo real |
|---|---|---|---|
| `PROPORCAO` | 1 se a opção está no numerador, senão 0 | média × 100 | % Famílias em zona rural |
| `CRUZAMENTO` | 1 se as condições valem, senão 0 | média × 100 | TRIA; gestante adolescente sem fundamental |
| `MEDIA` | valor numérico | média | Idade média |
| `DERIVADA` | expressão por resposta | média | IMC = peso ÷ altura² |
| `COMPOSTO` | soma dos (peso × f da dependência) ÷ divisor | média | MCC, MCG, IDTC, MCB |
| `CLASSIFICACAO` | faixa em que caiu | % por faixa | IDTC Crítico/Baixo/Moderado/Alto |
| `CONTAGEM` | — | contagem | Total de famílias entrevistadas |
| `DISTRIBUICAO` | — | % por opção | % por raça |

Não existe tipo `VARIACAO`. A resposta ao par ANTES/APÓS eliminou a necessidade — ver a
seção seguinte.

## Recorte ANTES/APÓS

O questionário tem 14 pares de perguntas idênticas com sufixo `— ANTES do Cartão CRIA` e
`— APÓS o Cartão CRIA`. Eram a maior fonte de ambiguidade na importação: 22 linhas da
planilha casavam com os dois lados e não havia como escolher.

A regra decidida: **o indicador não escolhe um lado nem calcula a diferença. Ele produz
dois valores, antes e depois, exibidos lado a lado para comparação.**

Isso é um recorte, não um tipo. Qualquer tipo do catálogo pode ser pareado: o motor avalia
o mesmo `f(resposta)` sobre a pergunta ANTES e sobre a pergunta APÓS e devolve os dois
números. O catálogo fica intacto, e as 22 ambiguidades deixam de ser decisão — viram
estrutura.

## Modelo de dados

```
Indicador
  codigo, nome, objetivo, tipo, unidade, casasDecimais
  pesquisaId        nulo quando cruza pesquisas (MCB)
  config: jsonb     validado por Zod conforme o tipo
  recorte           nulo, ou ANTES_APOS com o par de perguntas
  meta              nulo — nenhuma das 110 linhas tem meta; serão definidas depois
  formulaOriginal   texto da planilha, mantido como referência
  status            ATIVO | DEFINICAO_INCOMPLETA | INATIVO
  origemPlanilha    linha de origem, para rastrear
  + soft-delete e auditoria, como o resto do sistema

IndicadorDependencia (indicadorId, dependeDeId)
```

`IndicadorDependencia` é tabela relacional mesmo com a config em JSON: é onde integridade
se paga. Detecta referência circular ao salvar e responde "o que para de funcionar se eu
apagar o MCC" antes de alguém apagar.

`DEFINICAO_INCOMPLETA` é como as pendências ficam visíveis em vez de esquecidas: o
indicador entra com nome, objetivo e fórmula original, aparece marcado na tela, e não
produz número nenhum até a regra ser fechada.

## Definições confirmadas

**MCC é média ponderada.** `[(VCRAS×3) + (CVAC×5) + (CPUER×5)] ÷ 13` — o 13 divide a soma
inteira. Os pesos somam 13, então o resultado fica na mesma escala dos termos.

**Todos os termos em 0–100**, inclusive MCC e Segurança Alimentar dentro do IDTC.

**A Segurança Alimentar do IDTC é a do TRIA** (`100 − TRIA Risco`), não o índice de
3 refeições.

**MCB é ponderado pelo número de beneficiários** de cada pesquisa:
`(MCC × n_crianças + MCG × n_gestantes) ÷ (n_crianças + n_gestantes)`.

**Denominador = total de respostas àquela pergunta.** Branco sai do numerador e do
denominador.

**Filtros do painel:** Regional, Município, Sexo e Período.

**Removidos por não terem pergunta:** `% Internação hospitalar` e `% Famílias com
gestante`. Conferido no questionário — não existe pergunta correspondente a nenhum dos
dois.

**`% Obesidade Infantil` deriva do IMC da criança**, não é indicador independente.

**Perguntas de origem dos termos do MCC**, localizadas no questionário:

| Termo | Pergunta | Tipo |
|---|---|---|
| VCRAS | "A criança e a família participam de atividades propostas pelo CRAS?" | Sim/Não, com par ANTES/APÓS |
| CVAC | "Carteira de vacinação da criança atualizada" | Sim/Não/Não soube informar, com par ANTES/APÓS |
| CPUER | "Número de consultas de puericultura no último ano" | número |
| CPRE | — sem pergunta de contagem no questionário | — |

## Motor

```
carrega respostas APROVADAS (com filtros de regional, município, sexo e período)
        |
por resposta: avalia os indicadores na ordem de dependência
        |
agrega conforme a regra de cada tipo
        |
classifica em faixas
        |
cache
```

Regional, município e período já existem em `extrairFiltrosBase`, usado por resumo e
exportação. **Sexo é diferente em natureza**: os outros três são campos da resposta, e
sexo é a *resposta a uma pergunta* ("Sexo biológico da criança"). Filtrar por ele exige
consultar os itens da resposta, não a resposta. Na pesquisa Gestante o filtro é quase
constante e não separa nada — ele serve à pesquisa Criança.

**Dependência incompleta propaga.** Se o MCC está sem definição, o IDTC e suas quatro
classificações exibem "não calculável — depende de MCC", com link para o indicador que
trava a cadeia. Nunca zero, nunca resultado parcial: número plausível e errado num painel
de política pública é pior que lacuna assumida.

**Denominador zero** devolve "sem dados suficientes".

## Importação

O importador lê a planilha, casa por texto e **sugere** tipo e parâmetros. Nada entra como
`ATIVO` sozinho: tudo nasce `DEFINICAO_INCOMPLETA` com a sugestão preenchida, e uma tela
de revisão mostra o texto da planilha ao lado da pergunta candidata para confirmação.

Situação medida sobre as 110 linhas do Cartão CRIA:

| Situação | Quantidade | Depois das respostas |
|---|---|---|
| Casamento único e confiante | 60 | 60 |
| Ambíguo (pares ANTES/APÓS) | 22 | resolvidos: viram indicador pareado |
| Sem candidata boa | 11 | 9 (dois removidos por não existir pergunta) |
| Sem descrição para casar | 17 | 17 |

## Painel

Agrupado pela coluna `Apresentação` da planilha (Escopo, Perfil). Gráfico escolhido pelo
tipo: distribuição em barra ou rosca (reaproveitando `DonutInterativo` e `ChartCard`),
proporção e composto como valor com meta quando houver, classificação como barra
empilhada das quatro faixas. Indicador pareado exibe os dois valores lado a lado.

## Testes

**Teste dourado.** Amostra sintética de ~6 crianças com respostas escolhidas à mão, com
MCC, IDTC e as quatro classificações calculados no papel; o motor tem de chegar nesses
números. É o que pega erro de precedência, de escala e de ordem de agregação.

**Por tipo**, com uma resposta fabricada cada, no formato `f(resposta)`.

**De borda**: denominador zero, pergunta em branco, referência circular recusada ao
salvar, propagação de dependência incompleta, indicador pareado com um dos lados vazio.

**Aceitação**: se a equipe tiver um indicador já calculado à mão, comparar contra ele.

## Pendências

Enquanto não respondidas, os indicadores afetados ficam `DEFINICAO_INCOMPLETA`.

**Sem resposta:**

- Pontos de corte do TRIA entre "sem risco", "risco leve" e "risco moderado/alto". O
  espaço é pequeno: são duas perguntas Sim/Não, logo só há três estados possíveis
  (nenhum, um ou dois "sim").
- Escala de insegurança alimentar (Grave/Média/Leve) — se é EBIA, qual versão.
- Índice de Atenção à Saúde da Criança: as três perguntas existem (vacinação,
  puericultura, suplementação de ferro e vitamina A). Falta a regra de combinação.
- Índice Socioeconômico Familiar: renda, escolaridade e moradia existem nas duas
  pesquisas. Falta saber se a padronização é z-score ou min-max.
- Percentil de referência para desnutrição e obesidade: curvas da OMS por idade e sexo,
  ou percentil da própria amostra. Resultados muito diferentes.
- IDTC e IDMCC são o mesmo índice com dois nomes? A resposta recebida não resolveu.
- Escopo: só Cartão CRIA, ou os outros seis projetos da planilha.
- Quem cadastra e edita indicador. O sistema não tem papel "PO" — os papéis são ADMIN,
  GESTOR, COLETADOR e VISUALIZADOR.

**Levantadas pelas próprias respostas:**

- CPUER precisa entrar em 0–100, mas a pergunta é uma contagem de consultas. Qual número
  vale 100?
- CPRE não tem pergunta de contagem. A única sobre pré-natal é "Quando iniciou o
  pré-natal?" (antes de 12 semanas / após 12 semanas / não soube / sem pré-natal).
- "Não soube informar" na vacinação: fica fora do denominador, ou conta como "não"? Muda
  o percentual.
- Suplementação tem opção "Não se aplica" por faixa etária. Criança fora da faixa não
  pode ser penalizada no índice.
- IMC da gestante: a resposta fala em "um IMC durante e um após a gestação", mas o
  questionário tem peso *antes de engravidar*, peso *atual* e altura atual. Não há peso
  pós-parto. O par que os dados permitem é pré-gestacional e atual — confirmar se é isso.
- Metas: confirmado que serão definidas, mas ainda não existem. Painel mostra valor sem
  alvo até lá.

## Ordem de construção

O escopo é grande demais para uma entrega só. Ordem proposta, cada fase entregando algo
verificável sozinho:

1. **Modelo e cadastro** — tabelas, validação por tipo, CRUD com auditoria, detecção de
   ciclo. Sem cálculo ainda.
2. **Motor** — `f(resposta)` por tipo, recorte ANTES/APÓS, ordem de dependência,
   agregação, propagação de incompleto. É aqui que entra o teste dourado.
3. **Importação** — casamento por texto e tela de revisão dos 108.
4. **Painel** — gráficos por tipo e filtros.

As fases 1 e 2 entregam valor mesmo sem as 3 e 4: dá para cadastrar um indicador à mão e
ver o número pela API.

## Limites conhecidos

- Cache em memória. O `docker-compose.prod.yml` sobe uma réplica da API; com mais de uma,
  cada uma teria seu cache e os números poderiam divergir por alguns segundos.
- Escopo inicial: Cartão CRIA (108 indicadores, após a remoção de dois). Os outros seis
  projetos da planilha (UEPNAR, DeciDIU, AIDPI Neonatal, Creche CRIA, Fluxograma de
  violência) não têm pesquisa no sistema.
- O filtro por sexo depende de uma pergunta, não de um campo da resposta — é mais caro de
  consultar que os outros três e não se aplica à pesquisa Gestante.
