import { useState, useCallback } from 'react';
import type { DartResponse, FinancialSummary, ReportCode } from '../types';

const BASE_YEAR = new Date().getFullYear() - 1;
const YEARS = Array.from({ length: 5 }, (_, i) => String(BASE_YEAR - 4 + i));

function parseAmount(s: string | undefined): number {
  if (!s || s === '-' || s.trim() === '') return 0;
  return parseInt(s.replace(/[,\s]/g, ''), 10) || 0;
}

function extractKey(items: DartResponse['list'], accountId: string, fallbackNames: string[]): number {
  if (!items) return 0;
  const hit = items.find(
    i => i.account_id === accountId || fallbackNames.some(n => i.account_nm?.includes(n))
  );
  if (!hit) return 0;
  return parseAmount(hit.thstrm_amount) || parseAmount(hit.thstrm_add_amount);
}

export function useDartData() {
  const [data, setData] = useState<FinancialSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (corpCode: string, reportCode: ReportCode = '11011') => {
    setLoading(true);
    setError(null);
    setData([]);

    try {
      const results = await Promise.allSettled(
        YEARS.map(year =>
          fetch(`/api/dart?corp_code=${corpCode}&bsns_year=${year}&reprt_code=${reportCode}`)
            .then(r => r.json() as Promise<DartResponse>)
        )
      );

      const summaries: FinancialSummary[] = [];

      results.forEach((result, i) => {
        if (result.status !== 'fulfilled') return;
        const json = result.value;
        if (json.status !== '000' || !json.list?.length) return;

        const items = json.list;

        const summary: FinancialSummary = {
          year: YEARS[i],
          revenue: extractKey(items, 'ifrs-full_Revenue', ['매출액', '수익(매출액)', '영업수익']),
          operatingProfit: extractKey(items, 'dart_OperatingIncomeLoss', ['영업이익', '영업손익']),
          netIncome: extractKey(items, 'ifrs-full_ProfitLoss', ['당기순이익', '당기순손익']),
          totalAssets: extractKey(items, 'ifrs-full_Assets', ['자산총계', '총자산']),
          totalLiabilities: extractKey(items, 'ifrs-full_Liabilities', ['부채총계', '총부채']),
          totalEquity: extractKey(items, 'ifrs-full_Equity', ['자본총계', '총자본']),
        };

        if (summary.revenue || summary.totalAssets) {
          summaries.push(summary);
        }
      });

      if (summaries.length === 0) {
        setError('해당 기업의 재무 데이터를 찾을 수 없습니다. 상장 기업인지 확인해 주세요.');
      } else {
        setData(summaries);
      }
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
}
