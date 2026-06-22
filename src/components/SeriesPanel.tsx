import { useState } from 'react'
import type { Book } from '../types'
import { useLibrary } from '../context/LibraryContext'
import { getSeriesSuggestion, OpenLibraryError } from '../lib/series/openLibrary'
import styles from './SeriesPanel.module.css'

interface Props {
  book: Book
  onClose: () => void
}

export function SeriesPanel({ book, onClose }: Props) {
  const { series, saveBook, saveSeries, books } = useLibrary()
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<{
    seriesName: string
    seriesNumber?: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const bookSeries = book.seriesId ? series.find((s) => s.id === book.seriesId) : undefined
  const seriesBooks = bookSeries
    ? bookSeries.books
        .sort((a, b) => a.order - b.order)
        .map((sb) => ({
          seriesBook: sb,
          book: books.find((b) => b.id === sb.bookId),
        }))
    : []

  async function lookupSeries() {
    setLoading(true)
    setError(null)
    try {
      const result = await getSeriesSuggestion(
        book.title,
        book.authors[0] ?? '',
        book.isbn13,
      )
      if (result) {
        setSuggestion(result)
      } else {
        setError('No series found on Open Library for this book.')
      }
    } catch (e) {
      setError(
        e instanceof OpenLibraryError
          ? e.message
          : 'Failed to reach Open Library. Check your internet connection.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function applySuggestion() {
    if (!suggestion) return
    let targetSeries = series.find(
      (s) => s.name.toLowerCase() === suggestion.seriesName.toLowerCase(),
    )
    if (!targetSeries) {
      targetSeries = await saveSeries({ name: suggestion.seriesName })
    }
    await saveBook({
      ...book,
      seriesId: targetSeries.id,
      seriesNumber: suggestion.seriesNumber,
      updatedAt: new Date().toISOString(),
    })
    setSuggestion(null)
    onClose()
  }

  const nextInSeries =
    book.seriesNumber != null && bookSeries
      ? seriesBooks.find(
          (sb) =>
            sb.seriesBook.order > (book.seriesNumber ?? 0) &&
            sb.book?.status !== 'read',
        )
      : null

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>Series — {book.title}</h2>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        {bookSeries ? (
          <div className={styles.seriesInfo}>
            <p className={styles.seriesName}>{bookSeries.name}</p>
            <p className={styles.hint}>
              {book.seriesNumber != null
                ? `Book #${book.seriesNumber} in this series`
                : 'Position unknown'}
            </p>
            {seriesBooks.length > 0 && (
              <ol className={styles.bookList}>
                {seriesBooks.map(({ seriesBook, book: b }) => (
                  <li
                    key={seriesBook.bookId}
                    className={b?.id === book.id ? styles.current : undefined}
                    style={{ color: b?.status === 'read' ? 'var(--success)' : undefined }}
                  >
                    #{seriesBook.order} — {seriesBook.title}
                    {b?.status === 'read' && ' ✓'}
                  </li>
                ))}
              </ol>
            )}
            {nextInSeries && (
              <div className={styles.next}>
                <strong>Up next:</strong> #{nextInSeries.seriesBook.order} —{' '}
                {nextInSeries.seriesBook.title}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.noSeries}>
            <p>This book is not linked to any series yet.</p>
            <button
              className="btn-primary"
              onClick={lookupSeries}
              disabled={loading}
            >
              {loading ? 'Looking up…' : 'Look up on Open Library'}
            </button>
            {error && <p className={styles.error}>{error}</p>}
            {suggestion && (
              <div className={styles.suggestion}>
                <p>Found: <strong>{suggestion.seriesName}</strong>
                  {suggestion.seriesNumber != null && ` (Book #${suggestion.seriesNumber})`}
                </p>
                <div className={styles.suggestionActions}>
                  <button className="btn-primary" onClick={applySuggestion}>Apply</button>
                  <button className="btn-ghost" onClick={() => setSuggestion(null)}>Dismiss</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
