import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_MODELS = [
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
  }

  const { companyName, financialData } = req.body;
  if (!companyName || !financialData) {
    return res.status(400).json({ error: 'companyName and financialData are required' });
  }

  const prompt = buildPrompt(companyName, financialData);

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1500 },
  });

  let lastError = '';
  for (const modelUrl of GEMINI_MODELS) {
    try {
      const response = await fetch(`${modelUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (response.status === 429) {
        lastError = '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
        continue;
      }
      if (!response.ok) {
        const err = await response.text();
        console.error('Gemini error:', err);
        lastError = `API 오류 (${response.status})`;
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = 'AI 응답이 비어 있습니다. (안전 필터 또는 API 오류)';
        continue;
      }
      return res.status(200).json({ analysis: text });
    } catch (err) {
      console.error('Gemini proxy error:', err);
      lastError = String(err);
    }
  }
  return res.status(502).json({ error: lastError || 'Gemini API 호출 실패' });
}

function buildPrompt(companyName: string, financialData: Record<string, unknown>[]): string {
  const rows = financialData
    .map((d: Record<string, unknown>) =>
      `${d.year}년: 매출액 ${fmt(d.revenue as number)}원, 영업이익 ${fmt(d.operatingProfit as number)}원, 순이익 ${fmt(d.netIncome as number)}원, 자산총계 ${fmt(d.totalAssets as number)}원, 부채총계 ${fmt(d.totalLiabilities as number)}원`
    )
    .join('\n');

  return `당신은 친절한 재무 분석 전문가입니다. 아래는 "${companyName}"의 최근 재무 데이터입니다.

${rows}

이 데이터를 바탕으로 **투자 경험이 전혀 없는 일반인**도 쉽게 이해할 수 있도록 다음 형식으로 분석해 주세요:

1. **한 줄 요약**: 이 회사의 재무 상태를 한 문장으로 표현
2. **잘하고 있는 점** (2-3가지, 구체적인 수치 언급)
3. **주의해서 봐야 할 점** (1-2가지)
4. **일반인을 위한 조언**: 이 기업에 대해 알아야 할 핵심 포인트

전문 용어는 괄호 안에 쉬운 설명을 추가하고, 숫자는 "약 1조 원", "약 2,000억 원" 등 직관적으로 표현해 주세요. 마크다운 형식으로 작성해 주세요.`;
}

function fmt(n: number): string {
  if (!n || isNaN(n)) return '정보 없음';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `약 ${(n / 1e12).toFixed(1)}조`;
  if (abs >= 1e8) return `약 ${(n / 1e8).toFixed(0)}억`;
  if (abs >= 1e4) return `약 ${(n / 1e4).toFixed(0)}만`;
  return n.toLocaleString();
}
