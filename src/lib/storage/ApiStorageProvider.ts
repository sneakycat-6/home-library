/**
 * Phase 2 stub — swap IdbStorageProvider for this once you have a backend.
 * Set VITE_API_URL=https://library.yourdomain.local at build time.
 */
import type { Book, Series, LibraryExport } from '../../types'
import type { StorageProvider } from './StorageProvider'

const BASE = import.meta.env.VITE_API_URL ?? ''

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export class ApiStorageProvider implements StorageProvider {
  getBooks = () => req<Book[]>('/api/books')
  getBook = (id: string) => req<Book>(`/api/books/${id}`)
  saveBook = (book: Book) =>
    req<void>(`/api/books/${book.id}`, { method: 'PUT', body: JSON.stringify(book) })
  deleteBook = (id: string) => req<void>(`/api/books/${id}`, { method: 'DELETE' })

  getSeries = () => req<Series[]>('/api/series')
  getSeriesById = (id: string) => req<Series>(`/api/series/${id}`)
  saveSeries = (series: Series) =>
    req<void>(`/api/series/${series.id}`, { method: 'PUT', body: JSON.stringify(series) })
  deleteSeries = (id: string) => req<void>(`/api/series/${id}`, { method: 'DELETE' })

  importLibrary = (data: LibraryExport) =>
    req<void>('/api/import', { method: 'POST', body: JSON.stringify(data) })
  exportLibrary = () => req<LibraryExport>('/api/export')
}
