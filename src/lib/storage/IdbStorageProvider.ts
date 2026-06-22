import { openDB, type IDBPDatabase } from 'idb'
import type { Book, Series, LibraryExport } from '../../types'
import type { StorageProvider } from './StorageProvider'

const DB_NAME = 'home-library'
const DB_VERSION = 1

interface LibraryDB {
  books: {
    key: string
    value: Book
    indexes: { 'by-status': string; 'by-series': string }
  }
  series: {
    key: string
    value: Series
  }
}

async function getDb(): Promise<IDBPDatabase<LibraryDB>> {
  return openDB<LibraryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const bookStore = db.createObjectStore('books', { keyPath: 'id' })
      bookStore.createIndex('by-status', 'status')
      bookStore.createIndex('by-series', 'seriesId')
      db.createObjectStore('series', { keyPath: 'id' })
    },
  })
}

export class IdbStorageProvider implements StorageProvider {
  async getBooks(): Promise<Book[]> {
    const db = await getDb()
    return db.getAll('books')
  }

  async getBook(id: string): Promise<Book | undefined> {
    const db = await getDb()
    return db.get('books', id)
  }

  async saveBook(book: Book): Promise<void> {
    const db = await getDb()
    await db.put('books', book)
  }

  async deleteBook(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('books', id)
  }

  async getSeries(): Promise<Series[]> {
    const db = await getDb()
    return db.getAll('series')
  }

  async getSeriesById(id: string): Promise<Series | undefined> {
    const db = await getDb()
    return db.get('series', id)
  }

  async saveSeries(series: Series): Promise<void> {
    const db = await getDb()
    await db.put('series', series)
  }

  async deleteSeries(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('series', id)
  }

  async importLibrary(data: LibraryExport, merge = true): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['books', 'series'], 'readwrite')

    if (!merge) {
      await tx.objectStore('books').clear()
      await tx.objectStore('series').clear()
    }

    for (const book of data.books) {
      await tx.objectStore('books').put(book)
    }
    for (const series of data.series) {
      await tx.objectStore('series').put(series)
    }
    await tx.done
  }

  async exportLibrary(): Promise<LibraryExport> {
    const [books, series] = await Promise.all([this.getBooks(), this.getSeries()])
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      books,
      series,
    }
  }
}
