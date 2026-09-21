-- 가격 확정(2026-09-14): SKU 집합 교체 (basic 9,900 · deep 19,800 · tarot 1,900 · question 3,900)
alter table public.reports drop constraint if exists reports_sku_check;
alter table public.reports add constraint reports_sku_check check (sku in ('basic','deep','tarot','question'));
