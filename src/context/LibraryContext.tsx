import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react'
import type { Book, Series, LibraryExport } from '../types'
import { IdbStorageProvider } from '../lib/storage'
import { nanoid } from '../lib/utils/nanoid'

const storage = new IdbStorageProvider()

interface LibraryState {
  books: Book[]
  series: Series[]
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'LOADED'; books: Book[]; series: Series[] }
  | { type: 'ERROR'; message: string }
  | { type: 'UPSERT_BOOK'; book: Book }
  | { type: 'DELETE_BOOK'; id: string }
  | { type: 'UPSERT_SERIES'; series: Series }
  | { type: 'DELETE_SERIES'; id: string }
  | { type: 'REPLACE_ALL'; books: Book[]; series: Series[] }

function reducer(state: LibraryState, action: Action): LibraryState {
  switch (action.type) {
    case 'LOADED':
      return { ...state, books: action.books, series: action.series, loading: false }
    case 'ERROR':
      return { ...state, error: action.message, loading: false }
    case 'UPSERT_BOOK': {
      const exists = state.books.findIndex((b) => b.id === action.book.id)
      const books =
        exists !== -1
          ? state.books.map((b) => (b.id === action.book.id ? action.book : b))
          : [...state.books, action.book]
      return { ...state, books }
    }
    case 'DELETE_BOOK':
      return { ...state, books: state.books.filter((b) => b.id !== action.id) }
    case 'UPSERT_SERIES': {
      const exists = state.series.findIndex((s) => s.id === action.series.id)
      const series =
        exists !== -1
          ? state.series.map((s) => (s.id === action.series.id ? action.series : s))
          : [...state.series, action.series]
      return { ...state, series }
    }
    case 'DELETE_SERIES':
      return { ...state, series: state.series.filter((s) => s.id !== action.id) }
    case 'REPLACE_ALL':
      return { ...state, books: action.books, series: action.series }
    default:
      return state
  }
}

interface LibraryContextValue extends LibraryState {
  saveBook: (book: Partial<Book> & { title: string; authors: string[] }) => Promise<Book>
  deleteBook: (id: string) => Promise<void>
  saveSeries: (series: Partial<Series> & { name: string }) => Promise<Series>
  deleteSeries: (id: string) => Promise<void>
  importLibrary: (data: LibraryExport, merge?: boolean) => Promise<void>
  exportLibrary: () => Promise<LibraryExport>
  replaceBooks: (books: Book[]) => Promise<void>
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    books: [],
    series: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    Promise.all([storage.getBooks(), storage.getSeries()])
      .then(([books, series]) => dispatch({ type: 'LOADED', books, series }))
      .catch((e: unknown) =>
        dispatch({ type: 'ERROR', message: e instanceof Error ? e.message : String(e) }),
      )
  }, [])

  const saveBook = useCallback(
    async (partial: Partial<Book> & { title: string; authors: string[] }): Promise<Book> => {
      const now = new Date().toISOString()
      const book: Book = {
        id: nanoid(),
        formats: [],
        status: 'owned',
        source: 'manual',
        createdAt: now,
        updatedAt: now,
        ...partial,
      }
      await storage.saveBook(book)
      dispatch({ type: 'UPSERT_BOOK', book })
      return book
    },
    [],
  )

  const deleteBook = useCallback(async (id: string) => {
    await storage.deleteBook(id)
    dispatch({ type: 'DELETE_BOOK', id })
  }, [])

  const saveSeries = useCallback(
    async (partial: Partial<Series> & { name: string }): Promise<Series> => {
      const series: Series = {
        id: nanoid(),
        books: [],
        ...partial,
      }
      await storage.saveSeries(series)
      dispatch({ type: 'UPSERT_SERIES', series })
      return series
    },
    [],
  )

  const deleteSeries = useCallback(async (id: string) => {
    await storage.deleteSeries(id)
    dispatch({ type: 'DELETE_SERIES', id })
  }, [])

  const importLibrary = useCallback(async (data: LibraryExport, merge = true) => {
    await storage.importLibrary(data, merge)
    const [books, series] = await Promise.all([storage.getBooks(), storage.getSeries()])
    dispatch({ type: 'REPLACE_ALL', books, series })
  }, [])

  const exportLibrary = useCallback(() => storage.exportLibrary(), [])

  const replaceBooks = useCallback(async (books: Book[]) => {
    const existing = await storage.exportLibrary()
    await storage.importLibrary({ ...existing, books }, false)
    dispatch({ type: 'REPLACE_ALL', books, series: existing.series })
  }, [])

  return (
    <LibraryContext.Provider
      value={{
        ...state,
        saveBook,
        deleteBook,
        saveSeries,
        deleteSeries,
        importLibrary,
        exportLibrary,
        replaceBooks,
      }}
    >
      {children}
    </LibraryContext.Provider>
  )
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used inside <LibraryProvider>')
  return ctx
}
