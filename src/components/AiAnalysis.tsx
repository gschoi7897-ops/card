import { useState } from 'react';
import type { FinancialSummary } from '../types';

interface Props {
  companyName: string;
  financialData: FinancialSummary[];
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;

        const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-base font-bold text-slate-800 mt-3" dangerouslySetInnerHTML={{ __html: boldLine.replace('## ', '') }} />;
        }
        if (line.startsWith('### ') || line.match(/^\d+\.\s*\*\*/)) {
          return <h3 key={i} className="text-sm font-semibold text-blue-700 mt-3" dangerouslySetInnerHTML={{ __html: boldLine.replace(/^###?\s*/, '').replace(/^\d+\.\s*/, '') }} />;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: boldLine.replace(/^[-*]\s*/, '') }} />
            </div>
          );
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: boldLine }} />;
      })}
    </div>
  );
}

export default function AiAnalysis({ companyName, financialData }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, financialData }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `서버 오류 (${response.status})`);
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-blue-100 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-800">AI 재무 분석</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gemini 2.0 Flash가 {companyName}의 재무 데이터를 누구나 이해하기 쉽게 분석해 드립니다
          </p>
        </div>
      </div>

      {!analysis && !loading && !error && (
        <button
          onClick={fetchAnalysis}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-sm text-sm"
        >
          AI 분석 시작하기
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-slate-500">AI가 재무 데이터를 분석하고 있어요...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <p className="font-semibold mb-1">분석 오류</p>
          <p>{error}</p>
          <button
            onClick={fetchAnalysis}
            className="mt-3 text-xs bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition"
          >
            다시 시도
          </button>
        </div>
      )}

      {analysis && (
        <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-xs text-slate-500">Gemini 2.0 Flash 분석 완료</span>
            </div>
            <button
              onClick={fetchAnalysis}
              className="text-xs text-indigo-600 hover:text-indigo-800 transition"
            >
              재분석
            </button>
          </div>
          <MarkdownText text={analysis} />
          <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            ※ AI 분석은 참고용입니다. 투자 결정 시 전문가와 상담하세요.
          </p>
        </div>
      )}
    </div>
  );
}
