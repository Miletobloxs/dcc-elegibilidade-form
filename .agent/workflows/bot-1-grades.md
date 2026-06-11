---
description: Bot 1 - Mapeamento de Notas e Membros (Quick Eval)
---

Este workflow descreve como executar o Bot 1 para extrair notas finais, notas parciais por atividade e a lista de membros da equipe.

### Pré-requisitos
- Chrome aberto em modo debug (`--remote-debugging-port=9222`).
- Sessão do AVA ativa (via portal oficial).

### Passos de Execução
1. **Navegação Inicial**: O robô deve navegar para a URL de `/grading` do subdomínio específico.
2. **Filtragem de Turma**:
   - Abrir o painel de filtros.
   - Selecionar a turma correta (ex: `SPGSA25DESIGN4`).
   - Validar se a lista de projetos foi atualizada.
3. **Localização do Projeto**:
   - Buscar o `TARGET_ID` no atributo `data-project-id` da lista.
   - Realizar scroll até o elemento e clicar para abrir o painel lateral.
4. **Extração de Membros**:
   - Clicar no contador de membros (`#ds-grading-membership-count`).
   - Extrair os nomes do modal, filtrando o título do projeto e labels genéricas.
   - Fechar o modal com `Escape`.
5. **Extração de Notas (MANDATÓRIO)**:
   - **Média Final**: Capturar a nota final exibida no card ou no sumário (Ex: 6.2).
   - **Notas Individuais**: Percorrer todos os cards de atividade (`.ds-criteria-tag`) e mapear o nome exato da atividade para a nota correspondente (Ex: Atividade 1 -> 9.0).
   - Garantir que todas as atividades cadastradas sejam processadas, mesmo que estejam como "Pendente".
6. **Persistência**:
   - Criar a pasta do projeto em `reports/modular_extraction_v10/`.
   - Salvar os dados em `partial_grades.json`.

// turbo
7. **Comando de Execução**:
`node bot_1_grades.js`
