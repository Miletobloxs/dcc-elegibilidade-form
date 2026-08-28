# Handover — Portal Bypass (modo manutenção)

> **Atualizado em 27/08/2026.** Este documento assume que quem lê pode estar voltando ao projeto depois de semanas sem tocá-lo.

## 🎯 Regra número um: estabilidade

O portal bypass é **temporário**. Será substituído em breve e depois migrado para a **AWS da Bloxs**, onde ficará apenas como fail-safe de emergência.

Isso define a prioridade de tudo: **manter no ar e não abrir brecha de segurança**. Não vale investir em refatoração, cobertura de testes, ambiente de homologação ou melhoria de processo. Mudança boa é mudança pequena, validada e reversível.

## 📍 Onde as coisas estão

| Ambiente | Estado |
|---|---|
| **Produção** | VPS + PM2 em `163.176.251.10`, nginx 1.24.0. Responde nos **dois** domínios: `bypass.bloxs.com.br` (novo) e `bypass-originacao.duckdns.org` (antigo, mantido como rollback). Rodando o commit `7f38094` (**Next 16.1.6**). |
| **Branch `dev`** | 3 commits à frente de produção (ver abaixo). Nada deployado. |
| **Branch `feature/buy-side-wip`** | Fase buy-side congelada, commit `7ecafff`. Não mergear sem ler a seção correspondente. |
| **Banco** | Supabase `lpmsuvgqhcjxonajaqed`, região `sa-east-1`. **Compartilhado entre dev e produção.** |

### Commits em `dev` ainda não deployados

| Commit | O quê | Validação |
|---|---|---|
| `aba1780` | Habilita RLS em `investor_profiles` | Aplicado direto no banco; **já vale em produção**, independe de deploy |
| `7097765` | Next 16.1.6 → 16.3.1 (fecha 28 advisories) | typecheck limpo, build ok, smoke test de auth rota a rota |
| `22a9ac7` | Mantém `InvestorProfile`/`signupData` no schema | typecheck e build do zero |

## ⚠️ As três armadilhas deste projeto

### 1. O banco é compartilhado entre dev e produção
Qualquer mudança de dados ou de schema feita localmente **atinge produção no mesmo instante**. Já derrubou a produção uma vez (07/07/2026, gravação de valor de enum que o build em produção não conhecia).

Ordem segura para mudança de schema: **código (expand) → deploy → migração de dados**.

### 2. `prisma db push` cria tabela sem RLS
Não há `prisma/migrations` — o schema é aplicado com `db push`, e o Prisma **não habilita Row-Level Security**. Como o schema `public` é servido pelo PostgREST à anon key (que é pública, vai no bundle do browser), toda tabela nova nasce aberta para leitura, escrita e exclusão por qualquer um.

Foi o que aconteceu com `investor_profiles`, criada em 13/07 e sinalizada pelo Supabase como crítica em 09/08. Corrigida em 15/08.

**Depois de todo `db push` que crie tabela:**
```sql
ALTER TABLE public.<tabela> ENABLE ROW LEVEL SECURITY;
```
Seguro em produção: o Prisma conecta como `postgres`, owner das tabelas, e o owner ignora RLS enquanto `FORCE` estiver desligado. Zero policies é o padrão correto aqui — o app não usa `supabase.from()`/`.rpc()`, só Auth. Modelo comentado em `prisma/sql/001_enable_rls_investor_profiles.sql`.

Conferir o estado de todas as tabelas:
```sql
select c.relname, c.relrowsecurity as rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by 1;
```

### 3. Não remova `InvestorProfile` nem `signupData` do schema
A fase buy-side está congelada, mas a tabela `investor_profiles` e a coluna `users.signupData` **já existem no banco** desde 13/07. Os dois seguem declarados em `prisma/schema.prisma` de propósito, com comentário de aviso.

Removê-los de lá faria o próximo `db push` **derrubar tabela e coluna em produção**. Se um dia quiser mesmo limpar, faça o `DROP` no banco e a remoção do schema na mesma janela, conscientemente.

## 🧊 Fase buy-side (congelada em 15/08/2026)

Parada por decisão de produto. Preservada em `feature/buy-side-wip` (`7ecafff`), 24 arquivos: escolha de persona em `/cadastro`, cadastro de investidor, API unificada `/api/cadastro` com sync HubSpot V2, onboarding de preferências, vitrine `/oportunidades` com scoring de match, filtro de visibilidade por etapa do HubSpot, aba Investidores no admin e perfil "Ambos".

Estava completa e compilando quando foi congelada. Se voltar: `git checkout feature/buy-side-wip`.

Resíduo em produção: 3 linhas de teste em `investor_profiles` (`investidor.teste.claude@example.com`, `teste@gmail.com`, `carlos.carneiro@zugventures.com.br`), nenhum usuário com `signupData` preenchido.

## 🔒 Segurança — estado atual

