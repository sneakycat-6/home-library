import type { Book } from '../types'
import { useLibrary } from '../context/LibraryContext'
import styles from './BookCard.module.css'

const STATUS_LABEL: Record<string, string> = {
  owned: 'Owned',
  'want-to-read': 'Want to read',
  reading: 'Reading',
  read: 'Read',
}

const STATUS_COLOR: Record<string, string> = {
  owned: 'var(--accent)',
  'want-to-read': 'var(--text-muted)',
  reading: 'var(--warn)',
  read: 'var(--success)',
}

interface Props {
  book: Book
  onEdit: (book: Book) => void
}

export function BookCard({ book, onEdit }: Props) {
  const { deleteBook } = useLibrary()

  const stars = book.rating
    ? '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating)
    : null

  return (
    <div className={styles.card}>
      {book.coverUrl && (
        <img src={book.coverUrl} alt={book.title} className={styles.cover} loading="lazy" />
      )}
      <div className={styles.body}>
        <div className={styles.header}>
          <span
            className={styles.status}
            style={{ color: STATUS_COLOR[book.status] }}
          >
            {STATUS_LABEL[book.status]}
          </span>
          {book.formats.length > 0 && (
            <span className={styles.formats}>{book.formats.join(' · ')}</span>
          )}
        </div>
        <h3 className={styles.title}>{book.title}</h3>
        <p className={styles.authors}>{book.authors.join(', ')}</p>
        {stars && <p className={styles.rating}>{stars}</p>}
        {book.seriesNumber != null && (
          <p className={styles.series}>Series #{book.seriesNumber}</p>
        )}
      </div>
      <div className={styles.actions}>
        <button className="btn-ghost" onClick={() => onEdit(book)}>Edit</button>
        <button
          className="btn-danger"
          onClick={() => {
            if (confirm(`Delete "${book.title}"?`)) deleteBook(book.id)
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
