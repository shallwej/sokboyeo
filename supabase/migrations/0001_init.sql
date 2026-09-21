-- 속보여 2단계: 상대(subjects) · 리포트(reports) · 서버 이벤트(report_events)
create extension if not exists pgcrypto;

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null default '걔',
  birth_year int not null,
  birth_month int not null,
  birth_day int not null,
  birth_hour smallint,
  calendar text not null default 'solar' check (calendar in ('solar','lunar')),
  leap_month boolean not null default false,
  created_at timestamptz not null default now()
);

create type public.report_status as enum
  ('draft','paid','generating','review','published','viewed','cancelled','refunded','failed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  question_key text not null,
  self_report jsonb not null,
  my_chart jsonb not null,
  subject_chart jsonb not null,
  compat jsonb not null,
  status public.report_status not null default 'draft',
  order_id text not null unique,
  payment_key text,
  amount int not null,
  content jsonb,
  review_note text,
  feedback smallint check (feedback in (0, 1)),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  published_at timestamptz,
  viewed_at timestamptz
);
create index reports_user_idx on public.reports (user_id, created_at desc);
create index reports_status_idx on public.reports (status);

-- 서버 측 계기판 이벤트 (결제·생성·환불 등 클라이언트가 못 보는 사건)
create table public.report_events (
  id bigserial primary key,
  report_id uuid references public.reports(id) on delete cascade,
  event text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table public.subjects enable row level security;
alter table public.reports enable row level security;
alter table public.report_events enable row level security;

-- 사용자는 자기 것만 읽고, 상대는 직접 만들고 지울 수 있다. 상태 전이·본문 기록은 service role(Edge Function)만.
create policy "subjects: own select" on public.subjects for select using (auth.uid() = user_id);
create policy "subjects: own insert" on public.subjects for insert with check (auth.uid() = user_id);
create policy "subjects: own delete" on public.subjects for delete using (auth.uid() = user_id);
create policy "reports: own select" on public.reports for select using (auth.uid() = user_id);
-- report_events: 사용자 접근 없음 (service role만)

-- 1탭 피드백만 사용자가 쓸 수 있게 RPC로 제한
create or replace function public.set_report_feedback(p_report_id uuid, p_value smallint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_value not in (0, 1) then raise exception 'invalid feedback'; end if;
  update public.reports set feedback = p_value
   where id = p_report_id and user_id = auth.uid() and status in ('published','viewed');
end $$;
revoke all on function public.set_report_feedback(uuid, smallint) from public;
grant execute on function public.set_report_feedback(uuid, smallint) to authenticated;
