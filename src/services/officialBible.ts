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

const proxyUrl = import.meta.env.VITE_OFFICIAL_BIBLE_PROXY_URL?.trim();

function getBaseUrl() {
  return proxyUrl || '/api/bible';
}

export function hasOfficialBibleProxy() {
  return true;
}

function buildUrl(pathname: string) {
  return new URL(`${getBaseUrl().replace(/\/$/, '')}${pathname}`, window.location.origin);
}

export async function fetchOfficialBibleChapter(bibleId: string, chapterId: string) {
  const url = buildUrl('/chapter');
  url.searchParams.set('bibleId', bibleId);
  url.searchParams.set('chapterId', chapterId);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao carregar capitulo oficial: ${response.status}`);
  }

  return (await response.json()) as OfficialBibleChapter;
}

export async function fetchOfficialBibleBooks(bibleId: string) {
  const url = buildUrl('/books');
  url.searchParams.set('bibleId', bibleId);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao carregar livros: ${response.status}`);
  }

  return (await response.json()) as OfficialBibleBook[];
}

export async function fetchOfficialBibleChapters(bibleId: string, bookId: string) {
  const url = buildUrl('/chapters');
  url.searchParams.set('bibleId', bibleId);
  url.searchParams.set('bookId', bookId);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao carregar capitulos: ${response.status}`);
  }

  return (await response.json()) as OfficialBibleChapterRef[];
}
