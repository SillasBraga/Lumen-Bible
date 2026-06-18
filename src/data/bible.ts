export type TranslationId = 'nvt' | 'nlt' | 'nasb';

export type Translation = {
  id: TranslationId;
  label: string;
  language: 'pt' | 'en';
  style: string;
  note: string;
  officialBibleId: string;
};

export type FallbackBook = {
  id: string;
  name: string;
  testament: 'AT' | 'NT';
  chapters: number[];
};

export const translations: Translation[] = [
  {
    id: 'nvt',
    label: 'NVT',
    language: 'pt',
    style: 'Portugues fluido',
    note: 'Versao principal recomendada para leitura natural em portugues.',
    officialBibleId: '41a6caa722a21d88-01',
  },
  {
    id: 'nlt',
    label: 'NLT',
    language: 'en',
    style: 'English natural',
    note: 'Par ideal para leitura bilingue e aprendizado pratico de ingles.',
    officialBibleId: 'd6e14a625393b4da-01',
  },
  {
    id: 'nasb',
    label: 'NASB 1995',
    language: 'en',
    style: 'English literal',
    note: 'Boa para comparacao mais literal e estudo de estrutura.',
    officialBibleId: 'b8ee27bcd1cae43a-01',
  },
];

export const fallbackBooks: FallbackBook[] = [
  { id: 'GEN', name: 'Genesis', testament: 'AT', chapters: [1] },
  { id: 'JHN', name: 'John', testament: 'NT', chapters: [1] },
];

export const licensedContentNotice =
  'Este app agora esta preparado para ler as versoes oficiais NVT, NLT e NASB 1995 via API.Bible.';
