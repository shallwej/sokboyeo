import { supabase } from './lib/supabase';
import type { BirthInput, Gan } from './saju/manse';
import type { Compat } from './saju/compat';
import type { SelfAnswers, Stage } from './report/selfreport';
import type { QuestionKey } from './report/questions';
import type { ReportContent, ExperimentResult } from './report/schema';
import type { SkuId } from './payment';

export interface OrderInput {
  nickname: string;
  myBirth: BirthInput;
  subjectBirth: BirthInput;
  questionKey: QuestionKey;
  selfAnswers: SelfAnswers;
  sku: SkuId;
}

export type ReportStatus = 'draft' | 'paid' | 'generating' | 'review' | 'published' | 'viewed' | 'cancelled' | 'refunded' | 'failed';

export interface ReportRow {
  id: string;
  status: ReportStatus;
  questionKey: QuestionKey;
  nickname: string;
  feedback: number | null;
  createdAt: string;
  publishedAt: string | null;
  content: ReportContent | null;
  sku: SkuId;
  experimentResult: ExperimentResult | null;
  /** 결정론 섹션 렌더용 문맥 — 서버가 저장한 계산 결과 (열람 가능 상태에서만 내려온다) */
  myChart: { dayGan: Gan } | null;
  subjectChart: { dayGan: Gan } | null;
  compat: Compat | null;
  selfReport: { answers: SelfAnswers; facts: string[]; signalIndex: number; flags: string[]; stage?: { current: Stage; note: string } } | null;
}

export interface ReportListItem {
  id: string;
  status: ReportStatus;
  question_key: QuestionKey;
  created_at: string;
  published_at: string | null;
  subjects: { nickname: string } | { nickname: string }[] | null;
}

async function invoke<T>(name: string, body: unknown): Promise<T> {
  if (!supabase) throw new Error('백엔드가 연결되지 않았어');
  const { data, error } = await supabase.functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) {
    let message = error.message;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        const j = await ctx.json();
        if (j?.error) message = j.error;
      }
    } catch { /* ignore */ }
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  createOrder: (input: OrderInput) => invoke<{ reportId: string; orderId: string; amount: number }>('create-order', input),
  confirmPayment: (p: { paymentKey: string; orderId: string; amount: number }) => invoke<{ status: ReportStatus; reportId: string }>('confirm-payment', p),
  cancelOrder: (reportId: string) => invoke<{ status: ReportStatus }>('cancel-order', { reportId }),
  getReport: (reportId: string) => invoke<ReportRow>('get-report', { reportId }),
  admin: {
    list: () => invoke<{ reports: AdminReport[] }>('admin-reports', { action: 'list' }),
    publish: (reportId: string, content?: ReportContent, reviewNote?: string) => invoke<{ status: ReportStatus }>('admin-reports', { action: 'publish', reportId, content, reviewNote }),
    regenerate: (reportId: string) => invoke<{ status: ReportStatus }>('admin-reports', { action: 'regenerate', reportId }),
    refund: (reportId: string) => invoke<{ status: ReportStatus }>('admin-reports', { action: 'refund', reportId }),
  },
};

export interface AdminReport {
  id: string;
  status: ReportStatus;
  question_key: QuestionKey;
  amount: number;
  content: ReportContent | null;
  review_note: string | null;
  self_report: { facts: string[]; signalIndex: number; flags: string[] };
  compat: { index: number; facts: { title: string }[] };
  created_at: string;
  paid_at: string | null;
  published_at: string | null;
  subjects: { nickname: string } | { nickname: string }[] | null;
}

export function nicknameOf(s: ReportListItem['subjects']): string {
  if (!s) return '걔';
  return Array.isArray(s) ? (s[0]?.nickname ?? '걔') : s.nickname;
}

export async function listMyReports(): Promise<ReportListItem[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('reports')
    .select('id,status,question_key,created_at,published_at,subjects(nickname)')
    .order('created_at', { ascending: false });
  return (data as ReportListItem[] | null) ?? [];
}

export async function setFeedback(reportId: string, value: number): Promise<void> {
  if (!supabase) return;
  await supabase.rpc('set_report_feedback', { p_report_id: reportId, p_value: value });
}

export async function setExperimentResult(reportId: string, value: ExperimentResult): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('set_experiment_result', { p_report_id: reportId, p_value: value });
  if (error) throw new Error(error.message);
}
