import { useState } from 'react';
import SearchBar from './components/SearchBar';
import FinancialCharts from './components/FinancialCharts';
import AiAnalysis from './components/AiAnalysis';
import { useDartData } from './hooks/useDartData';
import type { CorpItem, ReportCode } from './types';

const REPORT_OPTIONS: { value: ReportCode; label: string }[] = [
  { value: '11011', label: '사업보고서 (연간)' },
  { value: '11012', label: '반기보고서' },
  { value: '11013', label: '1분기 보고서' },
  { value: '11014', label: '3분기 보고서' },
];

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-200 rounded-2xl h-20" />
        ))}
      </div>
      <div className="bg-slate-200 rounded-2xl h-72" />
      <div className="bg-slate-200 rounded-2xl h-64" />
    </div>
  );
}

export default function App() {
  const [selectedCompany, setSelectedCompany] = useState<CorpItem | null>(null);
  const [reportCode, setReportCode] = useState<ReportCode>('11011');
  const { data, loading, error, fetchData } = useDartData();

  const handleCompanySelect = (company: CorpItem) => {
    setSelectedCompany(company);
    fetchData(company.corp_code, reportCode);
  };

  const handleReportChange = (code: ReportCode) => {
    setReportCode(code);
    if (selectedCompany) {
      fetchData(selectedCompany.corp_code, code);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">재무데이터 분석</h1>
            <p className="text-xs text-slate-400">OpenDart 기반 기업 재무 시각화</p>
          </div>
          <div className="ml-auto">
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
              Beta
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Search Section */}
        <section className="text-center space-y-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">
              기업 재무를 한눈에 파악하세요
            </h2>
            <p className="mt-2 text-slate-500 text-sm md:text-base">
              3,864개 기업의 재무 정보를 검색하고, AI가 쉽게 설명해 드립니다
            </p>
          </div>
          <SearchBar onSelect={handleCompanySelect} selectedCompany={selectedCompany} />
        </section>

        {/* Report Type Selector */}
        {selectedCompany && (
          <section className="flex flex-wrap gap-2 justify-center">
            {REPORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleReportChange(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  reportCode === opt.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-500">재무 데이터 불러오는 중...</span>
            </div>
            <LoadingSkeleton />
          </section>
        )}

        {/* Error State */}
        {error && !loading && (
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-semibold text-amber-800">{error}</p>
            <button
              onClick={() => selectedCompany && fetchData(selectedCompany.corp_code, reportCode)}
              className="mt-3 text-sm bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition"
            >
              다시 시도
            </button>
          </section>
        )}

        {/* Charts + AI Analysis */}
        {!loading && data.length > 0 && selectedCompany && (
          <>
            <section>
              <div className="flex items-center gap-2 mb-5">
                <h2 className="text-lg font-bold text-slate-800">{selectedCompany.corp_name}</h2>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">
                  {selectedCompany.corp_code}
                </span>
                {selectedCompany.stock_code && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
                    {selectedCompany.stock_code}
                  </span>
                )}
                <span className="ml-auto text-xs text-slate-400">
                  {REPORT_OPTIONS.find(o => o.value === reportCode)?.label} · {data.length}개년 데이터
                </span>
              </div>
              <FinancialCharts data={data} />
            </section>

            <section>
              <AiAnalysis
                companyName={selectedCompany.corp_name}
                financialData={data}
              />
            </section>
          </>
        )}

        {/* Empty State */}
        {!selectedCompany && !loading && (
          <section className="text-center py-16">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">기업을 검색해서 재무 분석을 시작하세요</p>
            <p className="text-slate-400 text-sm mt-1">
              예: 삼성전자, 카카오, NAVER, 현대차
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['삼성전자', 'NAVER', '카카오', 'SK하이닉스', '현대자동차'].map(name => (
                <span key={name} className="text-xs bg-white border border-slate-200 text-slate-500 px-3 py-1.5 rounded-full">
                  {name}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-slate-400 space-y-1">
          <p>데이터 출처: <a href="https://opendart.fss.or.kr" className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">금융감독원 전자공시시스템 (OpenDart)</a></p>
          <p>AI 분석: Google Gemini 2.0 Flash · 본 서비스의 정보는 투자 권유가 아닙니다</p>
        </div>
      </footer>
    </div>
  );
}
