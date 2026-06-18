export type OfficialBibleChapter = {
  bibleId: string;
  chapterId: string;
  reference: string;
  content: string;
  copyright?: string;
  verses: Array<{
    number: number;
    text: string;
  }>;
};

export type OfficialBibleBook = {
  id: string;
  name: string;
  abbreviation?: string;
};

export type OfficialBibleChapterRef = {
  id: string;
  number: string;
  reference: string;
};

const proxyUrl = import.meta.env.VITE_OFFICIAL_BIBLE_PROXY_URL;

export function hasOfficialBibleProxy() {
  return Boolean(proxyUrl);
}

export async function fetchOfficialBibleChapter(bibleId: string, chapterId: string) {
  if (!proxyUrl) {
    throw new Error('VITE_OFFICIAL_BIBLE_PROXY_URL não configurada.');
  }

  const url = new URL('/chapter', proxyUrl);
  url.searchParams.set('bibleId', bibleId);
  url.searchParams.set('chapterId', chapterId);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao carregar capítulo oficial: ${response.status}`);
  }

  return (await response.json()) as OfficialBibleChapter;
}

export async function fetchOfficialBibleBooks(bibleId: string) {
  if (!proxyUrl) {
    throw new Error('VITE_OFFICIAL_BIBLE_PROXY_URL nao configurada.');
  }

  const url = new URL('/books', proxyUrl);
  url.searchParams.set('bibleId', bibleId);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao carregar livros: ${response.status}`);
  }

  return (await response.json()) as OfficialBibleBook[];
}

export async function fetchOfficialBibleChapters(bibleId: string, bookId: string) {
  if (!proxyUrl) {
    throw new Error('VITE_OFFICIAL_BIBLE_PROXY_URL nao configurada.');
  }

  const url = new URL('/chapters', proxyUrl);
  url.searchParams.set('bibleId', bibleId);
  url.searchParams.set('bookId', bookId);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao carregar capitulos: ${response.status}`);
  }

  return (await response.json()) as OfficialBibleChapterRef[];
}
