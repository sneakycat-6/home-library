import type { Book, BookStatus } from '../../types'
import { nanoid } from '../utils/nanoid'

interface GoodreadsRow {
  Title: string
  Author: string
  'Author l-f': string
  'Additional Authors': string
  ISBN: string
  ISBN13: string
  'My Rating': string
  'Average Rating': string
  Publisher: string
  Binding: string
  'Number of Pages': string
  'Year Published': string
  'Original Publication Year': string
  'Date Read': string
  'Date Added': string
  Bookshelves: string
  'Bookshelves with positions': string
  'Exclusive Shelf': string
  'My Review': string
  Spoiler: string
  'Private Notes': string
  'Read Count': string
  'Owned Copies': string
}

function parseSimpleCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = splitCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] ?? '').trim()
    })
    rows.push(row)
  }
  return rows
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function mapShelfToStatus(shelf: string): BookStatus {
  switch (shelf.toLowerCase()) {
    case 'read':
      return 'read'
    case 'currently-reading':
      return 'reading'
    case 'to-read':
    default:
      return 'want-to-read'
  }
}

function cleanIsbn(raw: string): string | undefined {
  const cleaned = raw.replace(/[^0-9X]/g, '')
  return cleaned.length === 13 || cleaned.length === 10 ? cleaned : undefined
}

export interface ParseResult {
  books: Book[]
  skipped: number
}

export function parseGoodreadsCsv(csvText: string): ParseResult {
  const rows = parseSimpleCsv(csvText) as Partial<GoodreadsRow>[]
  const books: Book[] = []
  let skipped = 0

  for (const row of rows) {
    const title = row['Title']?.trim()
    const author = row['Author']?.trim()
    if (!title || !author) {
      skipped++
      continue
    }

    const additionalAuthors = row['Additional Authors']
      ?.split(',')
      .map((a) => a.trim())
      .filter(Boolean) ?? []
    const authors = [author, ...additionalAuthors]

    const isbn13 = cleanIsbn(row['ISBN13'] ?? '') ?? cleanIsbn(row['ISBN'] ?? '')
    const rating = parseInt(row['My Rating'] ?? '0', 10) || undefined
    const ratingValue = rating && rating > 0 ? rating : undefined
    const status = mapShelfToStatus(row['Exclusive Shelf'] ?? 'to-read')
    const finishedAt = row['Date Read'] ? new Date(row['Date Read']).toISOString() : undefined

    const now = new Date().toISOString()
    books.push({
      id: nanoid(),
      title,
      authors,
      isbn13,
      formats: [],
      status,
      rating: ratingValue,
      finishedAt: finishedAt && !isNaN(Date.parse(finishedAt)) ? finishedAt : undefined,
      notes: row['Private Notes'] || undefined,
      source: 'goodreads',
      createdAt: now,
      updatedAt: now,
    })
  }

  return { books, skipped }
}

export function mergeGoodreadsImport(existing: Book[], incoming: Book[]): Book[] {
  const result = [...existing]

  for (const book of incoming) {
    const byIsbn =
      book.isbn13
        ? result.findIndex((b) => b.isbn13 === book.isbn13)
        : -1

    const byTitleAuthor = result.findIndex(
      (b) =>
        b.title.toLowerCase() === book.title.toLowerCase() &&
        b.authors[0]?.toLowerCase() === book.authors[0]?.toLowerCase(),
    )

    const existingIdx = byIsbn !== -1 ? byIsbn : byTitleAuthor

    if (existingIdx !== -1) {
      // Update status and rating from Goodreads but preserve manual edits
      const existing = result[existingIdx]
      result[existingIdx] = {
        ...existing,
        status: book.status !== 'want-to-read' ? book.status : existing.status,
        rating: book.rating ?? existing.rating,
        finishedAt: book.finishedAt ?? existing.finishedAt,
        isbn13: book.isbn13 ?? existing.isbn13,
        updatedAt: new Date().toISOString(),
      }
    } else {
      result.push(book)
    }
  }

  return result
}
