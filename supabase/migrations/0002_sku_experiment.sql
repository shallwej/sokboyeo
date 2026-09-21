-- 가격 확정(2026-09-12): SKU 3종 · 가격 변형 · 실험 결과
alter table public.reports add column if not exists sku text not null default 'basic' check (sku in ('basic','plus','pass'));
alter table public.reports add column if not exists price_variant text not null default 'a' check (price_variant in ('a','b'));
alter table public.reports add column if not exists experiment_result text check (experiment_result in ('A','B','C'));
alter table public.reports add column if not exists experiment_result_at timestamptz;

-- 실험 결과 입력: 본인 리포트, 발행 이후에만
create or replace function public.set_experiment_result(p_report_id uuid, p_value text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_value not in ('A','B','C') then raise exception 'invalid value'; end if;
  update public.reports
     set experiment_result = p_value, experiment_result_at = now()
   where id = p_report_id and user_id = auth.uid() and status in ('published','viewed');
  if not found then raise exception 'report not found'; end if;
  insert into public.report_events(report_id, event, meta)
  values (p_report_id, 'experiment_result', jsonb_build_object('value', p_value));
end $$;
revoke all on function public.set_experiment_result(uuid, text) from public;
grant execute on function public.set_experiment_result(uuid, text) to authenticated;
