import { searchOpenLibraryBooks, OpenLibraryError } from '../series/openLibrary'
import { searchGoogleBooks, GoogleBooksError, isGoogleBooksConfigured } from './googleBooks'
import type { BookSearchHit, BookSearchQuery } from './types'

export { GoogleBooksError, isGoogleBooksConfigured } from './googleBooks'
export { OpenLibraryError } from '../series/openLibrary'
export type { BookSearchHit, BookSearchQuery } from './types'

export class BookSearchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BookSearchError'
  }
}

function dedupeHits(hits: BookSearchHit[]): BookSearchHit[] {
  const seen = new Set<string>()
  const unique: BookSearchHit[] = []

  for (const hit of hits) {
    const key =
      hit.isbn13 ??
      `${hit.title.toLowerCase()}|${(hit.authors[0] ?? '').toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(hit)
  }

  return unique.slice(0, 12)
}

function hasQuery(query: BookSearchQuery): boolean {
  return Boolean(query.title?.trim() || query.author?.trim() || query.isbn?.trim())
}

export async function searchBooksOnline(query: BookSearchQuery): Promise<BookSearchHit[]> {
  if (!hasQuery(query)) return []

  const tasks: Promise<BookSearchHit[]>[] = []

  if (isGoogleBooksConfigured()) {
    tasks.push(searchGoogleBooks(query))
  }
  tasks.push(searchOpenLibraryBooks(query))

  const settled = await Promise.allSettled(tasks)
  const hits: BookSearchHit[] = []
  const errors: string[] = []

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      hits.push(...result.value)
      continue
    }

    const reason = result.reason
    if (reason instanceof GoogleBooksError || reason instanceof OpenLibraryError) {
      errors.push(reason.message)
    } else if (reason instanceof Error) {
      errors.push(reason.message)
    }
  }

  const merged = dedupeHits(hits)
  if (merged.length === 0 && errors.length > 0) {
    throw new BookSearchError(errors.join(' '))
  }

  return merged
}
