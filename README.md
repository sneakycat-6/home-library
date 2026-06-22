# Home Library

A personal library tracker — runs entirely in your browser via IndexedDB. Deploy to GitHub Pages with one push; migrate to a private server later without rewriting.

## Features

- Track books you **own** (Kindle / paper / both), are **reading**, have **read**, or **want to read**
- **Goodreads CSV import** with smart merge (matches on ISBN-13, falls back to title + author)
- **Series lookup** via Open Library — auto-detects which book in a series you have and shows what's next
- **JSON export / import** for backups and future server migration
- Fully offline after first load (IndexedDB storage)

## Local development

```bash
npm install
npm run dev        # http://localhost:5173/home-library/
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Deploy to GitHub Pages

1. Create the repo and push:

   ```powershell
   gh auth login        # one-time
   gh repo create home-library --public --source=. --remote=origin --push
   ```

2. In your repo on GitHub: **Settings → Pages → Source → GitHub Actions**

3. Any push to `main` triggers the deploy workflow automatically.

Live URL: `https://<your-username>.github.io/home-library/`

## Project structure

```
src/
├── components/       BookCard, BookForm, ImportDialog, SeriesPanel
├── context/          LibraryContext (React state + storage wiring)
├── lib/
│   ├── storage/      StorageProvider interface + IndexedDB impl + API stub
│   ├── goodreads/    CSV parser + merge logic
│   └── series/       Open Library lookup + next-in-series
├── types/            Book, Series types
└── App.tsx
.github/workflows/deploy-pages.yml
```

## Phase 2 — Private server migration

When you're ready to move to a private server:

1. Build a Node + Express/Fastify + SQLite backend
2. Implement `ApiStorageProvider` (already stubbed at `src/lib/storage/ApiStorageProvider.ts`)
3. Build with `VITE_API_URL=https://library.yourdomain.local`
4. Serve `dist/` with nginx; proxy `/api` to Node
5. One-time import: upload the JSON export from GitHub Pages
