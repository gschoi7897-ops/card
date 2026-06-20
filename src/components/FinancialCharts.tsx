import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, LineChart, ReferenceLine,
} from 'recharts';
import type { FinancialSummary } from '../types';

interface Props {
  data: FinancialSummary[];
}

function fmt(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(1)}조`;
  if (abs >= 1e8) return `${(value / 1e8).toFixed(0)}억`;
  if (abs >= 1e4) return `${(value / 1e4).toFixed(0)}만`;
  return value.toLocaleString();
}

const COLORS = {
  revenue: '#3b82f6',
  operatingProfit: '#10b981',
  netIncome: '#f59e0b',
  totalAssets: '#6366f1',
  totalLiabilities: '#ef4444',
  totalEquity: '#14b8a6',
};

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-slate-700 mb-2">{label}년</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-semibold text-slate-800">{fmt(p.value)}원</span>
        </div>
      ))}
    </div>
  );
};

const ProfitTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-slate-700 mb-2">{label}년</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-semibold text-slate-800">{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function FinancialCharts({ data }: Props) {
  if (!data.length) return null;

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];

  const revenueGrowth = prev?.revenue
    ? (((latest.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100).toFixed(1)
    : null;

  const operatingMargin = latest.revenue
    ? ((latest.operatingProfit / latest.revenue) * 100).toFixed(1)
    : null;

  const netMargin = latest.revenue
    ? ((latest.netIncome / latest.revenue) * 100).toFixed(1)
    : null;

  const debtRatio = latest.totalEquity
    ? ((latest.totalLiabilities / latest.totalEquity) * 100).toFixed(1)
    : null;

  const profitData = data.map(d => ({
    year: d.year,
    '영업이익률': d.revenue ? parseFloat(((d.operatingProfit / d.revenue) * 100).toFixed(2)) : 0,
    '순이익률': d.revenue ? parseFloat(((d.netIncome / d.revenue) * 100).toFixed(2)) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
          {latest.year}년 주요 지표
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="매출액"
            value={fmt(latest.revenue) + '원'}
            sub={revenueGrowth ? `전년 대비 ${revenueGrowth}%` : undefined}
            color={Number(revenueGrowth) >= 0 ? 'text-blue-600' : 'text-red-500'}
          />
          <StatCard
            label="영업이익"
            value={fmt(latest.operatingProfit) + '원'}
            sub={operatingMargin ? `영업이익률 ${operatingMargin}%` : undefined}
            color={latest.operatingProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}
          />
          <StatCard
            label="당기순이익"
            value={fmt(latest.netIncome) + '원'}
            sub={netMargin ? `순이익률 ${netMargin}%` : undefined}
            color={latest.netIncome >= 0 ? 'text-amber-600' : 'text-red-500'}
          />
          <StatCard
            label="부채비율"
            value={debtRatio ? `${debtRatio}%` : '-'}
            sub="부채÷자본 × 100"
            color={Number(debtRatio) < 100 ? 'text-teal-600' : Number(debtRatio) < 200 ? 'text-amber-600' : 'text-red-500'}
          />
        </div>
      </div>

      {/* Revenue & Profit Chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4">매출액 · 영업이익 · 순이익 추이</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tickFormatter={v => `${v}년`} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={70} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="revenue" name="매출액" fill={COLORS.revenue} radius={[4, 4, 0, 0]} />
            <Bar dataKey="operatingProfit" name="영업이익" fill={COLORS.operatingProfit} radius={[4, 4, 0, 0]} />
            <Line dataKey="netIncome" name="순이익" stroke={COLORS.netIncome} strokeWidth={2.5} dot={{ r: 4 }} type="monotone" />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Assets Structure */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-4">자산 · 부채 · 자본 구성</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tickFormatter={v => `${v}년`} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} width={70} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="totalAssets" name="자산총계" fill={COLORS.totalAssets} radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalLiabilities" name="부채총계" fill={COLORS.totalLiabilities} radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalEquity" name="자본총계" fill={COLORS.totalEquity} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profitability */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-700 mb-1">수익성 지표 추이</h3>
        <p className="text-xs text-slate-400 mb-4">매출 100원 중 이익으로 남는 금액의 비율</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={profitData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tickFormatter={v => `${v}년`} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} width={55} />
            <Tooltip content={<ProfitTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Line dataKey="영업이익률" stroke={COLORS.operatingProfit} strokeWidth={2.5} dot={{ r: 4 }} type="monotone" />
            <Line dataKey="순이익률" stroke={COLORS.netIncome} strokeWidth={2.5} dot={{ r: 4 }} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
