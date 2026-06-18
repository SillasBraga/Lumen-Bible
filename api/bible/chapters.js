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
  const bookId = request.query.bookId;

  if (!bibleId || !bookId) {
    sendJson(response, 400, { error: 'Parametros obrigatorios: bibleId e bookId.' });
    return;
  }

  try {
    const payload = await fetchApiBible(`/bibles/${bibleId}/books/${bookId}/chapters`);
    const chapters = (payload?.data ?? []).map((chapter) => ({
      id: chapter.id,
      number: chapter.number,
      reference: chapter.reference,
    }));
    sendJson(response, 200, chapters);
  } catch (error) {
    sendJson(response, 502, {
      error: error instanceof Error ? error.message : 'Falha ao consultar capitulos.',
    });
  }
}
