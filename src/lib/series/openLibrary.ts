export interface OLSearchDoc {
  key: string
  title: string
  author_name?: string[]
  isbn?: string[]
  series?: string[]
  series_number?: string[]
  first_publish_year?: number
  cover_i?: number
}

export interface OLSearchResult {
  numFound: number
  docs: OLSearchDoc[]
}

export interface BookSearchHit {
  id: string
  title: string
  authors: string[]
  isbn13?: string
  coverUrl?: string
  seriesNumber?: number
  firstPublishYear?: number
}

const SEARCH_FIELDS =
  'key,title,author_name,isbn,series,series_number,first_publish_year,cover_i'

function pickIsbn13(isbns?: string[]): string | undefined {
  if (!isbns?.length) return undefined
  const normalized = isbns.map((i) => i.replace(/-/g, ''))
  return (
    normalized.find((i) => /^(978|979)\d{10}$/.test(i)) ??
    normalized.find((i) => i.length === 13)
  )
}

function coverUrlFromDoc(doc: OLSearchDoc): string | undefined {
  if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
  const isbn13 = pickIsbn13(doc.isbn)
  if (isbn13) return `https://covers.openlibrary.org/b/isbn/${isbn13}-M.jpg`
  return undefined
}

function docToSearchHit(doc: OLSearchDoc): BookSearchHit {
  const numStr = doc.series_number?.[0]
  const seriesNumber = numStr ? parseFloat(numStr) : undefined
  return {
    id: doc.key,
    title: doc.title,
    authors: doc.author_name ?? [],
    isbn13: pickIsbn13(doc.isbn),
    coverUrl: coverUrlFromDoc(doc),
    seriesNumber: seriesNumber != null && !isNaN(seriesNumber) ? seriesNumber : undefined,
    firstPublishYear: doc.first_publish_year,
  }
}

export async function searchOpenLibrary(query: {
  title?: string
  author?: string
  isbn?: string
  limit?: number
}): Promise<OLSearchDoc[]> {
  const params = new URLSearchParams()
  if (query.isbn?.trim()) {
    params.set('isbn', query.isbn.trim())
  } else {
    if (query.title?.trim()) params.set('title', query.title.trim())
    if (query.author?.trim()) params.set('author', query.author.trim())
  }
  params.set('fields', SEARCH_FIELDS)
  params.set('limit', String(query.limit ?? 5))

  const url = `https://openlibrary.org/search.json?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data: OLSearchResult = await res.json()
  return data.docs ?? []
}

export async function searchBooks(query: {
  title?: string
  author?: string
  isbn?: string
}): Promise<BookSearchHit[]> {
  const hasQuery = Boolean(query.title?.trim() || query.author?.trim() || query.isbn?.trim())
  if (!hasQuery) return []

  const docs = await searchOpenLibrary({ ...query, limit: 10 })
  return docs.map(docToSearchHit)
}

export interface SeriesSuggestion {
  seriesName: string
  seriesNumber?: number
  totalKnown: number
}

export async function getSeriesSuggestion(
  title: string,
  author: string,
  isbn?: string,
): Promise<SeriesSuggestion | null> {
  const docs = await searchOpenLibrary({ title, author, isbn })

  for (const doc of docs) {
    if (doc.series && doc.series.length > 0) {
      const seriesName = doc.series[0]
      const numStr = doc.series_number?.[0]
      const seriesNumber = numStr ? parseFloat(numStr) : undefined
      return {
        seriesName,
        seriesNumber: isNaN(seriesNumber ?? NaN) ? undefined : seriesNumber,
        totalKnown: doc.series.length,
      }
    }
  }
  return null
}
