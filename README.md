# Home Library

A personal library tracker — runs entirely in your browser via IndexedDB. Deploy to GitHub Pages with one push; migrate to a private server later without rewriting.

## Features

- Track books you **own** (Kindle / paper / both), are **reading**, have **read**, or **want to read**
- **Goodreads CSV import** with smart merge (matches on ISBN-13, falls back to title + author)
- **Google Books search** when adding books (requires API key)
- **Series tracking** — link books to a series and see reading order in your library
- **JSON export / import** for backups and future server migration
- Fully offline after first load (IndexedDB storage)

## Local development

```bash
npm install
cp .env.example .env.local   # Google Books API key
npm run dev        # http://localhost:5173/home-library/
```

## Google Books API

Book search uses **Google Books**. You need a free API key from [Google Cloud Console](https://console.cloud.google.com/):

1. Create a project (or pick an existing one)
2. Enable **Books API**
3. Create an **API key** under Credentials
4. Restrict the key (recommended):
   - **Application restrictions:** HTTP referrers
   - **Website restrictions:** `https://<your-username>.github.io/*` and `http://localhost:5173/*`
   - **API restrictions:** Books API only

**Local development:** put the key in `.env.local`:

```bash
VITE_GOOGLE_BOOKS_API_KEY=your_key_here
```

**GitHub Pages deploy:** add a repository secret named `GOOGLE_BOOKS_API_KEY` with the same value. The deploy workflow passes it into the build automatically. Re-run the deploy workflow (or push a commit) after adding the secret.

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

2. In your repo on GitHub: **Settings → Pages → Build and deployment → Source → GitHub Actions**

   If the site is blank after a successful workflow run, Pages is probably still serving the **repository root** (unbuilt source). Either switch the source to **GitHub Actions**, or set **Deploy from a branch** to the `gh-pages` branch and `/ (root)`.

3. Any push to `master` triggers the deploy workflow automatically.

Live URL: `https://<your-username>.github.io/home-library/`

## Project structure

```
src/
├── components/       BookCard, BookForm, ImportDialog, SeriesPanel
├── context/          LibraryContext (React state + storage wiring)
├── lib/
│   ├── storage/      StorageProvider interface + IndexedDB impl + API stub
│   ├── goodreads/    CSV parser + merge logic
│   ├── books/        Google Books search
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
