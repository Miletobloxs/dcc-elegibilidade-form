---
description: Bot 2 - Extração de Feedbacks (Protocolo Multi-fator)
---

Este workflow descreve a extração segura de feedbacks pedagógicos, utilizando o protocolo de segurança "Somatório Multi-fator" validado no Piloto #2.

### Protocolo de Segurança (MANDATÓRIO)
O robô **NÃO** deve clicar em nenhum card que não atenda simultaneamente aos 3 critérios:
1. **Cor Azul**: O card deve estar submetido (não preto/pendente).
2. **Ícone Verde**: Deve haver um ícone de feedback presente.
3. **Nome da Atividade**: O texto deve seguir o padrão `Atividade X`.

### Passos de Execução
1. **Entrada no Projeto**: Acessar a Capa (Overview) do projeto alvo via URL ou clique no dashboard.
2. **Ciclo de Atividades**: Para cada atividade alvo (1 a 4):
   - **Verificação Visual**: Aplicar a regra do Somatório Multi-fator no card da atividade.
   - **Navegação**: Clicar no card validado para abrir a página da atividade.
   - **Modo de Visualização**: Forçar o clique em "Modo de visualização" (botão lupa/olho) para garantir que o painel de feedback esteja disponível.
3. **Abertura do Feedback**:
   - Tentar localizar e clicar no botão de "Feedback" ou "Comentários" na UI.
   - Validar abertura do modal (Header: `Feedback - Atividade X`).
4. **Extração**:
   - Coletar todos os cards de feedback (`.ds-user-feedback-card`).
   - Fallback: Extrair texto de textareas ou divs de comentário caso o sistema use o formato consolidado.
5. **Retorno Seguro**:
   - Fechar o modal via botão de fechar.
   - Navegar de volta para a Capa (`/overview`) para garantir um estado limpo para a próxima atividade.
6. **Persistência**:
   - Salvar os feedbacks em `feedbacks_v3.json` dentro da pasta do projeto.

// turbo
7. **Comando de Execução**:
`node bot_2_feedbacks_v3.js`
