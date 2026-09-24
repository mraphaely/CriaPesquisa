# Indicadores do Cartão CRIA — desenho

Data: 2026-09-24
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

**As classificações obrigam cálculo por indivíduo.** "Percentual de crianças com IDTC
entre 0% e 25%" só faz sentido se o IDTC existir criança por criança. Portanto VCRAS,
CVAC e CPUER são 0 ou 100 por beneficiário, o MCC sai por criança, e o valor populacional
é a média disso. (A confirmar.)

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

`VARIACAO` (diferença entre o par ANTES/APÓS) fica fora até a pendência D-15 ser
respondida. Não construímos tipo baseado em suposição.

## Modelo de dados

```
Indicador
  codigo, nome, objetivo, tipo, unidade, casasDecimais
  pesquisaId        nulo quando cruza pesquisas (MCB)
  config: jsonb     validado por Zod conforme o tipo
  meta              nulo — nenhuma das 110 linhas tem meta preenchida
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

## Motor

```
carrega respostas APROVADAS (com filtros de município, regional e período)
        |
por resposta: avalia os indicadores na ordem de dependência
        |
agrega conforme a regra de cada tipo
        |
classifica em faixas
        |
cache
```

Os filtros reaproveitam `extrairFiltrosBase`, já usado por resumo e exportação — então o
painel filtra com o mesmo significado das outras telas.

**Dependência incompleta propaga.** Se o MCC está sem definição, o IDTC e suas quatro
classificações exibem "não calculável — depende de MCC", com link para o indicador que
trava a cadeia. Nunca zero, nunca resultado parcial: número plausível e errado num painel
de política pública é pior que lacuna assumida.

**Denominador zero** devolve "sem dados suficientes". **Pergunta em branco** sai do
numerador e do denominador — este é o padrão adotado, configurável por indicador, e
segue valendo até a pendência sobre denominador ser respondida.

## Importação

O importador lê a planilha, casa por texto e **sugere** tipo e parâmetros. Nada entra como
`ATIVO` sozinho: tudo nasce `DEFINICAO_INCOMPLETA` com a sugestão preenchida, e uma tela
de revisão mostra o texto da planilha ao lado da pergunta candidata para confirmação.

Situação medida sobre as 110 linhas do Cartão CRIA:

| Situação | Quantidade |
|---|---|
| Casamento único e confiante | 60 |
| Ambíguo (quase todos pares ANTES/APÓS) | 22 |
| Sem candidata boa | 11 |
| Sem descrição para casar | 17 |

Os 22 ambíguos são, quase todos, a mesma decisão — qual lado do par ANTES/APÓS o
indicador mede. Uma resposta resolve o conjunto.

## Painel

Agrupado pela coluna `Apresentação` da planilha (Escopo, Perfil). Gráfico escolhido pelo
tipo: distribuição em barra ou rosca (reaproveitando `DonutInterativo` e `ChartCard`),
proporção e composto como valor com meta quando houver, classificação como barra
empilhada das quatro faixas.

## Testes

**Teste dourado.** Amostra sintética de ~6 crianças com respostas escolhidas à mão, com
MCC, IDTC e as quatro classificações calculados no papel; o motor tem de chegar nesses
números. É o que pega erro de precedência, de escala e de ordem de agregação.

**Por tipo**, com uma resposta fabricada cada, no formato `f(resposta)`.

**De borda**: denominador zero, pergunta em branco, referência circular recusada ao
salvar, propagação de dependência incompleta.

**Aceitação**: se a equipe tiver um indicador já calculado à mão, comparar contra ele.

## Premissas adotadas (a confirmar)

1. `MCC = [(VCRAS×3) + (CVAC×5) + (CPUER×5)] ÷ 13` — o 13 divide a soma inteira, não só
   o último termo
2. Todos os termos em escala 0–100
3. `Segurança Alimentar = 100 − TRIA Risco` (a própria planilha define isso na linha do
   TRIA)
4. IDTC e IDMCC são o mesmo índice com dois nomes

## Pendências que bloqueiam indicadores específicos

Sem resposta, estes ficam `DEFINICAO_INCOMPLETA`:

- Qual resposta conta como "SIM" no TRIA (as opções são Sempre/Quase sempre/Raramente/Nunca)
- Pontos de corte do TRIA e da escala de insegurança alimentar (Grave/Média/Leve)
- Percentil de referência para desnutrição e obesidade (curvas da OMS por idade e sexo,
  ou percentil da própria amostra)
- IMC da gestante: peso atual ou anterior à gravidez; faixa comum ou tabela por semana
  gestacional
- Definição de Índice de Atenção à Saúde da Criança, Índice Socioeconômico Familiar,
  % Internação hospitalar, % Famílias com gestante, Escala de insegurança alimentar
- ANTES/APÓS: qual lado o indicador mede, ou se o que interessa é a variação
- Denominador: todas as respostas, só as aprovadas, ou só quem respondeu a pergunta
- Metas: se haverá, e em que granularidade

## Ordem de construção

O escopo é grande demais para uma entrega só. Ordem proposta, cada fase entregando algo
verificável sozinho:

1. **Modelo e cadastro** — tabelas, validação por tipo, CRUD com auditoria, detecção de
   ciclo. Sem cálculo ainda.
2. **Motor** — `f(resposta)` por tipo, ordem de dependência, agregação, propagação de
   incompleto. É aqui que entra o teste dourado.
3. **Importação** — casamento por texto e tela de revisão dos 110.
4. **Painel** — gráficos por tipo e filtros.

As fases 1 e 2 entregam valor mesmo sem as 3 e 4: dá para cadastrar um indicador à mão e
ver o número pela API.

## Limites conhecidos

- Cache em memória. O `docker-compose.prod.yml` sobe uma réplica da API; com mais de uma,
  cada uma teria seu cache e os números poderiam divergir por alguns segundos.
- Escopo inicial: Cartão CRIA (110 indicadores). Os outros seis projetos da planilha
  (UEPNAR, DeciDIU, AIDPI Neonatal, Creche CRIA, Fluxograma de violência) não têm
  pesquisa no sistema.
- Nenhuma das 110 linhas tem `Meta` preenchida; o painel mostra valor sem referência de
  alvo até que metas existam.
