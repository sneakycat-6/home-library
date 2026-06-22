import { useState, type FormEvent } from 'react'
import type { Book, BookFormat, BookStatus } from '../types'
import { useLibrary } from '../context/LibraryContext'
import styles from './BookForm.module.css'

interface Props {
  initial?: Book
  onClose: () => void
}

const STATUSES: BookStatus[] = ['owned', 'want-to-read', 'reading', 'read']
const FORMATS: BookFormat[] = ['kindle', 'paper', 'both']

export function BookForm({ initial, onClose }: Props) {
  const { saveBook } = useLibrary()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [authors, setAuthors] = useState(initial?.authors.join(', ') ?? '')
  const [isbn13, setIsbn13] = useState(initial?.isbn13 ?? '')
  const [status, setStatus] = useState<BookStatus>(initial?.status ?? 'owned')
  const [formats, setFormats] = useState<BookFormat[]>(initial?.formats ?? [])
  const [rating, setRating] = useState<string>(String(initial?.rating ?? ''))
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [seriesNumber, setSeriesNumber] = useState<string>(
    initial?.seriesNumber != null ? String(initial.seriesNumber) : '',
  )
  const [saving, setSaving] = useState(false)

  function toggleFormat(f: BookFormat) {
    setFormats((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await saveBook({
        ...(initial ?? {}),
        title: title.trim(),
        authors: authors
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        isbn13: isbn13.trim() || undefined,
        status,
        formats,
        rating: rating ? parseInt(rating, 10) : undefined,
        notes: notes.trim() || undefined,
        seriesNumber: seriesNumber ? parseFloat(seriesNumber) : undefined,
        source: initial?.source ?? 'manual',
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formHeader}>
          <h2>{initial ? 'Edit book' : 'Add book'}</h2>
          <button type="button" className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        <label>
          Title *
          <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </label>

        <label>
          Author(s) <span className={styles.hint}>(comma-separated)</span>
          <input value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="Jane Doe, John Doe" />
        </label>

        <label>
          ISBN-13
          <input value={isbn13} onChange={(e) => setIsbn13(e.target.value)} placeholder="9781234567890" />
        </label>

        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as BookStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'want-to-read' ? 'Want to read' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className={styles.label}>Format</span>
          <div className={styles.chips}>
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                className={formats.includes(f) ? styles.chipActive : styles.chip}
                onClick={() => toggleFormat(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <label>
          Rating
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            <option value="">—</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)} ({n})
              </option>
            ))}
          </select>
        </label>

        <label>
          Series number
          <input
            type="number"
            min="0"
            step="0.1"
            value={seriesNumber}
            onChange={(e) => setSeriesNumber(e.target.value)}
            placeholder="e.g. 1 or 2.5"
          />
        </label>

        <label>
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>

        <div className={styles.formActions}>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving || !title.trim()}>
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Add book'}
          </button>
        </div>
      </form>
    </div>
  )
}
