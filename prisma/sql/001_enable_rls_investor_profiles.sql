-- Corrige o alerta de segurança do Supabase (09/08/2026):
--   "rls_disabled_in_public" — public.investor_profiles
--
-- Contexto: a tabela foi criada por `prisma db push` durante a fase buy-side
-- (Workspace V2). O Prisma não habilita RLS ao criar tabelas, então esta ficou
-- como a única do schema public sem RLS — exposta via PostgREST à anon key,
-- que é pública por definição (NEXT_PUBLIC_SUPABASE_ANON_KEY). A tabela guarda
-- CPF, celular e faixas de ticket dos investidores.
--
-- Por que é seguro rodar em produção (banco compartilhado dev/prod):
--   * O Prisma conecta como `postgres`, owner da tabela. O owner ignora RLS
--     enquanto FORCE ROW LEVEL SECURITY estiver desligado — a aplicação
--     continua lendo e gravando normalmente.
--   * Não há nenhum `supabase.from()` / `.rpc()` no código; o cliente Supabase
--     é usado apenas para Auth. Nada acessa dados pela API pública.
--   * Sem policies, `anon` e `authenticated` ficam bloqueados — exatamente o
--     mesmo estado das outras 8 tabelas do schema (checklists, companies,
--     dcf_projections, offers, originators, profiles, users, valuations).
--
-- Reversível com: ALTER TABLE public.investor_profiles DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;

-- Verificação (esperado: rls = true, force = false, 0 policies):
--   select c.relname, c.relrowsecurity as rls, c.relforcerowsecurity as force
--   from pg_class c join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind = 'r'
--   order by 1;
