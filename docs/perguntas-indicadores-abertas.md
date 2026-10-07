# Indicadores do Cartão CRIA — o que falta definir

Cada item tem alternativas; dá para responder só com a letra. Onde está **(sugestão)**, é o
que adotaríamos se você concordar — "confirmo" basta.

Referência: `docs/superpowers/specs/2026-09-24-indicadores-design.md`.

> **Respondido pelo Emerson em 2026-10-05.** As respostas estão em cada item (linha **R:**).
> Quatro delas abrem pontos novos — ver [Consequências das respostas](#consequências-das-respostas).

## Segurança alimentar

**1. Faixas do TRIA.** São duas perguntas Sim/Não, então só existem três resultados:
nenhum "sim", um "sim", dois "sim".
**R: a.**

- a) 0 = sem risco · 1 = risco leve · 2 = risco moderado/alto — **(sugestão)**
- b) 0 = sem risco · 1 ou 2 = com risco, sem separar leve de moderado
- c) outra: \_\_\_

**2. O que conta como "TRIA Risco" na conta `Segurança Alimentar = 100 − TRIA Risco`.**
**R: a.**

- a) risco leve + risco moderado/alto — **(sugestão)**
- b) só moderado/alto

**3. Escala de insegurança alimentar (Grave / Média / Leve).** Nenhuma pergunta atual
produz esses três níveis.
**R: a.**

- a) derivar das duas perguntas do TRIA: 2 "sim" = Grave · 1 = Média · 0 = sem insegurança — **(sugestão)**
- b) incluir a EBIA de 14 itens no questionário
- c) incluir a EBIA reduzida (8 itens)
- d) remover o indicador

## Termos do MCC e do MCG

**4. CPUER.** A pergunta é "Número de consultas de puericultura no último ano" — uma
contagem. Para entrar no MCC precisa virar 0–100. Quantas consultas valem 100?
**R: a.**

- a) o preconizado pelo Ministério da Saúde para a idade, proporcional, com teto em 100 — **(sugestão)**
- b) um número fixo para todos — qual? \_\_\_
- c) binário: a partir de N consultas = 100, abaixo disso = 0 — qual N? \_\_\_

**5. CPRE.** Não existe pergunta sobre número de consultas de pré-natal. A única é
"Quando iniciou o pré-natal?" (antes de 12 semanas / após 12 semanas / não soube / sem
pré-natal).
**R: a.**

- a) derivar dela: antes de 12 semanas = 100 · após = 50 · sem pré-natal = 0 · não soube = fora do cálculo — **(sugestão)**
- b) incluir uma pergunta nova de número de consultas
- c) remover CPRE do índice

**6. "Não soube informar" na vacinação.**
**R: b.**

- a) sai do cálculo, como resposta em branco — **(sugestão)**
- b) conta como "não atualizada"

## Índices sem regra fechada

**7. Índice de Atenção à Saúde da Criança.** As três perguntas existem: vacinação,
consultas de puericultura e suplementação (ferro e vitamina A).
**R: a.**

- a) média simples dos três, cada um em 0–100 — **(sugestão)**
- b) média ponderada — quais pesos? \_\_\_

**8. Suplementação tem a opção "Não se aplica" por faixa etária.** Criança fora da faixa:
**R: a.**

- a) sai do índice, sem ser penalizada — **(sugestão)**
- b) conta como se tivesse recebido
- c) conta como não recebido

**9. Índice Socioeconômico Familiar.** Renda, escolaridade e moradia existem nas duas
pesquisas. Escolaridade e moradia entrariam como nota pela ordem das opções, da menor
para a maior. Como padronizar os três?
**R: b.**

- a) min-max: o menor valor da amostra vira 0, o maior vira 100 — **(sugestão)**
- b) z-score
- c) outra: \_\_\_

**10. Desnutrição (IMC < P10) e obesidade (IMC > P85).** Percentil de qual referência?
**R: b.**

- a) curvas da OMS por idade e sexo — **(sugestão)**
- b) percentil da própria amostra

