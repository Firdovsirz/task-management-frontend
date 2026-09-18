# Tasks — Frontend

Next.js 15 (App Router) + TypeScript + Tailwind interface for **Tasks**, Firdovsi Rzaev's
personal task management workspace at [task.firdovsirzaev.online](https://task.firdovsirzaev.online).

The API lives in [task-management-backend](https://github.com/Firdovsirz/task-management-backend)
and is served at [api-task.firdovsirzaev.online](https://api-task.firdovsirzaev.online).

It is the AzTU Kanban frontend rebuilt for one person and dressed in the identity of
[firdovsirzaev.online](https://firdovsirzaev.online):

* The FR monogram, **Fraunces** headlines, **Inter** text and **Geist Mono** labels
* The site's warm paper palette with its emerald accent, and the same **light / dark / system** theme switch
* Dashboard with open work, deadlines, workflow and a live activity feed
* Drag-and-drop kanban board (dnd-kit) with WIP limits, filters and inline task creation
* Task drawer with description, comments and full history
* Architecture canvas: components, connections and decision notes, printable to PDF
* Morning deadline reminders in the notification centre

## Screens

| Route | Purpose |
| --- | --- |
| `/login` | Sign in — the workspace has a single owner account |
| `/dashboard` | Greeting, open/overdue counts, next up, deadlines, activity |
| `/tasks` | Every task, with search and filters |
| `/tasks/[key]` | Full-page task view (the target of e-mail links) |
| `/boards` | Every board, filtered by platform |
| `/boards/[key]` | The kanban board itself |
| `/platforms` | Areas of work and their boards |
| `/architecture`, `/architecture/[id]` | Diagrams and the canvas |
| `/profile` | Name, e-mail reminders, theme, password |

## Design system

Colours live in CSS variables in [`src/app/globals.css`](src/app/globals.css), holding the exact
tokens of firdovsirzaev.online for both themes. Tailwind's `ink-*` (neutrals) and `brand-*`
(emerald) scales point at those variables, so every component follows the theme without a
`dark:` variant. Only the hued chips (priority, type, status) carry explicit dark variants —
see `TONE` in [`src/lib/utils.ts`](src/lib/utils.ts).

The theme is chosen before first paint by an inline script (`src/lib/theme-script.ts`), with the
same storage key, default (light) and rules as the site, so there is no flash of the wrong theme.

## How it talks to the API

By default the browser only ever calls **this app's own origin**. Every request to `/api/*` is
proxied server-side to `BACKEND_URL` — on the VPS, the API container over the shared Docker
network — which means:

* there is no CORS configuration to get wrong, and sign-in never leaves the app's domain,
* changing the API address needs **no rebuild** — just recreate the container,
* the proxy only forwards plain `/api/...` paths: each segment is re-encoded and `.`/`..` segments
  are refused, so nothing can climb out of `/api` on the backend.

The API is also public at `api-task.firdovsirzaev.online` (Swagger UI, health, direct use). To make
the browser call it directly instead, set `NEXT_PUBLIC_API_URL=https://api-task.firdovsirzaev.online`
and rebuild.

## Running locally

```bash
cp .env.example .env
# then set BACKEND_URL to http://localhost:6070 (API in Docker)
# or http://localhost:8080 (API started with `mvn spring-boot:run`)
npm install
npm run dev                 # http://localhost:3000
```

With Docker, next to the backend stack. The shared network is created once by hand, before
either stack starts — both compose files expect it to exist. Inside the container `localhost` is
the container itself, so `BACKEND_URL` must name the API container, as `.env.example` does:

```bash
docker network create fr-task-shared   # once
BACKEND_URL=http://fr-task-api:8080 docker compose up -d --build   # http://127.0.0.1:6071
```

## Deploying to task.firdovsirzaev.online

Both repositories deploy together with one command on the VPS, once the `A` records of
**task.firdovsirzaev.online** and **api-task.firdovsirzaev.online** point at it:

```bash
curl -fsSL https://raw.githubusercontent.com/Firdovsirz/task-management-backend/main/deploy/vps-setup.sh \
  -o /tmp/fr-task-setup.sh && sudo bash /tmp/fr-task-setup.sh
```

It checks ports, memory and disk before changing anything, clones both repos into
`/opt/fr-task`, builds and starts both stacks, installs this repo's nginx site
([`deploy/nginx/task.firdovsirzaev.online.conf`](deploy/nginx/task.firdovsirzaev.online.conf) —
proxy to `127.0.0.1:6071`, sign-in rate limited) and gets a Let's Encrypt certificate. Re-run it to
deploy updates. Details are in the
[backend README](https://github.com/Firdovsirz/task-management-backend#deploying-to-the-vps).

The session cookie is marked `Secure` automatically when the page is served over HTTPS.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `BIND_ADDRESS` | `127.0.0.1` | Interface the published port binds to — keep it on loopback behind nginx |
| `WEB_PORT` | `6071` | Host port published by docker compose (container listens on 3000) |
| `SHARED_NETWORK` | `fr-task-shared` | Docker network shared with the backend stack |
| `BACKEND_URL` | `http://fr-task-api:8080` | Where the API lives, over the shared docker network (runtime, no rebuild) |
| `NEXT_PUBLIC_API_URL` | empty | Optional: call the API straight from the browser (build-time) |

## Auth

The JWT returned by `POST /api/auth/login` is stored in the `fr_task_token` cookie. After a
password change the app signs straight back in with the new password, because the API refuses
every token issued before the change. `src/middleware.ts` redirects
signed-out visitors to `/login` and signed-in visitors away from it; the axios interceptor
clears the cookie and returns to `/login` on any `401`.

## Health

`GET /api/health` returns `{"status":"UP"}` without touching the API — used by the container
healthcheck.
