# LedgeLens

Phase 1 of an insurance underwriting intelligence workbench — an independent concept prototype using fictional data.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons
- Recharts

## Getting Started

```bash
npm install
npm run dev
```

### Viewing the app

**If you use Cursor's integrated terminal (remote/cloud workspace):**

`localhost:3000` in your browser points at **your computer**, not the machine where `npm run dev` is running. The dev server can be up and still show `ERR_CONNECTION_REFUSED` in Chrome.

1. Keep `npm run dev` running until you see `✓ Ready`.
2. Open the **Ports** panel in Cursor (bottom panel → **Ports**, or Command Palette → “Ports: Focus on Ports View”).
3. Confirm port **3000** is listed. If not, click **Forward a Port** and enter `3000`.
4. Click the **Open in Browser** icon next to port 3000 (globe/link), or use the forwarded URL Cursor shows — not plain `http://localhost:3000` unless that port is explicitly forwarded.

**If you cloned the repo and run on your own machine:**

```bash
cd Ledge-Lens
git checkout cursor/phase-1-ledge-lens-dcbb
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). The terminal must stay open and show `✓ Ready`.

### Troubleshooting `ERR_CONNECTION_REFUSED`

| Check | What to do |
|-------|------------|
| Terminal closed or `npm run dev` stopped | Start it again and leave the terminal open |
| No `✓ Ready` message | Read the error above it (often `npm install` was skipped) |
| Remote Cursor terminal | Use the **Ports** panel forwarded URL, not local `localhost` |
| Port 3000 in use | Run `npm run dev -- -p 3001` and open `http://localhost:3001` |

## Phase 1 Scope

- Application shell with left navigation
- Dashboard with portfolio metrics and charts
- Searchable submission inbox
- TypeScript domain models and five seeded fictional submissions
- Placeholder pages for future phases

No database, authentication, or live AI in this phase.

## Deploy on Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. **Root Directory** must be empty (`.`). Do **not** set it to `Ledge-Lens` or any subfolder.
3. **Framework Preset** should be **Next.js** (auto-detected via `vercel.json`).
4. Deploy from the `main` branch.

Live URL: https://ledge-lens.vercel.app

Independent concept prototype using fictional data. Not affiliated with Ledgebrook or any insurer, MGA or broker.
