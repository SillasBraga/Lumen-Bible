import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { fallbackBooks, licensedContentNotice, translations, type TranslationId } from './data/bible';
import {
  fetchOfficialBibleChapter,
  fetchOfficialBibleBooks,
  fetchOfficialBibleChapters,
  hasOfficialBibleProxy,
  type OfficialBibleBook,
  type OfficialBibleChapter,
  type OfficialBibleChapterRef,
} from './services/officialBible';

type Theme = 'light' | 'dark';
type ReadingMode = 'single' | 'split';

type ReaderPrefs = {
  theme: Theme;
  primaryTranslation: TranslationId;
  secondaryTranslation: TranslationId;
  bilingual: boolean;
  readingMode: ReadingMode;
  fontScale: number;
  lineHeight: number;
};

type AnnotationMap = Record<string, string>;
type HighlightMap = Record<string, boolean>;
type FavoriteMap = Record<string, boolean>;

const STORAGE_KEYS = {
  prefs: 'lumenbible:prefs',
  notes: 'lumenbible:notes',
  highlights: 'lumenbible:highlights',
  favorites: 'lumenbible:favorites',
};

const defaultPrefs: ReaderPrefs = {
  theme: 'dark',
  primaryTranslation: 'nvt',
  secondaryTranslation: 'nlt',
  bilingual: true,
  readingMode: 'single',
  fontScale: 1.08,
  lineHeight: 2,
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getTranslation(id: TranslationId) {
  return translations.find((translation) => translation.id === id) ?? translations[0];
}

function normalizeChapterNumber(chapterId: string) {
  const lastPart = chapterId.split('.').pop() ?? '1';
  return Number(lastPart);
}

function App() {
  const [prefs, setPrefs] = useState<ReaderPrefs>(() => readStorage(STORAGE_KEYS.prefs, defaultPrefs));
  const [selectedBookId, setSelectedBookId] = useState('GEN');
  const [selectedChapterId, setSelectedChapterId] = useState('GEN.1');
  const [selectedVerse, setSelectedVerse] = useState(1);
  const [notes, setNotes] = useState<AnnotationMap>(() => readStorage(STORAGE_KEYS.notes, {}));
  const [highlights, setHighlights] = useState<HighlightMap>(() => readStorage(STORAGE_KEYS.highlights, {}));
  const [favorites, setFavorites] = useState<FavoriteMap>(() => readStorage(STORAGE_KEYS.favorites, {}));
  const [search, setSearch] = useState('');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [books, setBooks] = useState<OfficialBibleBook[]>([]);
  const [chapters, setChapters] = useState<OfficialBibleChapterRef[]>([]);
  const [primaryChapter, setPrimaryChapter] = useState<OfficialBibleChapter | null>(null);
  const [secondaryChapter, setSecondaryChapter] = useState<OfficialBibleChapter | null>(null);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isLoadingChapter, setIsLoadingChapter] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [chapterError, setChapterError] = useState('');

  const primaryTranslation = useMemo(() => getTranslation(prefs.primaryTranslation), [prefs.primaryTranslation]);
  const secondaryTranslation = useMemo(() => getTranslation(prefs.secondaryTranslation), [prefs.secondaryTranslation]);
  const proxyEnabled = hasOfficialBibleProxy();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefs.theme === 'dark');
    writeStorage(STORAGE_KEYS.prefs, prefs);
  }, [prefs]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.notes, notes);
  }, [notes]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.highlights, highlights);
  }, [highlights]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.favorites, favorites);
  }, [favorites]);

  useEffect(() => {
    if (!proxyEnabled) {
      setBooks(
        fallbackBooks.map((book) => ({
          id: book.id,
          name: book.name,
          abbreviation: book.id,
        })),
      );
      setCatalogError('O proxy oficial nao esta ativo. Inicie `npm run proxy:api-bible` para carregar a Biblia real.');
      return;
    }

    let cancelled = false;

    async function loadBooks() {
      setIsLoadingBooks(true);
      setCatalogError('');

      try {
        const bookList = await fetchOfficialBibleBooks(primaryTranslation.officialBibleId);
        if (cancelled) {
          return;
        }

        setBooks(bookList);

        if (!bookList.some((book) => book.id === selectedBookId) && bookList[0]) {
          setSelectedBookId(bookList[0].id);
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError(error instanceof Error ? error.message : 'Falha ao carregar livros.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBooks(false);
        }
      }
    }

    void loadBooks();

    return () => {
      cancelled = true;
    };
  }, [primaryTranslation.officialBibleId, proxyEnabled, selectedBookId]);

  useEffect(() => {
    if (!proxyEnabled) {
      const fallbackBook = fallbackBooks.find((book) => book.id === selectedBookId) ?? fallbackBooks[0];
      const fallbackChapterIds = fallbackBook.chapters.map((chapterNumber) => ({
        id: `${fallbackBook.id}.${chapterNumber}`,
        number: String(chapterNumber),
        reference: `${fallbackBook.name} ${chapterNumber}`,
      }));
      setChapters(fallbackChapterIds);
      if (!fallbackChapterIds.some((chapter) => chapter.id === selectedChapterId) && fallbackChapterIds[0]) {
        setSelectedChapterId(fallbackChapterIds[0].id);
      }
      return;
    }

    let cancelled = false;

    async function loadChapters() {
      setCatalogError('');

      try {
        const chapterList = await fetchOfficialBibleChapters(primaryTranslation.officialBibleId, selectedBookId);
        if (cancelled) {
          return;
        }

        setChapters(chapterList);

        if (!chapterList.some((chapter) => chapter.id === selectedChapterId) && chapterList[0]) {
          setSelectedChapterId(chapterList[0].id);
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError(error instanceof Error ? error.message : 'Falha ao carregar capitulos.');
        }
      }
    }

    void loadChapters();

    return () => {
      cancelled = true;
    };
  }, [primaryTranslation.officialBibleId, proxyEnabled, selectedBookId, selectedChapterId]);

  useEffect(() => {
    if (!proxyEnabled) {
      setPrimaryChapter(null);
      setSecondaryChapter(null);
      return;
    }

    let cancelled = false;

    async function loadChapterContent() {
      setIsLoadingChapter(true);
      setChapterError('');

      try {
        const requests = [
          fetchOfficialBibleChapter(primaryTranslation.officialBibleId, selectedChapterId),
          prefs.bilingual || prefs.readingMode === 'split'
            ? fetchOfficialBibleChapter(secondaryTranslation.officialBibleId, selectedChapterId)
            : Promise.resolve(null),
        ] as const;

        const [primaryResult, secondaryResult] = await Promise.all(requests);
        if (cancelled) {
          return;
        }

        setPrimaryChapter(primaryResult);
        setSecondaryChapter(secondaryResult);
      } catch (error) {
        if (!cancelled) {
          setChapterError(error instanceof Error ? error.message : 'Falha ao carregar capitulo.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingChapter(false);
        }
      }
    }

    void loadChapterContent();

    return () => {
      cancelled = true;
    };
  }, [
    prefs.bilingual,
    prefs.readingMode,
    primaryTranslation.officialBibleId,
    secondaryTranslation.officialBibleId,
    proxyEnabled,
    selectedChapterId,
  ]);

  const currentBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? books[0] ?? { id: 'GEN', name: 'Genesis' },
    [books, selectedBookId],
  );

  const currentChapterRef = useMemo(
    () =>
      chapters.find((chapter) => chapter.id === selectedChapterId) ??
      chapters[0] ?? {
        id: selectedChapterId,
        number: String(normalizeChapterNumber(selectedChapterId)),
        reference: selectedChapterId,
      },
    [chapters, selectedChapterId],
  );

  const primaryVerses = primaryChapter?.verses ?? [];
  const secondaryVerses = secondaryChapter?.verses ?? [];

  const filteredVerses = useMemo(() => {
    if (!search.trim()) {
      return primaryVerses;
    }

    return primaryVerses.filter((verse) => verse.text.toLowerCase().includes(search.toLowerCase()));
  }, [primaryVerses, search]);

  useEffect(() => {
    if (filteredVerses[0]) {
      setSelectedVerse(filteredVerses[0].number);
    }
  }, [selectedChapterId, filteredVerses]);

  const selectedVerseData = useMemo(
    () => primaryVerses.find((verse) => verse.number === selectedVerse) ?? primaryVerses[0] ?? null,
    [primaryVerses, selectedVerse],
  );

  const selectedParallelVerse = useMemo(
    () => secondaryVerses.find((verse) => verse.number === selectedVerse) ?? secondaryVerses[0] ?? null,
    [secondaryVerses, selectedVerse],
  );

  const selectedVerseKey = `${selectedChapterId}-${selectedVerse}`;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-6">
        <header className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted">Lumen Bible</p>
            <h1 className="mt-1 font-display text-2xl text-text sm:text-3xl">Leitura viva, limpa e aberta.</h1>
          </div>
          <button
            type="button"
            aria-label={prefs.theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            onClick={() =>
              setPrefs((current) => ({ ...current, theme: current.theme === 'light' ? 'dark' : 'light' }))
            }
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line/70 bg-panel/70 text-muted transition hover:border-accent hover:text-text"
          >
            {prefs.theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        <div className="grid gap-4 xl:grid-cols-[72px_minmax(0,1fr)_72px]">
          <aside className="hidden xl:block">
            <div className="sticky top-4 flex flex-col gap-3">
              <SideRailButton active={leftOpen} label="Texto" onClick={() => setLeftOpen((value) => !value)}>
                <BookIcon />
              </SideRailButton>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3 xl:hidden">
              <button
                type="button"
                onClick={() => setLeftOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-panel/70 px-4 py-2 text-sm text-muted"
              >
                <BookIcon />
                Texto
              </button>
              <button
                type="button"
                onClick={() => setRightOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-panel/70 px-4 py-2 text-sm text-muted"
              >
                <NoteIcon />
                Estudo
              </button>
            </div>

            <section className="reader-surface overflow-hidden rounded-[34px] px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
              <div className="mx-auto max-w-4xl">
                <div className="border-b border-line/50 pb-6">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-muted">
                    {currentBook.name} {currentChapterRef.number}
                  </p>
                  <h2 className="mt-3 font-display text-4xl leading-tight text-text sm:text-5xl">
                    {currentChapterRef.reference}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                    {primaryTranslation.label} como texto principal, com comparacao em {secondaryTranslation.label}.
                  </p>
                </div>

                {catalogError && <MessageBox tone="warning">{catalogError}</MessageBox>}
                {chapterError && <MessageBox tone="error">{chapterError}</MessageBox>}
                {isLoadingBooks && <MessageBox tone="info">Carregando livros oficiais...</MessageBox>}
                {isLoadingChapter && <MessageBox tone="info">Carregando capitulo oficial...</MessageBox>}

                <div className="reader-scroll mt-8 max-h-[74vh] overflow-y-auto pr-1">
                  {primaryVerses.length > 0 ? (
                    <VerseReader
                      verses={filteredVerses}
                      parallelVerses={secondaryVerses}
                      prefs={prefs}
                      selectedVerse={selectedVerse}
                      onSelectVerse={setSelectedVerse}
                      highlights={highlights}
                      favorites={favorites}
                      chapterKey={selectedChapterId}
                    />
                  ) : (
                    <div className="py-10 text-sm text-muted">
                      Nenhum verso carregado ainda. Abra o proxy e selecione um capitulo para iniciar a leitura oficial.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </main>

          <aside className="hidden xl:block">
            <div className="sticky top-4 flex flex-col items-end gap-3">
              <SideRailButton active={rightOpen} label="Estudo" onClick={() => setRightOpen((value) => !value)}>
                <NoteIcon />
              </SideRailButton>
            </div>
          </aside>
        </div>

        {(leftOpen || rightOpen) && (
          <button
            type="button"
            aria-label="Fechar paineis"
            onClick={() => {
              setLeftOpen(false);
              setRightOpen(false);
            }}
            className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[2px]"
          />
        )}

        <PanelShell side="left" open={leftOpen} onClose={() => setLeftOpen(false)} title="Texto e leitura">
          <div className="space-y-5">
            <PanelSection title="Navegacao">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">Livro</span>
                <SelectField
                  value={selectedBookId}
                  onChange={setSelectedBookId}
                  options={books.map((book) => ({
                    value: book.id,
                    label: book.name,
                  }))}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">Capitulo</span>
                <SelectField
                  value={selectedChapterId}
                  onChange={setSelectedChapterId}
                  options={chapters.map((chapter) => ({
                    value: chapter.id,
                    label: chapter.number,
                  }))}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">Buscar</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Palavra ou expressao"
                  className="field"
                />
              </label>
            </PanelSection>

            <PanelSection title="Versoes oficiais">
              <button
                type="button"
                onClick={() => setPrefs((current) => ({ ...current, bilingual: !current.bilingual }))}
                className={`w-full rounded-2xl px-4 py-3 text-sm transition ${
                  prefs.bilingual ? 'bg-accent text-white' : 'border border-line/70 bg-panel/70 text-muted hover:text-text'
                }`}
              >
                {prefs.bilingual ? 'Bilingue ativado' : 'Somente uma versao'}
              </button>

              <SelectTranslation
                label="Principal"
                value={prefs.primaryTranslation}
                onChange={(value) => setPrefs((current) => ({ ...current, primaryTranslation: value }))}
              />
              <SelectTranslation
                label="Paralela"
                value={prefs.secondaryTranslation}
                onChange={(value) => setPrefs((current) => ({ ...current, secondaryTranslation: value }))}
              />
            </PanelSection>

            <PanelSection title="Leitura">
              <div className="flex flex-wrap gap-2">
                <ToggleChip
                  active={prefs.readingMode === 'single'}
                  label="Fluxo"
                  onClick={() => setPrefs((current) => ({ ...current, readingMode: 'single' }))}
                />
                <ToggleChip
                  active={prefs.readingMode === 'split'}
                  label="Lado a lado"
                  onClick={() => setPrefs((current) => ({ ...current, readingMode: 'split', bilingual: true }))}
                />
              </div>

              <SliderControl
                label="Tamanho"
                min={0.95}
                max={1.4}
                step={0.01}
                value={prefs.fontScale}
                valueLabel={`${Math.round(prefs.fontScale * 100)}%`}
                onChange={(value) => setPrefs((current) => ({ ...current, fontScale: value }))}
              />

              <SliderControl
                label="Espacamento"
                min={1.6}
                max={2.3}
                step={0.1}
                value={prefs.lineHeight}
                valueLabel={prefs.lineHeight.toFixed(1)}
                onChange={(value) => setPrefs((current) => ({ ...current, lineHeight: value }))}
              />
            </PanelSection>
          </div>
        </PanelShell>

        <PanelShell side="right" open={rightOpen} onClose={() => setRightOpen(false)} title="Estudo do verso">
          <div className="space-y-5">
            <PanelSection title={`Verso ${selectedVerse}`}>
              <div className="rounded-[22px] bg-panel/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{primaryTranslation.label}</p>
                <p className="mt-3 font-body text-lg leading-8 text-text">{selectedVerseData?.text ?? '-'}</p>
              </div>

              {prefs.bilingual && selectedParallelVerse && (
                <div className="rounded-[22px] bg-soft/45 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{secondaryTranslation.label}</p>
                  <p className="mt-3 font-body text-base leading-8 text-text">{selectedParallelVerse.text}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFavorites((current) => ({ ...current, [selectedVerseKey]: !current[selectedVerseKey] }))}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    favorites[selectedVerseKey] ? 'bg-accent text-white' : 'border border-line/70 text-muted hover:text-text'
                  }`}
                >
                  {favorites[selectedVerseKey] ? 'Favorito' : 'Favoritar'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHighlights((current) => ({ ...current, [selectedVerseKey]: !current[selectedVerseKey] }))
                  }
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    highlights[selectedVerseKey]
                      ? 'bg-accent2 text-slate-950'
                      : 'border border-line/70 text-muted hover:text-text'
                  }`}
                >
                  {highlights[selectedVerseKey] ? 'Destacado' : 'Destacar'}
                </button>
              </div>
            </PanelSection>

            <PanelSection title="Anotacao">
              <p className="text-sm leading-7 text-muted">
                Compare a leitura fluida da NVT com a naturalidade da NLT e a literalidade da NASB 1995.
              </p>

              <textarea
                value={notes[selectedVerseKey] ?? ''}
                onChange={(event) =>
                  setNotes((current) => ({
                    ...current,
                    [selectedVerseKey]: event.target.value,
                  }))
                }
                placeholder="Anote oracao, aplicacao ou vocabulario..."
                className="min-h-56 w-full rounded-[22px] border border-line/70 bg-panel/75 px-4 py-4 text-sm leading-7 text-text outline-none placeholder:text-muted focus:border-accent"
              />
            </PanelSection>

            <p className="text-xs leading-6 text-muted">
              {licensedContentNotice}
              {primaryChapter?.copyright ? ` ${primaryChapter.copyright}` : ''}
            </p>
          </div>
        </PanelShell>
      </div>
    </div>
  );
}

type VerseReaderProps = {
  verses: Array<{ number: number; text: string }>;
  parallelVerses: Array<{ number: number; text: string }>;
  prefs: ReaderPrefs;
  selectedVerse: number;
  onSelectVerse: (verse: number) => void;
  highlights: HighlightMap;
  favorites: FavoriteMap;
  chapterKey: string;
};

function VerseReader({
  verses,
  parallelVerses,
  prefs,
  selectedVerse,
  onSelectVerse,
  highlights,
  favorites,
  chapterKey,
}: VerseReaderProps) {
  if (prefs.bilingual && prefs.readingMode === 'split') {
    return (
      <div className="grid gap-10 lg:grid-cols-2">
        <FlowColumn
          verses={verses}
          selectedVerse={selectedVerse}
          onSelectVerse={onSelectVerse}
          highlights={highlights}
          favorites={favorites}
          chapterKey={chapterKey}
          fontScale={prefs.fontScale}
          lineHeight={prefs.lineHeight}
        />
        <FlowColumn
          verses={parallelVerses}
          selectedVerse={selectedVerse}
          onSelectVerse={onSelectVerse}
          highlights={highlights}
          favorites={favorites}
          chapterKey={chapterKey}
          fontScale={prefs.fontScale * 0.95}
          lineHeight={prefs.lineHeight}
          quiet
        />
      </div>
    );
  }

  return (
    <FlowColumn
      verses={verses}
      selectedVerse={selectedVerse}
      onSelectVerse={onSelectVerse}
      highlights={highlights}
      favorites={favorites}
      chapterKey={chapterKey}
      fontScale={prefs.fontScale}
      lineHeight={prefs.lineHeight}
    />
  );
}

type FlowColumnProps = {
  verses: Array<{ number: number; text: string }>;
  selectedVerse: number;
  onSelectVerse: (verse: number) => void;
  highlights: HighlightMap;
  favorites: FavoriteMap;
  chapterKey: string;
  fontScale: number;
  lineHeight: number;
  quiet?: boolean;
};

function FlowColumn({
  verses,
  selectedVerse,
  onSelectVerse,
  highlights,
  favorites,
  chapterKey,
  fontScale,
  lineHeight,
  quiet = false,
}: FlowColumnProps) {
  return (
    <div
      className={`reader-copy ${quiet ? 'text-muted/88' : 'text-text'}`}
      style={{ fontSize: `${fontScale * 1.22}rem`, lineHeight }}
    >
      {verses.map((verse) => {
        const verseKey = `${chapterKey}-${verse.number}`;
        const isSelected = verse.number === selectedVerse;
        const isHighlighted = Boolean(highlights[verseKey]);
        const isFavorited = Boolean(favorites[verseKey]);

        return (
          <span
            key={verse.number}
            onClick={() => onSelectVerse(verse.number)}
            className={`verse-inline ${isSelected ? 'is-selected' : ''} ${isHighlighted ? 'is-highlighted' : ''} ${
              isFavorited ? 'is-favorited' : ''
            }`}
          >
            <sup className="verse-number">{verse.number}</sup>
            {verse.text}{' '}
          </span>
        );
      })}
    </div>
  );
}

function MessageBox({ children, tone }: { children: ReactNode; tone: 'info' | 'warning' | 'error' }) {
  const toneClass =
    tone === 'error'
      ? 'border-rose-400/30 bg-rose-400/10 text-rose-100'
      : tone === 'warning'
        ? 'border-amber-400/30 bg-amber-400/10 text-amber-100'
        : 'border-sky-400/30 bg-sky-400/10 text-sky-100';

  return <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>{children}</div>;
}

function PanelShell({
  side,
  open,
  onClose,
  title,
  children,
}: {
  side: 'left' | 'right';
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <aside
      className={`fixed bottom-4 top-4 z-40 w-[340px] max-w-[calc(100vw-2rem)] rounded-[32px] border border-line/60 bg-panel/88 p-5 backdrop-blur-xl transition duration-300 ${
        side === 'left'
          ? `${open ? 'left-4 translate-x-0' : '-translate-x-[120%] left-4'}`
          : `${open ? 'right-4 translate-x-0' : 'translate-x-[120%] right-4'}`
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="font-display text-2xl text-text">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line/70 text-muted transition hover:border-accent hover:text-text"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="reader-scroll flex-1 overflow-y-auto pr-1">{children}</div>
      </div>
    </aside>
  );
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-[24px] bg-soft/28 p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-muted">{title}</p>
      {children}
    </section>
  );
}

function SideRailButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border transition ${
        active ? 'border-accent bg-accent text-white' : 'border-line/70 bg-panel/70 text-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}

function ToggleChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm transition ${
        active ? 'bg-accent text-white' : 'border border-line/70 bg-panel/70 text-muted hover:text-text'
      }`}
    >
      {label}
    </button>
  );
}

function SliderControl({
  label,
  min,
  max,
  step,
  value,
  valueLabel,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  valueLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-[20px] bg-panel/60 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm text-muted">{label}</span>
        <span className="text-sm text-text">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[rgb(var(--accent))]"
      />
    </label>
  );
}

function SelectTranslation({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TranslationId;
  onChange: (value: TranslationId) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">{label}</span>
      <SelectField
        value={value}
        onChange={(nextValue) => onChange(nextValue as TranslationId)}
        options={translations.map((translation) => ({
          value: translation.id,
          label: `${translation.label} · ${translation.language === 'pt' ? 'Portugues' : 'English'}`,
        }))}
      />
      <p className="mt-2 text-xs leading-5 text-muted">{getTranslation(value).note}</p>
    </label>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="field flex items-center justify-between gap-3 pr-12 text-left"
      >
        <span className="truncate">{selected?.label ?? 'Selecione'}</span>
        <span className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted transition ${open ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar selecao"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
          />
          <div className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-[22px] border border-line/70 bg-panel/95 p-2 shadow-2xl backdrop-blur-xl">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center rounded-2xl px-3 py-3 text-left text-sm transition ${
                    active ? 'bg-accent text-white' : 'text-text hover:bg-soft/70'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 14.2A8.5 8.5 0 0 1 9.8 4a8.8 8.8 0 1 0 10.2 10.2Z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 0 5 23V4.5Z" />
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H19" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3.5h10A2.5 2.5 0 0 1 19.5 6v12A2.5 2.5 0 0 1 17 20.5H7A2.5 2.5 0 0 1 4.5 18V6A2.5 2.5 0 0 1 7 3.5Z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default App;
