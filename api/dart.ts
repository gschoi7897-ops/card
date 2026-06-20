import type { VercelRequest, VercelResponse } from '@vercel/node';

const DART_BASE = 'https://opendart.fss.or.kr/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'DART_API_KEY not configured' });
  }

  const { corp_code, bsns_year, reprt_code = '11011', endpoint = 'fnlttSinglAcnt' } = req.query;

  if (!corp_code || !bsns_year) {
    return res.status(400).json({ error: 'corp_code and bsns_year are required' });
  }

  const allowed = ['fnlttSinglAcnt', 'fnlttSinglAcntAll'];
  if (!allowed.includes(endpoint as string)) {
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  try {
    const url = new URL(`${DART_BASE}/${endpoint}.json`);
    url.searchParams.set('crtfc_key', apiKey);
    url.searchParams.set('corp_code', corp_code as string);
    url.searchParams.set('bsns_year', bsns_year as string);
    url.searchParams.set('reprt_code', reprt_code as string);

    const response = await fetch(url.toString());
    if (!response.ok) {
      return res.status(502).json({ error: `DART API returned ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('DART proxy error:', err);
    return res.status(500).json({ error: 'Failed to fetch from DART API' });
  }
}
