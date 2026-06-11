# Workspace Bypass — Bloxs

Plataforma de controle e originação digital de ofertas para parceiros e originadores da Bloxs Investimentos. Este projeto foi estruturado utilizando a arquitetura visual e o design system da *Central de Produto*, adaptado especificamente para um fluxo simplificado e focado de originação de ativos.

---

## Visão Geral

O **Workspace Bypass** permite que originadores e parceiros homologados cadastrem oportunidades de originação de ativos financeiros e realizem a estruturação digital de negócios nas esteiras da Bloxs.

### Módulos Principais

*   **Bypass de Cadastro KYB (`/bypass-cadastro`)**:
    *   Formulário de onboarding simplificado em 4 etapas para originadores (dados da empresa, dados do representante/pessoa física, endereço comercial, e criação de credenciais).
    *   Sincronização instantânea com o HubSpot (criação automática de Empresa, Contato de Representante, e associação entre ambos no CRM).
*   **Originação Digital de Negócios (`/deals/new`)**:
    *   Interface de originação em 4 etapas:
        1.  *Sobre a empresa tomadora* (Razão social, CNPJ, faturamento, atividade).
        2.  *Detalhes da captação* (Valor buscado, finalidade, prazos e garantias).
        3.  *Estrutura da operação* (CRI, CRA, Debêntures, indexador e taxa alvo).
        4.  *Resumo & Confirmação* (Revisão antes do envio final).
    *   Sincronização com a esteira do HubSpot na pipeline de triagem, vinculando o deal aos respectivos Contatos e Empresas.
*   **Administração de Cadastros e Deals (`/admin/usuarios`)**:
    *   Visão de auditoria para administradores da Bloxs:
        1.  *Usuários & Originadores*: Auditoria de credenciais locais, bypasses ativos e status do HubSpot.
        2.  *Backup de Deals (Supabase)*: Backup das originações do formulário armazenado no banco local (Prisma PostgreSQL) como redundância operacional e auditoria.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19, TypeScript strict |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"`) |
| Database / ORM | Prisma ORM, PostgreSQL (Supabase) |
| CRM | HubSpot CRM API |
| Autenticação | Supabase Auth |
| Ícones | Lucide React |

---

## Setup & Desenvolvimento

```bash
# 1. Instalar dependências
npm install

# 2. Configurar o arquivo .env com as chaves corretas
cp .env.example .env

# 3. Rodar as migrações e sincronizar o banco de dados
npx prisma db push

# 4. Iniciar servidor de desenvolvimento
npm run dev

# 5. Build de produção
npm run build
```

Acesse: **http://localhost:3000** → Se não estiver autenticado, redireciona automaticamente para `/bypass-cadastro`. Caso autenticado, vai para `/deals/new`.

---

## Licença

Proprietary — Bloxs Capital © 2026
