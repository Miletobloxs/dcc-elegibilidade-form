---
description: Perform a git checkpoint (add, commit, push) to save current progress.
---

# /checkpoint - Git Save Point 🚩

Use este comando para salvar o progresso atual no repositório.

## Passos

// turbo
1. **Adicionar mudanças**:
   ```bash
   git add .
   ```

2. **Criar commit**:
   O sistema solicitará uma breve descrição (ou você pode passar como argumento):
   ```bash
   git commit -m "Checkpoint: {desc}"
   ```

// turbo
3. **Enviar para o remoto**:
   ```bash
   git push
   ```

4. **Confirmar status**:
   Verifica se o repositório está limpo.
   ```bash
   git status
   ```

---

> [!TIP]
> Use este comando sempre que concluir uma etapa importante do `task.md` ou antes de realizar mudanças arriscadas.
