import type { Book, Series, LibraryExport } from '../../types'

export interface StorageProvider {
  // Books
  getBooks(): Promise<Book[]>
  getBook(id: string): Promise<Book | undefined>
  saveBook(book: Book): Promise<void>
  deleteBook(id: string): Promise<void>

  // Series
  getSeries(): Promise<Series[]>
  getSeriesById(id: string): Promise<Series | undefined>
  saveSeries(series: Series): Promise<void>
  deleteSeries(id: string): Promise<void>

  // Bulk
  importLibrary(data: LibraryExport, merge?: boolean): Promise<void>
  exportLibrary(): Promise<LibraryExport>
}
