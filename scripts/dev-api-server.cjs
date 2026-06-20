/**
 * Local development API server that mimics Vercel serverless functions.
 * Uses native fetch (Node.js 18+).
 */
require('dotenv').config({ path: '.env.local' });
const http = require('http');
const { URL } = require('url');

const PORT = 3001;
const DART_BASE = 'https://opendart.fss.or.kr/api';
const GEMINI_MODELS = [
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
];

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function fmt(n) {
  if (!n || isNaN(n)) return '정보 없음';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `약 ${(n / 1e12).toFixed(1)}조`;
  if (abs >= 1e8) return `약 ${(n / 1e8).toFixed(0)}억`;
  if (abs >= 1e4) return `약 ${(n / 1e4).toFixed(0)}만`;
  return n.toLocaleString();
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const parsed = new URL(req.url, `http://localhost:${PORT}`);
  const path = parsed.pathname;

  if (path === '/api/dart') {
    const apiKey = process.env.DART_API_KEY;
    if (!apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'DART_API_KEY not set in .env.local' }));
      return;
    }

    const corp_code = parsed.searchParams.get('corp_code');
    const bsns_year = parsed.searchParams.get('bsns_year');
    const reprt_code = parsed.searchParams.get('reprt_code') || '11011';
    const endpoint = parsed.searchParams.get('endpoint') || 'fnlttSinglAcnt';

    if (!corp_code || !bsns_year) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'corp_code and bsns_year required' }));
      return;
    }

    const targetUrl = `${DART_BASE}/${endpoint}.json?crtfc_key=${apiKey}&corp_code=${corp_code}&bsns_year=${bsns_year}&reprt_code=${reprt_code}`;

    try {
      const response = await fetch(targetUrl);
      const data = await response.json();
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (e) {
      console.error('[DART error]', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e) }));
    }
    return;
  }

  if (path === '/api/gemini' && req.method === 'POST') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set in .env.local' }));
      return;
    }

    try {
      const body = await readBody(req);
      const { companyName, financialData } = body;
      if (!companyName || !financialData) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'companyName and financialData required' }));
        return;
      }

      const rows = financialData.map(d =>
        `${d.year}년: 매출액 ${fmt(d.revenue)}원, 영업이익 ${fmt(d.operatingProfit)}원, 순이익 ${fmt(d.netIncome)}원, 자산총계 ${fmt(d.totalAssets)}원, 부채총계 ${fmt(d.totalLiabilities)}원`
      ).join('\n');

      const prompt = `당신은 친절한 재무 분석 전문가입니다. 아래는 "${companyName}"의 최근 재무 데이터입니다.\n\n${rows}\n\n이 데이터를 바탕으로 **투자 경험이 전혀 없는 일반인**도 쉽게 이해할 수 있도록 다음 형식으로 분석해 주세요:\n\n1. **한 줄 요약**: 이 회사의 재무 상태를 한 문장으로 표현\n2. **잘하고 있는 점** (2-3가지, 구체적인 수치 언급)\n3. **주의해서 봐야 할 점** (1-2가지)\n4. **일반인을 위한 조언**: 이 기업에 대해 알아야 할 핵심 포인트\n\n전문 용어는 괄호 안에 쉬운 설명을 추가하고, 숫자는 "약 1조 원", "약 2,000억 원" 등 직관적으로 표현해 주세요. 마크다운 형식으로 작성해 주세요.`;

      const geminiBody = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 1500 },
      });

      let lastError = '';
      let analysisText = null;

      for (const modelUrl of GEMINI_MODELS) {
        const geminiResponse = await fetch(`${modelUrl}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: geminiBody,
        });
        const data = await geminiResponse.json();
        console.log(`[Gemini ${modelUrl.split('/').pop()}] status=${geminiResponse.status}`);
        if (geminiResponse.status === 429) {
          lastError = '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
          continue;
        }
        if (!geminiResponse.ok) {
          lastError = data.error?.message || `API 오류 (${geminiResponse.status})`;
          console.error('[Gemini error]', lastError);
          continue;
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) { analysisText = text; break; }
        lastError = '응답이 비어있습니다.';
      }

      if (analysisText) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ analysis: analysisText }));
      } else {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: lastError || 'Gemini API 호출 실패' }));
      }
    } catch (e) {
      console.error('[Gemini error]', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e) }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`✓ Dev API server running at http://localhost:${PORT}`);
  console.log('  /api/dart   - OpenDart proxy');
  console.log('  /api/gemini - Gemini proxy');
});
