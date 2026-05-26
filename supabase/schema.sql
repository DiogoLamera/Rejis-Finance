-- ============================================================================
-- Rejis's Finance — Schema inicial do banco de dados
-- ============================================================================
-- Rodar este script no SQL Editor do Supabase após criar o projeto.
-- Cria as tabelas, índices, triggers de fechamento e políticas de segurança.
-- ============================================================================

-- Habilita UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================================
-- TABELA: transacoes (entradas e saídas)
-- ============================================================================
create table if not exists public.transacoes (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid references auth.users(id) on delete cascade,
  tipo            text not null check (tipo in ('entrada', 'saida')),
  descricao       text not null,
  valor           numeric(14, 2) not null check (valor > 0),
  data            date not null,
  categoria       text not null,
  documento_url   text,
  status          text not null default 'confirmada'
                    check (status in ('confirmada', 'pendente', 'cancelada')),
  observacoes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists transacoes_data_idx on public.transacoes (data desc);
create index if not exists transacoes_tipo_idx on public.transacoes (tipo);
create index if not exists transacoes_user_idx on public.transacoes (user_id);

-- ============================================================================
-- TABELA: contas_a_pagar
-- ============================================================================
create table if not exists public.contas_a_pagar (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade,
  descricao         text not null,
  valor             numeric(14, 2) not null check (valor > 0),
  data_vencimento   date not null,
  data_pagamento    date,
  status            text not null default 'pendente'
                      check (status in ('pendente', 'paga', 'atrasada', 'cancelada')),
  categoria         text not null,
  recorrente        boolean not null default false,
  documento_url     text,
  observacoes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Adiciona coluna documento_url em bancos já existentes (idempotente)
alter table public.contas_a_pagar
  add column if not exists documento_url text;

create index if not exists contas_vencimento_idx on public.contas_a_pagar (data_vencimento);
create index if not exists contas_status_idx on public.contas_a_pagar (status);

-- ============================================================================
-- TABELA: fechamentos_diarios
-- ============================================================================
create table if not exists public.fechamentos_diarios (
  id                      uuid primary key default uuid_generate_v4(),
  data                    date not null unique,
  total_entradas          numeric(14, 2) not null default 0,
  total_saidas            numeric(14, 2) not null default 0,
  saldo                   numeric(14, 2) generated always as (total_entradas - total_saidas) stored,
  quantidade_transacoes   integer not null default 0,
  created_at              timestamptz not null default now()
);

create index if not exists fechamentos_diarios_data_idx on public.fechamentos_diarios (data desc);

-- ============================================================================
-- TABELA: fechamentos_mensais
-- ============================================================================
create table if not exists public.fechamentos_mensais (
  id                      uuid primary key default uuid_generate_v4(),
  ano                     integer not null,
  mes                     integer not null check (mes between 1 and 12),
  total_entradas          numeric(14, 2) not null default 0,
  total_saidas            numeric(14, 2) not null default 0,
  saldo                   numeric(14, 2) generated always as (total_entradas - total_saidas) stored,
  quantidade_transacoes   integer not null default 0,
  created_at              timestamptz not null default now(),
  unique (ano, mes)
);

-- ============================================================================
-- FUNÇÃO: atualizar updated_at automaticamente
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_transacoes_updated on public.transacoes;
create trigger trg_transacoes_updated
  before update on public.transacoes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_contas_updated on public.contas_a_pagar;
create trigger trg_contas_updated
  before update on public.contas_a_pagar
  for each row execute function public.set_updated_at();

-- ============================================================================
-- FUNÇÃO: gerar fechamento diário
-- ============================================================================
create or replace function public.gerar_fechamento_diario(data_alvo date)
returns void as $$
begin
  insert into public.fechamentos_diarios (data, total_entradas, total_saidas, quantidade_transacoes)
  select
    data_alvo,
    coalesce(sum(case when tipo = 'entrada' then valor else 0 end), 0),
    coalesce(sum(case when tipo = 'saida' then valor else 0 end), 0),
    count(*)
  from public.transacoes
  where data = data_alvo and status = 'confirmada'
  on conflict (data) do update set
    total_entradas = excluded.total_entradas,
    total_saidas = excluded.total_saidas,
    quantidade_transacoes = excluded.quantidade_transacoes;
end;
$$ language plpgsql;

-- ============================================================================
-- FUNÇÃO: gerar fechamento mensal
-- ============================================================================
create or replace function public.gerar_fechamento_mensal(ano_alvo int, mes_alvo int)
returns void as $$
begin
  insert into public.fechamentos_mensais (ano, mes, total_entradas, total_saidas, quantidade_transacoes)
  select
    ano_alvo,
    mes_alvo,
    coalesce(sum(case when tipo = 'entrada' then valor else 0 end), 0),
    coalesce(sum(case when tipo = 'saida' then valor else 0 end), 0),
    count(*)
  from public.transacoes
  where extract(year from data) = ano_alvo
    and extract(month from data) = mes_alvo
    and status = 'confirmada'
  on conflict (ano, mes) do update set
    total_entradas = excluded.total_entradas,
    total_saidas = excluded.total_saidas,
    quantidade_transacoes = excluded.quantidade_transacoes;
end;
$$ language plpgsql;

-- ============================================================================
-- FUNÇÃO: marcar contas vencidas como atrasadas
-- ============================================================================
create or replace function public.marcar_contas_atrasadas()
returns void as $$
begin
  update public.contas_a_pagar
  set status = 'atrasada'
  where status = 'pendente'
    and data_vencimento < current_date;
end;
$$ language plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table public.transacoes enable row level security;
alter table public.contas_a_pagar enable row level security;
alter table public.fechamentos_diarios enable row level security;
alter table public.fechamentos_mensais enable row level security;

-- Política simples: usuários autenticados podem ler/escrever tudo.
-- Ajustar quando houver múltiplas empresas/usuários.
create policy "auth_read_transacoes"      on public.transacoes      for select using (auth.role() = 'authenticated');
create policy "auth_write_transacoes"     on public.transacoes      for all    using (auth.role() = 'authenticated');
create policy "auth_read_contas"          on public.contas_a_pagar  for select using (auth.role() = 'authenticated');
create policy "auth_write_contas"         on public.contas_a_pagar  for all    using (auth.role() = 'authenticated');
create policy "auth_read_fech_diario"     on public.fechamentos_diarios for select using (auth.role() = 'authenticated');
create policy "auth_read_fech_mensal"     on public.fechamentos_mensais for select using (auth.role() = 'authenticated');

-- ============================================================================
-- STORAGE: bucket para documentos (notas e comprovantes)
-- ============================================================================
-- Criar manualmente no painel do Supabase ou executar via SQL:
insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;
