# LAST_FEATURE.md — Game Enhancements & User Moderation

## Objective

This feature sprint added five closely related capabilities to the MetaGaming platform:

1. **"Update Review" UX** — When a logged-in user already has a review for a game, the review form is pre-filled with their existing score and body, and the submit button changes from "Post Public Review" to "Update Review". Submitting re-uses the HTTP PUT endpoint (which was already UPSERT-based at the DB level).

2. **Follow / Unfollow Games** — Users can click a "Follow" button on any game's detail page to subscribe to it. Followed games are stored in a new `game_follows` join table and shown in a dedicated "Followed Videogames" section in the user Dashboard.

3. **Real Image Upload for Admins** — The game creation form now exposes a file-picker (click-to-browse, no drag-required). Admins select one or more image files; each is uploaded individually to the server via `POST /api/v1/games/upload-image` (using `multer`). Thumbnail previews with upload-status badges appear in a grid. Uploaded URL paths are collected and sent as the `photos` array when creating the game. Files are served statically from `/uploads/`.

4. **Admin Ban System** — Admins can ban individual users (non-admin, non-self) from the User Management table in the Dashboard. Banned users are hidden from the active user list and from all authenticated API calls (the `requireAuth` middleware checks `is_banned` on every request and returns 403 if true). A collapsible "Banned Users" panel lets admins review and unban accounts. Guards: cannot ban yourself, cannot ban other admins.

5. **Responsive UI Overhaul** — All major views received a mobile-ready pass: centered `max-width` containers, 44px minimum touch targets on all buttons, a hamburger nav menu (visible on < 768px) in `App.vue`, single-column grid on < 640px in `GamesView.vue` and `DashboardView.vue`, and consistent mobile breakpoints in `GameDetailView.vue`.

---

## Database Changes

| Table / Column | Change |
|---|---|
| `users.is_banned` | Added `BOOLEAN DEFAULT FALSE NOT NULL` via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` |
| `game_follows` | New table: `user_id`, `game_id`, `created_at`, `UNIQUE(user_id, game_id)` |

Both changes are **idempotent** — `initDb()` uses `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`.

---

## Files Changed

### Backend (`server/`)

| File | What changed |
|---|---|
| `src/db/init.ts` | Added `is_banned` column to `users`; added `game_follows` table + indexes |
| `src/app.ts` | Added `fs`/`path` imports; creates `uploads/` dir on start; serves `/uploads` as static files |
| `src/middleware/auth.middleware.ts` | `requireAuth` made async; checks `is_banned` from DB on every request; returns 403 if banned |
| `src/services/auth.service.ts` | Added `is_banned` to `UserProfile` and `UserDbRow`; login query selects it; throws 403 if banned at login |
| `src/services/user.service.ts` | `searchUsers()` filters `WHERE is_banned = FALSE`; added `getBannedUsers()`, `banUser()`, `unbanUser()` |
| `src/controllers/user.controller.ts` | Added `getBannedUsers`, `banUser`, `unbanUser` handlers |
| `src/routes/user.routes.ts` | Added `GET /banned`, `PATCH /:id/ban`, `PATCH /:id/unban` routes (admin-only) |
| `src/services/game.service.ts` | Added `followGame()`, `unfollowGame()`, `isFollowingGame()`, `getFollowedGames()` |
| `src/controllers/game.controller.ts` | Added `uploadImage()`, `followGame()`, `unfollowGame()`, `getFollowStatus()`, `getFollowedGames()` handlers |
| `src/routes/game.routes.ts` | Added multer config (5 MB, JPEG/PNG/WEBP/GIF); routes: `POST /upload-image`, `GET /followed`, `GET /:id/follow-status`, `POST /:id/follow`, `DELETE /:id/follow` |
| `package.json` (server workspace) | Added `multer` + `@types/multer` |

### Frontend (`client/`)

| File | What changed |
|---|---|
| `src/types/auth.ts` | Added `is_banned?: boolean` to `UserProfile` |
| `src/types/game.ts` | Added `is_following?: boolean` to `Game` |
| `src/stores/auth.ts` | Added `fetchBannedUsers()`, `banUser()`, `unbanUser()` store methods |
| `src/stores/games.ts` | Added `followedGames`, `isFollowingCurrentGame` refs; added `uploadGameImage()`, `checkFollowStatus()`, `followGame()`, `unfollowGame()`, `fetchFollowedGames()` |
| `src/views/GameDetailView.vue` | "Update Review" UX (pre-fill + dynamic label); Follow/Unfollow button; "You" badge on own review; responsive layout |
| `src/views/GamesView.vue` | Removed URL-text photo input; added real file-picker with preview grid and per-file upload; mobile responsive layout |
| `src/views/DashboardView.vue` | Added "Followed Videogames" section (users); added Ban button per user row; added collapsible "Banned Users" panel with Unban action (admin); mobile layout |
| `src/App.vue` | Sticky navbar, hamburger menu for mobile (< 768px), 44px min touch targets, centered `max-width: 1200px` inner nav |

---

## Branch

`feature/game-enhancements-and-moderation` → merged into `develop`
