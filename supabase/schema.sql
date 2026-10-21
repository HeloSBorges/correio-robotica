create extension if not exists pgcrypto;

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  endereco text not null unique,
  nome text not null,
  papel text not null default 'aluno' check (papel in ('aluno', 'professor')),
  turma text,
  ativo boolean not null default true,
  envio_externo boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  caixa_id uuid not null references public.perfis(id) on delete cascade,
  pasta text not null default 'entrada' check (pasta in ('entrada', 'enviados', 'lixeira')),
  direcao text not null check (direcao in ('recebida', 'enviada')),
  remetente text not null,
  remetente_nome text,
  para text[] not null default '{}',
  cc text[] not null default '{}',
  assunto text not null default '',
  texto text,
  html text,
  message_id text,
  in_reply_to text,
  lida boolean not null default false,
  externa boolean not null default false,
  spf text,
  dkim text,
  dmarc text,
  provedor_id text,
  criada_em timestamptz not null default now()
);

create index if not exists mensagens_caixa_idx on public.mensagens (caixa_id, pasta, criada_em desc);
create index if not exists mensagens_provedor_idx on public.mensagens (caixa_id, provedor_id);

create table if not exists public.anexos (
  id uuid primary key default gen_random_uuid(),
  mensagem_id uuid not null references public.mensagens(id) on delete cascade,
  nome text not null,
  tipo text,
  tamanho bigint,
  caminho text not null
);

create index if not exists anexos_mensagem_idx on public.anexos (mensagem_id);

create table if not exists public.envios (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfis(id) on delete cascade,
  destinatarios int not null default 1,
  externos int not null default 0,
  criado_em timestamptz not null default now()
);

create index if not exists envios_perfil_idx on public.envios (perfil_id, criado_em desc);

create or replace function public.eh_professor()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'professor' and ativo
  );
$$;

alter table public.perfis enable row level security;
alter table public.mensagens enable row level security;
alter table public.anexos enable row level security;
alter table public.envios enable row level security;

drop policy if exists perfis_leitura on public.perfis;
create policy perfis_leitura on public.perfis
  for select to authenticated
  using (true);

drop policy if exists mensagens_leitura on public.mensagens;
create policy mensagens_leitura on public.mensagens
  for select to authenticated
  using (caixa_id = auth.uid() or public.eh_professor());

drop policy if exists mensagens_atualizacao on public.mensagens;
create policy mensagens_atualizacao on public.mensagens
  for update to authenticated
  using (caixa_id = auth.uid() or public.eh_professor())
  with check (caixa_id = auth.uid() or public.eh_professor());

drop policy if exists mensagens_exclusao on public.mensagens;
create policy mensagens_exclusao on public.mensagens
  for delete to authenticated
  using (caixa_id = auth.uid() or public.eh_professor());

drop policy if exists anexos_leitura on public.anexos;
create policy anexos_leitura on public.anexos
  for select to authenticated
  using (
    exists (
      select 1 from public.mensagens m
      where m.id = anexos.mensagem_id
        and (m.caixa_id = auth.uid() or public.eh_professor())
    )
  );

drop policy if exists envios_leitura on public.envios;
create policy envios_leitura on public.envios
  for select to authenticated
  using (perfil_id = auth.uid() or public.eh_professor());

insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', false)
on conflict (id) do nothing;
