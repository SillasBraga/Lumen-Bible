import http from 'node:http';
import fs from 'node:fs';
import { URL } from 'node:url';

function loadDotEnv() {
  const envPath = new URL('../.env', import.meta.url);
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const apiKey = process.env.API_BIBLE_KEY;
const port = Number(process.env.API_BIBLE_PORT || 8787);
const upstreamBaseUrl = 'https://api.scripture.api.bible/v1';

if (!apiKey) {
  console.error('API_BIBLE_KEY não configurada. Copie .env.example para .env e informe sua chave da API.Bible.');
  process.exit(1);
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function parseVersesFromText(content) {
  const normalized = content
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
    const verseNumber = Number(match[1]);
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? normalized.length : normalized.length;
    const text = normalized.slice(start, end).trim();

    if (text) {
      verses.push({ number: verseNumber, text });
    }
  }

  return verses;
}

async function fetchChapter({ bibleId, chapterId }) {
  const upstreamUrl = new URL(`${upstreamBaseUrl}/bibles/${bibleId}/chapters/${chapterId}`);
  upstreamUrl.searchParams.set('content-type', 'text');
  upstreamUrl.searchParams.set('include-notes', 'false');
  upstreamUrl.searchParams.set('include-titles', 'false');
  upstreamUrl.searchParams.set('include-chapter-numbers', 'false');
  upstreamUrl.searchParams.set('include-verse-numbers', 'true');
  upstreamUrl.searchParams.set('include-verse-spans', 'false');

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

  const payload = JSON.parse(rawText);
  const content = payload?.data?.content ?? '';

  return {
    bibleId,
    chapterId,
    reference: payload?.data?.reference ?? chapterId,
    content,
    copyright: payload?.data?.copyright ?? '',
    verses: parseVersesFromText(content),
    raw: payload?.data ?? null,
  };
}

async function fetchBooks(bibleId) {
  const upstreamUrl = new URL(`${upstreamBaseUrl}/bibles/${bibleId}/books`);
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

  const payload = JSON.parse(rawText);

  return (payload?.data ?? []).map((book) => ({
    id: book.id,
    name: book.name,
    abbreviation: book.abbreviation,
  }));
}

async function fetchChapters({ bibleId, bookId }) {
  const upstreamUrl = new URL(`${upstreamBaseUrl}/bibles/${bibleId}/books/${bookId}/chapters`);
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

  const payload = JSON.parse(rawText);

  return (payload?.data ?? []).map((chapter) => ({
    id: chapter.id,
    number: chapter.number,
    reference: chapter.reference,
  }));
}

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: 'Requisição inválida.' });
    return;
  }

  if (request.method === 'OPTIONS') {
    sendJson(response, 200, { ok: true });
    return;
  }

  const url = new URL(request.url, `http://localhost:${port}`);

  if (url.pathname === '/health') {
    sendJson(response, 200, { ok: true, upstream: 'API.Bible' });
    return;
  }

  if (url.pathname === '/chapter' && request.method === 'GET') {
    const bibleId = url.searchParams.get('bibleId');
    const chapterId = url.searchParams.get('chapterId');

    if (!bibleId || !chapterId) {
      sendJson(response, 400, { error: 'Parâmetros obrigatórios: bibleId e chapterId.' });
      return;
    }

    try {
      const chapter = await fetchChapter({ bibleId, chapterId });
      sendJson(response, 200, chapter);
      return;
    } catch (error) {
      sendJson(response, 502, {
        error: error instanceof Error ? error.message : 'Falha ao consultar API.Bible.',
      });
      return;
    }
  }

  if (url.pathname === '/books' && request.method === 'GET') {
    const bibleId = url.searchParams.get('bibleId');

    if (!bibleId) {
      sendJson(response, 400, { error: 'Parametro obrigatorio: bibleId.' });
      return;
    }

    try {
      const books = await fetchBooks(bibleId);
      sendJson(response, 200, books);
      return;
    } catch (error) {
      sendJson(response, 502, {
        error: error instanceof Error ? error.message : 'Falha ao consultar livros.',
      });
      return;
    }
  }

  if (url.pathname === '/chapters' && request.method === 'GET') {
    const bibleId = url.searchParams.get('bibleId');
    const bookId = url.searchParams.get('bookId');

    if (!bibleId || !bookId) {
      sendJson(response, 400, { error: 'Parametros obrigatorios: bibleId e bookId.' });
      return;
    }

    try {
      const chapters = await fetchChapters({ bibleId, bookId });
      sendJson(response, 200, chapters);
      return;
    } catch (error) {
      sendJson(response, 502, {
        error: error instanceof Error ? error.message : 'Falha ao consultar capitulos.',
      });
      return;
    }
  }

  sendJson(response, 404, { error: 'Rota não encontrada.' });
});

server.listen(port, () => {
  console.log(`API.Bible proxy disponível em http://localhost:${port}`);
});
