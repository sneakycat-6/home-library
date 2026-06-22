import type { BookSearchHit, BookSearchQuery } from './types'

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'
const REQUEST_TIMEOUT_MS = 20_000

export class GoogleBooksError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GoogleBooksError'
  }
}

interface GoogleIndustryIdentifier {
  type?: string
  identifier?: string
}

interface GoogleVolumeInfo {
  title?: string
  authors?: string[]
  industryIdentifiers?: GoogleIndustryIdentifier[]
  imageLinks?: {
    thumbnail?: string
    smallThumbnail?: string
  }
  publishedDate?: string
}

interface GoogleBooksVolume {
  id: string
  volumeInfo?: GoogleVolumeInfo
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolume[]
  error?: { message?: string }
}

function pickIsbn13(identifiers?: GoogleIndustryIdentifier[]): string | undefined {
  if (!identifiers?.length) return undefined
  const normalized = identifiers
    .map((id) => id.identifier?.replace(/-/g, '') ?? '')
    .filter(Boolean)
  return (
    normalized.find((i) => /^(978|979)\d{10}$/.test(i)) ??
    normalized.find((i) => i.length === 13)
  )
}

function coverUrlFromVolume(info: GoogleVolumeInfo): string | undefined {
  const raw = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail
  if (!raw) return undefined
  return raw.replace(/^http:/, 'https:').replace(/&zoom=\d+/, '&zoom=1')
}

function parsePublishYear(publishedDate?: string): number | undefined {
  if (!publishedDate) return undefined
  const year = parseInt(publishedDate.slice(0, 4), 10)
  return Number.isFinite(year) ? year : undefined
}

function buildGoogleQuery(query: BookSearchQuery): string {
  const isbn = query.isbn?.replace(/-/g, '').trim()
  if (isbn) return `isbn:${isbn}`

  const parts: string[] = []
  if (query.title?.trim()) parts.push(`intitle:${query.title.trim()}`)
  if (query.author?.trim()) parts.push(`inauthor:${query.author.trim()}`)
  return parts.join('+')
}

function volumeToHit(volume: GoogleBooksVolume): BookSearchHit | null {
  const info = volume.volumeInfo
  if (!info?.title?.trim()) return null

  return {
    id: `google:${volume.id}`,
    source: 'google',
    title: info.title.trim(),
    authors: info.authors ?? [],
    isbn13: pickIsbn13(info.industryIdentifiers),
    coverUrl: coverUrlFromVolume(info),
    firstPublishYear: parsePublishYear(info.publishedDate),
  }
}

export function isGoogleBooksConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_BOOKS_API_KEY?.trim())
}

export async function searchGoogleBooks(query: BookSearchQuery): Promise<BookSearchHit[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY?.trim()
  if (!apiKey) {
    throw new GoogleBooksError(
      'Google Books API key is not configured. Set VITE_GOOGLE_BOOKS_API_KEY.',
    )
  }

  const q = buildGoogleQuery(query)
  if (!q) return []

  const params = new URLSearchParams({
    q,
    maxResults: '10',
    printType: 'books',
    key: apiKey,
  })

  const res = await fetch(`${GOOGLE_BOOKS_API}?${params.toString()}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  const data = (await res.json()) as GoogleBooksResponse

  if (!res.ok) {
    throw new GoogleBooksError(
      data.error?.message ?? `Google Books request failed (${res.status}).`,
    )
  }

  return (data.items ?? [])
    .map(volumeToHit)
    .filter((hit): hit is BookSearchHit => hit != null)
}
