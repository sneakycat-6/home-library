import type { Book } from '../types'
import { useLibrary } from '../context/LibraryContext'
import styles from './SeriesPanel.module.css'

interface Props {
  book: Book
  onClose: () => void
}

export function SeriesPanel({ book, onClose }: Props) {
  const { series, books } = useLibrary()

  const bookSeries = book.seriesId ? series.find((s) => s.id === book.seriesId) : undefined
  const seriesBooks = bookSeries
    ? bookSeries.books
        .sort((a, b) => a.order - b.order)
        .map((sb) => ({
          seriesBook: sb,
          book: books.find((b) => b.id === sb.bookId),
        }))
    : []

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
            <p>This book is not linked to a series yet.</p>
            <p className={styles.hint}>
              Set a series number when editing the book, or link books to a series manually.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
