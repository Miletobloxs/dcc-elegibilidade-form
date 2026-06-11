---
description: Prepare a comprehensive session handover for the next agent or session.
---

# /session-handover - Passagem de Bastão 🤝

Use este comando para encerrar a sessão atual e preparar a próxima com clareza.

## Objetivos
- Resumir o que foi feito.
- Listar tarefas bloqueadas ou pendentes.
- Atualizar o contexto para o próximo agente.

## Passos

1. **Atualizar task.md**:
   Certifique-se de que o [task.md](file:///Users/carloscarneiro/.gemini/antigravity/brain/6e23ba51-9d40-4ca3-b1d3-5fa24ff5900e/task.md) reflete a realidade atual.

2. **Gerar Relatório de Handover**:
   Crie um arquivo chamado `HANDOVER.md` na raiz ou exiba um resumo contendo:
   - **Status Geral**: (Ex: Funcionalidades X e Y concluídas)
   - **Próximos Passos Imediatos**: O que deve ser feito assim que a próxima sessão começar.
   - **Bloqueios/Atenção**: Pontos críticos ou bugs conhecidos.

3. **Checkpoint Final**:
   Recomenda-se rodar o `/checkpoint` para garantir que o estado do handover está no repositório.

4. **Mensagem de Encerramento**:
   Sintetize o progresso feito e despeça-se, deixando o "gancho" para o próximo passo.

---

> [!IMPORTANT]
> Um bom handover economiza tempo de pesquisa e evita retrabalho. Seja específico sobre onde parou.
