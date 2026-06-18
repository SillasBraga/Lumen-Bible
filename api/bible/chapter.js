import { fetchApiBible, parseVersesFromText, sendJson } from '../_lib/api-bible.js';

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
  const chapterId = request.query.chapterId;

  if (!bibleId || !chapterId) {
    sendJson(response, 400, { error: 'Parametros obrigatorios: bibleId e chapterId.' });
    return;
  }

  try {
    const payload = await fetchApiBible(`/bibles/${bibleId}/chapters/${chapterId}`, {
      'content-type': 'text',
      'include-notes': 'false',
      'include-titles': 'false',
      'include-chapter-numbers': 'false',
      'include-verse-numbers': 'true',
      'include-verse-spans': 'false',
    });

    const content = payload?.data?.content ?? '';

    sendJson(response, 200, {
      bibleId,
      chapterId,
      reference: payload?.data?.reference ?? chapterId,
      content,
      copyright: payload?.data?.copyright ?? '',
      verses: parseVersesFromText(content),
      raw: payload?.data ?? null,
    });
  } catch (error) {
    sendJson(response, 502, {
      error: error instanceof Error ? error.message : 'Falha ao consultar capitulo.',
    });
  }
}
