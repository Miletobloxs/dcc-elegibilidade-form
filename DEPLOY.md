# Deploy — `dev` para produção (9 commits)

> Checklist operacional. Produção acompanha a branch **`main`** (`origin/main` = `7f38094` = commit que está rodando na VPS hoje).
>
> **Estado:** commits prontos e validados localmente (typecheck limpo, build completo). Falta publicar e deployar.

## O que vai subir

| Commit | O quê | Risco |
|---|---|---|
| `0d0211c` | Checkpoint anterior (já estava em `origin/dev`, produção nunca recebeu) | nenhum — documentação |
| `aba1780` | RLS em `investor_profiles` | nenhum — já aplicado no banco, o commit é só o SQL documentado |
| `7097765` | **Next 16.1.6 → 16.3.1** | o único com risco real. Fecha 28 advisories, incluindo bypass de Middleware/Proxy |
| `22a9ac7` | Mantém `InvestorProfile`/`signupData` no schema | nenhum — só schema, sem `db push` |
| `94f919d` | Reescreve `HANDOVER.md` | nenhum — documentação |
| `c9bdadf` | Prazo real do deal em vez de placeholder | baixo — muda o que aparece nos cards |
| `b0782ee` | ADMIN vê "Novo Deal" no menu | baixo — libera item de menu para ADMIN |
| `a2b8fb7` | Docs da migração de domínio | nenhum — documentação |
| _(runbook)_ | Este arquivo | nenhum — documentação |

⚠️ **Nada de `prisma db push` neste deploy.** O schema já está aplicado no banco. Rodar `db push` é desnecessário e arriscado — o banco é compartilhado com produção.

---

## Fase A — Publicar no GitHub

- [ ] Empurrar a `dev` e a branch congelada (esta última só existe na máquina local hoje):
      ```bash
      git push origin dev
      git push origin feature/buy-side-wip
      git push origin pre-next-upgrade-2026-08-15
      ```
- [ ] Levar para a `main`, que é o que produção acompanha:
      ```bash
      git checkout main
      git pull origin main
      git merge dev            # deve ser fast-forward
      git push origin main
      git checkout dev
      ```
      ✅ Esperado: merge fast-forward, sem conflito. `origin/main` passa a apontar para o mesmo commit da `dev`.

---

## Fase B — Descobrir como a VPS serve o app

> Só necessário na primeira vez. Anote os valores aqui para os próximos deploys.

- [ ] Na VPS:
      ```bash
      pm2 list                                   # nome do processo
      pm2 describe <NOME> | grep -E "script|cwd|exec"
      ```
      - Nome do processo PM2: `______________`
      - Diretório do app: `______________`
      - Script iniciado: `______________`

⚠️ O build emite `"next start" does not work with "output: standalone"`. Se o PM2 estiver usando `next start`, ele está funcionando por acidente — o correto para esta configuração é `node .next/standalone/server.js`. **Não mude isso durante o deploy**; se hoje funciona, mantenha. Anote e trate depois, separadamente.

---

## Fase C — Deploy na VPS

- [ ] Guardar o commit atual, para rollback:
      ```bash
      cd <DIRETORIO_DO_APP>
      git rev-parse --short HEAD    # anote: ______________
      ```
- [ ] Atualizar o código:
      ```bash
      git fetch origin
      git checkout main
      git pull origin main
      git log --oneline -1          # deve bater com o HEAD da dev
      ```
- [ ] Instalar dependências (o `package-lock.json` mudou por causa do Next):
      ```bash
      npm ci
      ```
      ⚠️ Use `npm ci`, não `npm install` — `ci` respeita o lock exatamente.
- [ ] Build:
      ```bash
      npm run build
      ```
      ✅ Precisa completar e listar as rotas. **Se falhar, pare aqui** — o processo antigo ainda está no ar e nada quebrou.
- [ ] Reiniciar:
      ```bash
      pm2 restart <NOME> --update-env
      pm2 logs <NOME> --lines 30
      ```
      ✅ Nos logs: `▲ Next.js 16.3.1` e `Ready`.

---

## Fase D — Validar em produção

- [ ] Rotas e gating (rodar da sua máquina):
      ```bash
      curl -o /dev/null -w "%{http_code}\n" https://bypass.bloxs.com.br/login          # 200
      curl -o /dev/null -w "%{http_code}\n" https://bypass.bloxs.com.br/deals/meus     # 307
      curl -o /dev/null -w "%{http_code}\n" https://bypass.bloxs.com.br/admin/usuarios # 307
      curl -o /dev/null -w "%{http_code}\n" https://bypass-originacao.duckdns.org/login # 200
      ```
- [ ] Confirmar a versão que subiu:
      ```bash
      curl -sI https://bypass.bloxs.com.br/login | grep -i "^x-powered-by"
      ```
- [ ] **Login real** no navegador
- [ ] **Recuperação de senha ponta a ponta** — é o fluxo mais frágil do projeto e nunca foi testado no domínio novo *(fecha também a Fase 5 de `MIGRACAO-DOMINIO.md`)*
- [ ] Abrir `/deals/meus` e conferir a correção de prazo: 3 deals com "Prazo não informado", os demais com data real
- [ ] Entrar como **ADMIN** (não SUPER_ADMIN) e confirmar que "Novo Deal" aparece no menu
- [ ] Testar no celular

---

## Rollback

Se algo quebrar depois do restart:

```bash
cd <DIRETORIO_DO_APP>
git checkout 7f38094        # ou o commit anotado na Fase C
npm ci
npm run build
pm2 restart <NOME> --update-env
```

Alternativa equivalente pela tag: `git checkout pre-next-upgrade-2026-08-15` volta ao estado anterior ao upgrade do Next, mas mantém a correção de RLS.

**O que NÃO precisa de rollback, aconteça o que acontecer:**
- O RLS já está no banco e é independente do código deployado
- Os dois domínios continuam apontando para a mesma VPS

⚠️ **Não reverta o banco.** Nenhuma mudança de schema faz parte deste deploy.

---

## Depois do deploy

- [ ] 🚨 **Rotacionar a service role key do Supabase** (exposta em 27/08/2026) e atualizar o `.env` da VPS. É a pendência mais urgente do projeto — ver `HANDOVER.md`.
- [ ] Atualizar em `HANDOVER.md` o commit de produção (`7f38094` → o novo HEAD) e a versão do Next (16.1.6 → 16.3.1)
- [ ] Avisar os originadores sobre o domínio novo *(fecha a Fase 6 de `MIGRACAO-DOMINIO.md`)*
