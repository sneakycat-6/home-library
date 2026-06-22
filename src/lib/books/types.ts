export interface BookSearchHit {
  id: string
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
