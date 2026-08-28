# Migração de domínio — `bypass-originacao.duckdns.org` → `bypass.bloxs.com.br`

> Checklist operacional. Marque cada item conforme concluir.
>
> **Estado em 27/08/2026:** Fases 1 a 4 concluídas, mais a Site URL da Fase 6. Verificado de fora: DNS na VPS, nginx servindo o domínio novo, certificado com os dois nomes via SAN até 25/11/2026, gating de rotas correto, e o GoTrue aceitando `https://bypass.bloxs.com.br/**` como redirect e usando o domínio novo como fallback de Site URL.
>
> **Falta só a Fase 5 no navegador** — e ela ainda importa: ver a nota "O que a evidência do GoTrue não cobre".
> **Os dois domínios ficam no ar em paralelo.** O sistema não sai do ar em nenhum momento, e cada fase é reversível.

## Dados apurados (27/08/2026)

| Item | Valor |
|---|---|
| IP da VPS | `163.176.251.10` |
| Reverse proxy | nginx 1.24.0 (Ubuntu) |
| Certificado atual | Let's Encrypt, só `bypass-originacao.duckdns.org`, expira **11/11/2026** |
| Zona DNS | Route 53 (`bloxs.com.br`) |
| `bypass.bloxs.com.br` hoje | wildcard `*.bloxs.com.br` → CloudFront → ALB devolvendo **503**. Sem registro dedicado, sem serviço real. |
| Mudança no código | **nenhuma** — o domínio não aparece no código |
| Rebuild / redeploy | **não é necessário** |

**Por que não precisa rebuild:** os redirects de auth são montados dinamicamente de `window.location.origin` (`src/app/(auth)/recuperar-senha/page.tsx`) e do `origin` do request (`src/app/auth/callback/route.ts`). O `NEXT_PUBLIC_APP_URL` do `.env` não é lido em nenhum ponto do `src/`. Isso importa porque variáveis `NEXT_PUBLIC_*` são congeladas no momento do build — se ela fosse usada de verdade, trocar o domínio exigiria rebuild e redeploy.

---

## Fase 1 — DNS no Route 53

Console AWS → hosted zone `bloxs.com.br`.

- [x] Criar registro:
      - **Nome:** `bypass.bloxs.com.br`
      - **Tipo:** `A`
      - **Valor:** `163.176.251.10`
      - **TTL:** `60`
- [x] Confirmar propagação (repetir até retornar o IP da VPS):
      ```bash
      dig +short bypass.bloxs.com.br
      ```
      ✅ Esperado: `163.176.251.10`
      ❌ Se vier `18.155.21.x`, ainda é o wildcard do CloudFront — aguarde e repita.

> **TTL 60 é de propósito:** apagar o registro devolve o nome ao wildcard em ~1 minuto. É o rollback desta fase.

---

## Fase 2 — nginx na VPS

- [x] Conectar na VPS e **inspecionar antes de editar**:
      ```bash
      ls /etc/nginx/sites-enabled/
      sudo nginx -T | grep -nE "server_name|listen|proxy_pass"
      ```
- [x] Fazer backup do arquivo do site antes de mexer:
      ```bash
      sudo cp /etc/nginx/sites-enabled/<ARQUIVO> /root/<ARQUIVO>.bak-2026-08-27
      ```
- [x] Adicionar o novo nome **ao lado** do atual (não substituir):
      ```nginx
      server_name bypass-originacao.duckdns.org bypass.bloxs.com.br;
      ```
- [x] Testar a sintaxe e recarregar:
      ```bash
      sudo nginx -t && sudo systemctl reload nginx
      ```
      ✅ `nginx -t` precisa dizer `syntax is ok` / `test is successful`.
      ⚠️ Use `reload`, nunca `restart` — `reload` não derruba conexões abertas.
- [x] Confirmar que o duckdns continua respondendo:
      ```bash
      curl -o /dev/null -w "%{http_code}\n" https://bypass-originacao.duckdns.org/login
      ```
      ✅ Esperado: `200`

> **Rollback desta fase:** restaurar o `.bak` e `sudo nginx -t && sudo systemctl reload nginx`.

---

## Fase 3 — Certificado TLS

> ⚠️ Só rode depois que a Fase 1 propagou e a Fase 2 está aplicada. O desafio é HTTP-01: o certbot precisa que o nome resolva para a VPS **e** que o nginx responda por ele na porta 80.

- [x] Expandir o certificado para cobrir os dois nomes:
      ```bash
      sudo certbot --nginx -d bypass-originacao.duckdns.org -d bypass.bloxs.com.br --expand
      ```
- [x] Conferir o resultado:
      ```bash
      sudo certbot certificates
      ```
      ✅ Esperado: um certificado listando **os dois** domínios.
- [x] Validar o TLS do domínio novo de fora:
      ```bash
      echo | openssl s_client -connect bypass.bloxs.com.br:443 \
        -servername bypass.bloxs.com.br 2>/dev/null \
        | openssl x509 -noout -subject -dates
      ```

---

## Fase 4 — Supabase ⚠️ *é o passo que mais quebra*

Painel do Supabase → **Authentication** → **URL Configuration**.

