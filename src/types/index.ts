export interface CorpItem {
  corp_code: string;
  corp_name: string;
  corp_eng_name: string;
  stock_code: string;
  modify_date: string;
}

export interface DartFinancialItem {
  rcept_no: string;
  reprt_code: string;
  bsns_year: string;
  corp_code: string;
  sj_div: string;
  sj_nm: string;
  account_id: string;
  account_nm: string;
  account_detail: string;
  thstrm_nm: string;
  thstrm_amount: string;
  thstrm_add_amount: string;
  frmtrm_nm: string;
  frmtrm_amount: string;
  frmtrm_q_nm: string;
  frmtrm_q_amount: string;
  frmtrm_add_amount: string;
  bfefrmtrm_nm: string;
  bfefrmtrm_amount: string;
  ord: string;
  currency: string;
}

export interface DartResponse {
  status: string;
  message: string;
  list?: DartFinancialItem[];
}

export interface FinancialSummary {
  year: string;
  revenue: number;        // 매출액
  operatingProfit: number; // 영업이익
  netIncome: number;      // 당기순이익
  totalAssets: number;    // 자산총계
  totalLiabilities: number; // 부채총계
  totalEquity: number;    // 자본총계
}

export type ReportCode = '11011' | '11012' | '11013' | '11014';

export interface GeminiAnalysis {
  summary: string;
  strengths: string[];
  concerns: string[];
  advice: string;
}
