import { useState, useMemo } from 'react'
import { useLibrary } from './context/LibraryContext'
import { BookCard } from './components/BookCard'
import { BookForm } from './components/BookForm'
import { ImportDialog } from './components/ImportDialog'
import { SeriesPanel } from './components/SeriesPanel'
import type { Book, BookStatus, BookFormat } from './types'
import styles from './App.module.css'

const ALL = '__all__'

export function App() {
  const { books, loading } = useLibrary()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState(ALL)
  const [filterFormat, setFilterFormat] = useState(ALL)
  const [showForm, setShowForm] = useState(false)
  const [editBook, setEditBook] = useState<Book | undefined>()
  const [showImport, setShowImport] = useState(false)
  const [seriesBook, setSeriesBook] = useState<Book | undefined>()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return books.filter((b) => {
      if (filterStatus !== ALL && b.status !== filterStatus) return false
      if (filterFormat !== ALL && !b.formats.includes(filterFormat as BookFormat)) return false
      if (q && !b.title.toLowerCase().includes(q) && !b.authors.join(' ').toLowerCase().includes(q) && !(b.isbn13 ?? '').includes(q)) return false
      return true
    })
  }, [books, search, filterStatus, filterFormat])

  const counts: Record<string, number> = useMemo(() => {
    const c: Record<string, number> = { owned: 0, 'want-to-read': 0, reading: 0, read: 0 }
    for (const b of books) c[b.status] = (c[b.status] ?? 0) + 1
    return c
  }, [books])

  function openAdd() {
    setEditBook(undefined)
    setShowForm(true)
  }

  function openEdit(book: Book) {
    setEditBook(book)
    setShowForm(true)
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>📚</span>
          <span className={styles.brandName}>Home Library</span>
        </div>
        <nav className={styles.nav}>
          <button className="btn-ghost" onClick={() => setShowImport(true)}>
            Import / Export
          </button>
          <button className="btn-primary" onClick={openAdd}>
            + Add book
          </button>
        </nav>
      </header>

      <div className={styles.stats}>
        {(['owned', 'reading', 'read', 'want-to-read'] as BookStatus[]).map((s) => (
          <button
            key={s}
            className={filterStatus === s ? styles.statActive : styles.stat}
            onClick={() => setFilterStatus(filterStatus === s ? ALL : s)}
          >
            <span className={styles.statCount}>{counts[s] ?? 0}</span>
            <span className={styles.statLabel}>{s === 'want-to-read' ? 'Want to read' : s.charAt(0).toUpperCase() + s.slice(1)}</span>
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search title, author, ISBN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={filterFormat}
          onChange={(e) => setFilterFormat(e.target.value)}
          className={styles.select}
        >
          <option value={ALL}>All formats</option>
          <option value="kindle">Kindle</option>
          <option value="paper">Paper</option>
          <option value="both">Both</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.empty}>Loading library…</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          {books.length === 0
            ? 'No books yet. Add your first book or import from Goodreads!'
            : 'No books match your filters.'}
        </div>
      ) : (
        <main className={styles.grid}>
          {filtered.map((book) => (
            <div key={book.id} className={styles.cardWrapper}>
              <BookCard book={book} onEdit={openEdit} />
              <button
                className={styles.seriesBtn}
                title="Series"
                onClick={() => setSeriesBook(book)}
              >
                ∿ Series
              </button>
            </div>
          ))}
        </main>
      )}

      {showForm && (
        <BookForm
          initial={editBook}
          onClose={() => { setShowForm(false); setEditBook(undefined) }}
        />
      )}

      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}

      {seriesBook && <SeriesPanel book={seriesBook} onClose={() => setSeriesBook(undefined)} />}
    </div>
  )
}

export default App
