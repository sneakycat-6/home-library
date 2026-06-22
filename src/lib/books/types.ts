export type BookSearchSource = 'google' | 'openlibrary'

export interface BookSearchHit {
  id: string
  source: BookSearchSource
  title: string
  authors: string[]
  isbn13?: string
  coverUrl?: string
  seriesNumber?: number
  firstPublishYear?: number
}

export interface BookSearchQuery {
  title?: string
  author?: string
  isbn?: string
}
