import { useRef, useState } from 'react'
import { parseGoodreadsCsv, mergeGoodreadsImport } from '../lib/goodreads/parser'
import { useLibrary } from '../context/LibraryContext'
import styles from './ImportDialog.module.css'
import type { LibraryExport } from '../types'

interface Props {
  onClose: () => void
}

export function ImportDialog({ onClose }: Props) {
  const { books, replaceBooks, importLibrary, exportLibrary } = useLibrary()
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleGoodreadsFile(file: File) {
    setBusy(true)
    setStatus(null)
    try {
      const text = await file.text()
      const { books: imported, skipped } = parseGoodreadsCsv(text)
      const merged = mergeGoodreadsImport(books, imported)
      await replaceBooks(merged)
      setStatus(
        `Imported ${imported.length} books (${skipped} skipped). ` +
          `Library now has ${merged.length} books.`,
      )
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleJsonFile(file: File) {
    setBusy(true)
    setStatus(null)
    try {
      const text = await file.text()
      const data: LibraryExport = JSON.parse(text)
      if (data.version !== 1) throw new Error('Unknown export version')
      await importLibrary(data, true)
      setStatus(`Merged ${data.books.length} books from JSON backup.`)
    } catch (e) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleFile(file: File) {
    if (file.name.endsWith('.csv')) {
      await handleGoodreadsFile(file)
    } else if (file.name.endsWith('.json')) {
      await handleJsonFile(file)
    } else {
      setStatus('Please upload a .csv (Goodreads) or .json (backup) file.')
    }
  }

  async function handleExport() {
    const data = await exportLibrary()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `home-library-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Import / Export</h2>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        <section className={styles.section}>
          <h3>Import Goodreads CSV</h3>
          <p className={styles.hint}>
            Export from Goodreads: <em>My Books → Tools → Import and Export → Export Library</em>
          </p>
          <label className={styles.fileLabel}>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                e.target.value = ''
              }}
            />
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? 'Processing…' : 'Choose file (.csv or .json)'}
            </button>
          </label>
        </section>

        <section className={styles.section}>
          <h3>Export backup</h3>
          <p className={styles.hint}>
            Downloads a JSON backup of your entire library ({books.length} books).
          </p>
          <button className="btn-ghost" onClick={handleExport}>
            Download JSON backup
          </button>
        </section>

        {status && <p className={styles.status}>{status}</p>}
      </div>
    </div>
  )
}
