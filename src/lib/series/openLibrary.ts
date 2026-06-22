export interface OLSearchDoc {
  key: string
  title: string
  author_name?: string[]
  isbn?: string[]
  series?: string[]
  series_number?: string[]
  first_publish_year?: number
}

export interface OLSearchResult {
  numFound: number
  docs: OLSearchDoc[]
}

export async function searchOpenLibrary(query: {
  title?: string
  author?: string
  isbn?: string
}): Promise<OLSearchDoc[]> {
  const params = new URLSearchParams()
  if (query.isbn) {
    params.set('isbn', query.isbn)
  } else {
    if (query.title) params.set('title', query.title)
    if (query.author) params.set('author', query.author)
  }
  params.set('fields', 'key,title,author_name,isbn,series,series_number,first_publish_year')
  params.set('limit', '5')

  const url = `https://openlibrary.org/search.json?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) return []
  const data: OLSearchResult = await res.json()
  return data.docs ?? []
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
