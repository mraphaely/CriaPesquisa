# Indicadores do Cartão CRIA — o que falta definir

Cada item tem alternativas; dá para responder só com a letra. Onde está **(sugestão)**, é o
que adotaríamos se você concordar — "confirmo" basta.

Referência: `docs/superpowers/specs/2026-09-24-indicadores-design.md`.

## Segurança alimentar

**1. Faixas do TRIA.** São duas perguntas Sim/Não, então só existem três resultados:
nenhum "sim", um "sim", dois "sim".

- a) 0 = sem risco · 1 = risco leve · 2 = risco moderado/alto — **(sugestão)**
- b) 0 = sem risco · 1 ou 2 = com risco, sem separar leve de moderado
- c) outra: \_\_\_

**2. O que conta como "TRIA Risco" na conta `Segurança Alimentar = 100 − TRIA Risco`.**

- a) risco leve + risco moderado/alto — **(sugestão)**
- b) só moderado/alto

**3. Escala de insegurança alimentar (Grave / Média / Leve).** Nenhuma pergunta atual
produz esses três níveis.

- a) derivar das duas perguntas do TRIA: 2 "sim" = Grave · 1 = Média · 0 = sem insegurança — **(sugestão)**
- b) incluir a EBIA de 14 itens no questionário
- c) incluir a EBIA reduzida (8 itens)
- d) remover o indicador

## Termos do MCC e do MCG

**4. CPUER.** A pergunta é "Número de consultas de puericultura no último ano" — uma
contagem. Para entrar no MCC precisa virar 0–100. Quantas consultas valem 100?

- a) o preconizado pelo Ministério da Saúde para a idade, proporcional, com teto em 100 — **(sugestão)**
- b) um número fixo para todos — qual? \_\_\_
- c) binário: a partir de N consultas = 100, abaixo disso = 0 — qual N? \_\_\_

**5. CPRE.** Não existe pergunta sobre número de consultas de pré-natal. A única é
"Quando iniciou o pré-natal?" (antes de 12 semanas / após 12 semanas / não soube / sem
pré-natal).

- a) derivar dela: antes de 12 semanas = 100 · após = 50 · sem pré-natal = 0 · não soube = fora do cálculo — **(sugestão)**
- b) incluir uma pergunta nova de número de consultas
- c) remover CPRE do índice

**6. "Não soube informar" na vacinação.**

- a) sai do cálculo, como resposta em branco — **(sugestão)**
- b) conta como "não atualizada"

## Índices sem regra fechada

**7. Índice de Atenção à Saúde da Criança.** As três perguntas existem: vacinação,
consultas de puericultura e suplementação (ferro e vitamina A).

- a) média simples dos três, cada um em 0–100 — **(sugestão)**
- b) média ponderada — quais pesos? \_\_\_

**8. Suplementação tem a opção "Não se aplica" por faixa etária.** Criança fora da faixa:

- a) sai do índice, sem ser penalizada — **(sugestão)**
- b) conta como se tivesse recebido
- c) conta como não recebido

**9. Índice Socioeconômico Familiar.** Renda, escolaridade e moradia existem nas duas
pesquisas. Escolaridade e moradia entrariam como nota pela ordem das opções, da menor
para a maior. Como padronizar os três?

- a) min-max: o menor valor da amostra vira 0, o maior vira 100 — **(sugestão)**
- b) z-score
- c) outra: \_\_\_

**10. Desnutrição (IMC < P10) e obesidade (IMC > P85).** Percentil de qual referência?

- a) curvas da OMS por idade e sexo — **(sugestão)**
- b) percentil da própria amostra

**11. IMC da gestante.** O questionário tem peso antes de engravidar, peso atual e altura.
Não há peso pós-parto.

Quais IMCs calcular:

- a) dois — pré-gestacional e atual — **(sugestão)**
- b) só o atual

Como classificar:

- c) faixas comuns de IMC
- d) tabela de Atalah, por semana gestacional — **(sugestão)**

**12. IDTC e IDMCC** aparecem na planilha com a mesma fórmula e nomes diferentes
("Tridimensional" e "Multidimensional").

- a) é o mesmo índice — manter um nome só — **(sugestão)**
- b) são diferentes — qual a fórmula de cada? \_\_\_

## Escopo

**13. Construir para quais projetos?**

- a) só Cartão CRIA — 108 indicadores — **(sugestão)**
- b) os 8 projetos da planilha — 290 indicadores
- c) Cartão CRIA agora, os outros numa segunda etapa
