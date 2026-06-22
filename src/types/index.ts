export type BookFormat = 'kindle' | 'paper' | 'both'
export type BookStatus = 'owned' | 'want-to-read' | 'reading' | 'read'
export type BookSource = 'manual' | 'goodreads'

export interface Book {
  id: string
  title: string
  authors: string[]
  isbn13?: string
  formats: BookFormat[]
  status: BookStatus
  rating?: number        // 1–5
  startedAt?: string     // ISO date string
  finishedAt?: string    // ISO date string
  notes?: string
  seriesId?: string
  seriesNumber?: number
  source: BookSource
  coverUrl?: string
  createdAt: string
  updatedAt: string
}

export interface SeriesBook {
  bookId: string
  order: number
  title: string
}

export interface Series {
  id: string
  name: string
  books: SeriesBook[]
}

export interface LibraryExport {
  version: 1
  exportedAt: string
  books: Book[]
  series: Series[]
}