- [x] Em **Redirect URLs**, adicionar (sem remover a antiga):
      ```
      https://bypass.bloxs.com.br/**
      ```
- [x] ~~**Manter a Site URL no duckdns por enquanto.**~~ — **antecipado:** a Site URL já foi trocada para `https://bypass.bloxs.com.br` em 27/08/2026, antes dos testes de navegador da Fase 5. Aceitável porque o domínio novo já estava validado por fora, mas veja a nota de rollback abaixo.

> **Por que isso quebra:** `resetPasswordForEmail` envia `redirectTo` com o origin de onde o usuário está. O Supabase **rejeita em silêncio** qualquer URL fora da allowlist e joga o usuário na Site URL, em vez da tela de trocar senha. O fluxo de recuperação de senha deste projeto já é frágil — foram 5 commits de correção — então é aqui que a migração falha se falhar.

---

## ⚠️ O que a evidência do GoTrue não cobre

Os testes via `auth.admin.generateLink` provaram o lado **Supabase**: a allowlist aceita o domínio novo e a Site URL aponta para ele. Isso é real e está fechado.

Mas eles **não** provam o lado **aplicação**, por dois motivos:

1. **Caminho de código diferente.** O `generateLink` devolve tokens no *fragmento* da URL (`#access_token=...`). O e-mail real, enviado por SMTP customizado, manda `token_hash` na *query string* — que cai no ramo server-side do `src/app/auth/callback/route.ts`. São dois caminhos distintos; o teste exercitou o que o e-mail de verdade não usa.
2. **Fragmento é invisível para `curl`.** O trecho `#access_token=...` nunca chega ao servidor. Ele depende de o browser preservar o fragmento durante o redirect e de o supabase-js consumi-lo no cliente. Só um navegador de verdade demonstra isso.

Como o fluxo de recuperação de senha deste projeto já quebrou várias vezes (5 commits de correção), o teste manual continua valendo.

## Fase 5 — Validação

- [x] Gating de rotas no domínio novo:
      ```bash
      curl -o /dev/null -w "%{http_code}\n" https://bypass.bloxs.com.br/login          # espera 200
      curl -o /dev/null -w "%{http_code}\n" https://bypass.bloxs.com.br/deals/meus     # espera 307
      curl -o /dev/null -w "%{http_code}\n" https://bypass.bloxs.com.br/admin/usuarios # espera 307
      ```
- [ ] **Login real** no navegador, em `https://bypass.bloxs.com.br/login`
- [ ] **Recuperação de senha de ponta a ponta** — pedir o e-mail, abrir o link recebido e confirmar que cai em `/recuperar-senha/alterar` **no domínio novo**, e que a troca de senha conclui
- [x] Conferir que o duckdns **continua funcionando** em paralelo (é o rollback)
- [ ] Testar no celular

---

## Fase 6 — Finalização (só depois da Fase 5 passar inteira)

- [x] ~~Trocar a **Site URL** do Supabase para `https://bypass.bloxs.com.br`~~ — feito em 27/08/2026
- [ ] Avisar os originadores sobre o endereço novo
- [x] ~~Pedir ao Claude para atualizar `NEXT_PUBLIC_APP_URL` no `.env` e o `HANDOVER.md`~~ — feito em 27/08/2026 *(cosmético — a variável é config morta)*
- [ ] Deixar o duckdns respondendo por algumas semanas como rollback. Não custa nada.

---

## ⚠️ Armadilha ao aposentar o duckdns

Depois da Fase 3, o certificado cobre **os dois** nomes. Se você apagar o registro DNS do duckdns, a renovação automática passa a falhar — o certbot não consegue validar um domínio que não resolve mais, e a renovação do certificado **inteiro** falha, derrubando o TLS dos **dois** domínios.

Antes de largar o duckdns, reemita só para o novo:

```bash
sudo certbot --nginx -d bypass.bloxs.com.br --cert-name bypass.bloxs.com.br
```

---

## Rollback geral

| Fase | Como reverter |
|---|---|
| 1 — DNS | Apagar o registro A no Route 53. Volta ao wildcard em ~1 min (TTL 60). |
| 2 — nginx | Restaurar o `.bak` + `sudo nginx -t && sudo systemctl reload nginx` |
| 3 — cert | Nada a fazer: o cert antigo continua válido até 11/11/2026 |
| 4 — Supabase | Remover a Redirect URL nova |

⚠️ **O rollback ficou mais fraco desde 27/08:** com a Site URL já apontando para `bypass.bloxs.com.br`, os e-mails de recuperação de senha passam a cair no domínio novo. Se ele quebrar, não basta o duckdns continuar no ar — é preciso reverter a Site URL no painel do Supabase também.

Enquanto o duckdns estiver no ar e na Site URL do Supabase, **o sistema continua funcionando normalmente por ele**, aconteça o que acontecer com o domínio novo.

---

## Contexto futuro

O plano é migrar este projeto para a AWS da Bloxs, onde ele ficará como fail-safe de emergência. O domínio já estar no Route 53 ajuda: na hora da migração basta repontar o registro para o novo destino, sem mexer em registrador. Ver `HANDOVER.md`.
