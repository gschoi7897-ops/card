import { useState, useEffect, useRef, useCallback } from 'react';
import Fuse from 'fuse.js';
import type { CorpItem } from '../types';

interface Props {
  onSelect: (company: CorpItem) => void;
  selectedCompany: CorpItem | null;
}

export default function SearchBar({ onSelect, selectedCompany }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CorpItem[]>([]);
  const [corps, setCorps] = useState<CorpItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(-1);
  const fuseRef = useRef<Fuse<CorpItem> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/corp.json')
      .then(r => r.json())
      .then((data: CorpItem[]) => {
        setCorps(data);
        fuseRef.current = new Fuse(data, {
          keys: ['corp_name', 'corp_eng_name', 'stock_code'],
          threshold: 0.3,
          minMatchCharLength: 1,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim() || !fuseRef.current) {
      setResults([]);
      return;
    }
    const hits = fuseRef.current.search(query, { limit: 10 });
    setResults(hits.map(h => h.item));
    setActiveIdx(-1);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback((company: CorpItem) => {
    setQuery(company.corp_name);
    setOpen(false);
    onSelect(company);
  }, [onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <div className="absolute left-4 text-slate-400 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? '기업 목록 로딩 중...' : '기업명 또는 종목코드 검색 (예: 삼성전자, 005930)'}
          disabled={loading}
          className="w-full pl-12 pr-12 py-4 text-base rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-slate-50 disabled:text-slate-400"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 text-slate-400 hover:text-slate-600 transition"
            aria-label="검색어 지우기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-80 overflow-y-auto">
          {results.map((corp, i) => (
            <li key={corp.corp_code}>
              <button
                onMouseDown={e => { e.preventDefault(); handleSelect(corp); }}
                className={`w-full text-left px-5 py-3 flex items-center gap-3 transition ${
                  i === activeIdx ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-800">{corp.corp_name}</span>
                  {corp.corp_eng_name && (
                    <span className="ml-2 text-sm text-slate-400 truncate">{corp.corp_eng_name}</span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {corp.stock_code && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-mono">
                      {corp.stock_code}
                    </span>
                  )}
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                    {corp.corp_code}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedCompany && (
        <div className="mt-3 flex flex-wrap gap-2 items-center text-sm">
          <span className="text-slate-500">선택된 기업:</span>
          <span className="font-semibold text-blue-700">{selectedCompany.corp_name}</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-xs">
            고유번호 {selectedCompany.corp_code}
          </span>
          {selectedCompany.stock_code && (
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono text-xs">
              종목코드 {selectedCompany.stock_code}
            </span>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-slate-400 text-center">
        {loading ? '로딩 중...' : `총 ${corps.length.toLocaleString()}개 기업 검색 가능`}
      </p>
    </div>
  );
}
