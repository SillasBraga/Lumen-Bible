const upstreamBaseUrl = 'https://api.scripture.api.bible/v1';

export function sendJson(response, status, payload) {
  response.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.send(JSON.stringify(payload));
}

export function parseVersesFromText(content) {
  const normalized = String(content || '')
    .replace(/\r/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const bracketMatches = [...normalized.matchAll(/\[(\d{1,3})\]/g)];
  const matches = bracketMatches.length > 0 ? bracketMatches : [...normalized.matchAll(/(?:^|\s)(\d{1,3})(?=\s)/g)];

  if (matches.length === 0) {
    return [];
  }

  const verses = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? normalized.length : normalized.length;
    const text = normalized.slice(start, end).trim();

    if (text) {
      verses.push({ number: Number(match[1]), text });
    }
  }

  return verses;
}

export async function fetchApiBible(pathname, searchParams = {}) {
  const apiKey = process.env.API_BIBLE_KEY;

  if (!apiKey) {
    throw new Error('API_BIBLE_KEY nao configurada na Vercel.');
  }

  const upstreamUrl = new URL(`${upstreamBaseUrl}${pathname}`);

  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null && value !== '') {
      upstreamUrl.searchParams.set(key, String(value));
    }
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      'api-key': apiKey,
      accept: 'application/json',
    },
  });

  const rawText = await upstreamResponse.text();

  if (!upstreamResponse.ok) {
    throw new Error(`API.Bible respondeu ${upstreamResponse.status}: ${rawText}`);
  }

  return JSON.parse(rawText);
}