* **Resolvido:** RLS em `investor_profiles`. Todas as 9 tabelas do schema `public` agora têm RLS habilitado, 0 policies.
* **Resolvido em `dev`, pendente em produção:** as 28 advisories do Next 16.1.6. Entre elas, quatro variantes de **bypass de Middleware/Proxy no App Router** — e `src/proxy.ts` é a única barreira de autenticação do sistema. Também bypass de CSRF em Server Actions, cache poisoning em RSC e SSRF em rewrites. **Só fecha com deploy.**
* **Sem correção disponível:** 5 vulnerabilidades high no toolchain do Prisma (`prisma`, `@prisma/config`, `effect`) na linha 6.x atual. Reavaliar quando sair correção.
* **Varredura limpa:** nenhuma view, function, ou extensão no schema `public` — nada de `search_path` mutável ou `SECURITY DEFINER` solto. `.env` está no `.gitignore` e nunca foi commitado em nenhum branch.
* **Resíduo:** `NEXT_PUBLIC_BYPASS_AUTH` existe no `.env` mas não é lida em lugar nenhum do código.
* 🚨 **AÇÃO PENDENTE — service role key exposta (27/08/2026).** A chave `sb_secret_...` do Supabase foi colada em texto puro num terminal e numa conversa. Ela ignora RLS e dá acesso administrativo total: ler e escrever qualquer tabela, criar usuários, gerar links de recuperação para qualquer e-mail. **Rotacionar** em Settings → API e atualizar o `.env` da VPS. Um token de recovery de `carlos.carneiro@bloxs.com.br` também foi exposto no mesmo episódio.

## 🌐 Domínio

Migrado em 27/08/2026 de `bypass-originacao.duckdns.org` para **`bypass.bloxs.com.br`** (Route 53, registro A → `163.176.251.10`, TTL 60).

Os **dois domínios respondem em paralelo** — de propósito. O duckdns é o rollback e não custa nada manter. Certificado Let's Encrypt único cobre os dois via SAN, válido até **25/11/2026**.

No Supabase, a allowlist de Redirect URLs já aceita `https://bypass.bloxs.com.br/**` e a **Site URL já aponta para o domínio novo** (validado em 27/08/2026 via `auth.admin.generateLink`). Consequência para rollback: os e-mails de recuperação de senha agora caem no domínio novo, então reverter só o DNS não basta — a Site URL precisa voltar junto.

⚠️ **Ao aposentar o duckdns:** se o registro DNS dele for apagado, a renovação automática do certificado falha — o certbot não valida um domínio que não resolve — e derruba o TLS dos **dois**. Antes de largá-lo, reemita só para o novo:
```bash
sudo certbot --nginx -d bypass.bloxs.com.br --cert-name bypass.bloxs.com.br
```

O domínio não aparece no código: os redirects de auth são montados de `window.location.origin` e do `origin` do request. `NEXT_PUBLIC_APP_URL` não é lido em nenhum ponto do `src/` — é config morta, atualizada só por consistência. Trocar de domínio não exige rebuild.

Passo a passo completo e estado de cada fase em `MIGRACAO-DOMINIO.md`.

## 🚀 Deploy

Produção roda na VPS com PM2. **Nunca deployar sem ordem explícita.**

Antes do próximo deploy, confira como o PM2 inicia o processo: o build emite
`"next start" does not work with "output: standalone"`. O comando correto para esta configuração é `node .next/standalone/server.js`.

### Rollback

* **Tag `pre-next-upgrade-2026-08-15`** → commit `aba1780`, estado anterior ao upgrade do Next. Rollback = checkout da tag + rebuild.
* **Snapshot** em `../rollback-2026-08-15-pre-next-upgrade/` — `package.json`, `package-lock.json` e tarball dos 24 arquivos buy-side. Redundante agora que tudo está em git; pode descartar.
* **RLS**, se algum dia precisar reverter: `ALTER TABLE public.investor_profiles DISABLE ROW LEVEL SECURITY;`

## 🧪 Como validar uma mudança

**Não existe nenhum teste automatizado.** O vitest está configurado (`npm test`), mas o projeto tem zero arquivos de teste. Toda validação é manual.

Roteiro mínimo antes de qualquer commit ou deploy:

```bash
npx tsc --noEmit -p tsconfig.json    # sem saída = limpo
npm run build                         # tem que completar e listar as rotas
npx next dev -H 0.0.0.0               # testar no desktop e no celular via IP da Wi-Fi
```

Se mexeu em algo que toca autenticação ou `src/proxy.ts`, rode também o smoke test de gating — subir `npm start` numa porta livre e conferir:

* Públicas (`/login`, `/cadastro-interno`, `/bypass-cadastro`) → **200**
* Protegidas (`/deals/new`, `/deals/meus`, `/admin/usuarios`) → **307** para `/login?redirectTo=...`
* APIs protegidas (`/api/deals`, `/api/admin/users`) → **307**

⚠️ Cuidado ao testar escrita: o banco é o de produção. Leitura e navegação são seguras; criar deal, cadastrar usuário ou editar dado grava de verdade.

## 📋 Pendências

1. **Correção de prazo dos deals** — no working tree, sem commit, aguardando teste. Hoje todo card em `/deals/meus` mostra prazo fabricado de +6 meses; o fix passa a usar o prazo informado pelo originador, ou "Prazo não informado". Arquivos: `src/app/(app)/deals/meus/MeusDealsClient.tsx` e `src/app/api/deals/route.ts`.
2. **Decidir o deploy do Next 16.3.1** — é o que fecha o bypass de middleware em produção. Patch dentro da 16.x, validado, risco baixo mas não nulo.
3. **🚨 Rotacionar a service role key do Supabase** — exposta em 27/08/2026, ver seção de segurança. É a pendência mais urgente da lista.
4. **Advisories de Auth no Supabase** — proteção contra senha vazada, expiração de OTP e MFA só aparecem no painel (Security Advisor), não dá para inspecionar pelo banco. Conferir se sobrou algo lá.
5. **Recuperação de senha** — fix pendente de sprints anteriores; verificar o redirect do auth callback.
6. **Limpezas de baixa prioridade** — tabelas `dcf_projections` e `valuations` com 0 linhas (fase abandonada) e a variável morta `NEXT_PUBLIC_BYPASS_AUTH`. Dado que o projeto é temporário, provavelmente não compensa mexer.
