import { fetchApiBible, sendJson } from '../_lib/api-bible.js';

export default async function handler(request, response) {
  if (request.method === 'OPTIONS') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Metodo nao permitido.' });
    return;
  }

  const bibleId = request.query.bibleId;

  if (!bibleId) {
    sendJson(response, 400, { error: 'Parametro obrigatorio: bibleId.' });
    return;
  }

  try {
    const payload = await fetchApiBible(`/bibles/${bibleId}/books`);
    const books = (payload?.data ?? []).map((book) => ({
      id: book.id,
      name: book.name,
      abbreviation: book.abbreviation,
    }));
    sendJson(response, 200, books);
  } catch (error) {
    sendJson(response, 502, {
      error: error instanceof Error ? error.message : 'Falha ao consultar livros.',
    });
  }
}
