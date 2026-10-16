# CV Creator

JSON-driven CV generator that produces vector PDFs entirely in your browser. Paste an agent-generated CV JSON, upload your photo, preview live, and export to PDF.

## The idea

The power lives entirely in the JSON contract (`cv.schema.json`). Any LLM agent can produce it using the copy/paste prompt kit (`PROMPT.md`). The app itself is a dumb renderer — static HTML/CSS/JS, no backend, no database, nothing leaves your browser.

## How to use

1. Copy `PROMPT.md` into any LLM agent, give it your CV text + preferences.
2. Paste the returned JSON into the creator.
3. Add your photo (if referenced).
4. Preview live on the right. The look comes entirely from the JSON — no style settings in the app.
5. Click **Export** → print dialog → "Save as PDF" (margins None, background graphics on).

## Local preview

```bash
cd public
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to GitHub Pages

The `.github/workflows/deploy.yml` deploys the `public/` folder to GitHub Pages on every push to `main`. Enable Pages in repo settings → build source: GitHub Actions.

## What you get

- `cv.schema.json` — the contract agents read
- `PROMPT.md` — copy/paste prompt kit
- 3 example CVs in `public/examples/`
- `tos.html`, `privacy.html`, `how.html`
- Vendorable Google Fonts (currently loaded via CDN; swap `fonts/` + `fonts.css` for fully offline)

## Privacy

Client-side only. No accounts, no tracking, no server storage. Draft autosaves in your browser's local storage.

Created by Daniel T. for free use. · danieltuma.work