**11. IMC da gestante.** O questionário tem peso antes de engravidar, peso atual e altura.
Não há peso pós-parto.

Quais IMCs calcular:
**R: a.**

- a) dois — pré-gestacional e atual — **(sugestão)**
- b) só o atual

Como classificar:
**R: d.**

- c) faixas comuns de IMC
- d) tabela de Atalah, por semana gestacional — **(sugestão)**

**12. IDTC e IDMCC** aparecem na planilha com a mesma fórmula e nomes diferentes
("Tridimensional" e "Multidimensional").
**R: a — é o mesmo índice; fica o nome "Tridimensional" (IDTC).**

- a) é o mesmo índice — manter um nome só — **(sugestão)**
- b) são diferentes — qual a fórmula de cada? \_\_\_

## Escopo

**13. Construir para quais projetos?**
**R: c.**

- a) só Cartão CRIA — 108 indicadores — **(sugestão)**
- b) os 8 projetos da planilha — 290 indicadores
- c) Cartão CRIA agora, os outros numa segunda etapa

## Consequências das respostas

Fechadas e prontas para implementar: **1, 2, 3, 6, 7, 8, 12 e 13**. A 6 muda só a regra
("Não soube informar" entra no denominador como "não atualizada"). Na 12, o IDMCC deixa de
existir como indicador separado.

As quatro abaixo precisam de mais uma conversa antes de virar número:

**A. Percentil da própria amostra (resposta 10) produz sempre o mesmo número.** Por
definição, 10% de qualquer amostra fica abaixo do P10 dela, e 15% fica acima do P85. Calculada
sobre a base inteira, a taxa de desnutrição seria sempre ~10% e a de obesidade sempre ~15%,
em qualquer ano e com qualquer política. O número só varia quando se filtra um município ou
regional contra o percentil do estado. Além disso, o IMC de criança muda muito com a idade;
um percentil único mistura bebês e crianças de 5 anos. Recomendação: confirmar com o
Emerson se é isso mesmo, ou voltar às curvas da OMS (opção a).

**B. Z-score (resposta 9) não fica em 0–100, e a média dele é zero.** O z-score mede o
quanto cada família se afasta da média, em desvios-padrão. A média da amostra de referência
é zero por construção. Precisa decidir: (1) qual é a amostra de referência — sugestão: todas
as respostas aprovadas da pesquisa; e (2) como mostrar — sugestão: média do z-score do
recorte filtrado (município, regional) em relação à referência estadual. O índice também
não pode entrar como termo de um composto 0–100 sem uma conversão.

**C. Atalah (resposta 11) precisa da semana gestacional, que o questionário não pergunta.**
A pesquisa Gestante tem altura, peso antes de engravidar e peso atual, mas nenhuma pergunta
de idade gestacional ou data da última menstruação. A única pergunta de tempo é "Quando
iniciou o pré-natal?" (antes ou depois de 12 semanas). Saídas: incluir uma pergunta de semana
gestacional (ou DUM) no questionário, ou classificar o IMC atual pelas faixas comuns até
existir essa pergunta. O IMC pré-gestacional usa as faixas comuns de adulto de qualquer forma.

**D. CPUER pelo calendário do Ministério da Saúde (resposta 4) precisa da tabela de
referência.** A idade da criança sai da "Data de nascimento". Falta fixar quantas consultas
valem 100 para cada idade, nos 12 meses anteriores à entrevista. Sugestão a confirmar:
calendário da Caderneta da Criança — 7 consultas no 1º ano de vida, 2 no 2º ano e 1 por ano
a partir do 3º ano.

Impacto no sistema: as respostas 4, 5, 9 e 10 pedem tipos de cálculo que o catálogo de
hoje não tem — nota por opção de resposta (CPRE com 100/50/0; escolaridade e moradia do
Índice Socioeconômico), meta por idade (CPUER), e padronização que depende da amostra inteira
(z-score e percentil). Entram como extensão do catálogo antes da fase de importação.
