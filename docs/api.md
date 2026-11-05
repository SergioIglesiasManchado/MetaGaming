# MetaGaming REST API Specifications

Initial overview of standard REST endpoints planned for MetaGaming.

---

## 1. System & Health

- `GET /health` — Service health check. Returns status `ok` and server timestamp.
- `GET /api/v1` — API metadata and version details.

---

## 2. Authentication & Users

- `POST /api/v1/auth/register` — Create a new user account.
- `POST /api/v1/auth/login` — Authenticate and receive session JWT.
- `GET /api/v1/users/:username` — Public profile and gaming library stats.
- `PATCH /api/v1/users/me` — Update current user profile details.

---

## 3. Game Library & Tracker

- `GET /api/v1/games` — Search and browse games catalog.
- `GET /api/v1/users/:username/games` — Fetch user's recorded games, playtime, and progress.
- `POST /api/v1/users/me/games` — Add or update a game entry in user library.

---

## 4. Communities & Posts

- `GET /api/v1/communities/:gameId` — Community hub details and rules.
- `GET /api/v1/communities/:gameId/posts` — List posts with sorting (`new`, `top`, `hot`).
- `POST /api/v1/communities/:gameId/posts` — Create a guide, question, or media post.
- `GET /api/v1/posts/:postId/comments` — Fetch threaded comments for a post.
- `POST /api/v1/posts/:postId/comments` — Reply to a post or existing comment.

---

## 5. Direct & Group Messaging

- `GET /api/v1/chats` — List recent direct and group conversations.
- `POST /api/v1/chats` — Create a new 1-on-1 or group chat.
- `GET /api/v1/chats/:chatId/messages` — Retrieve chat history.
- `POST /api/v1/chats/:chatId/messages` — Send a new message.

---

## 6. Game Collections

- `GET /api/v1/collections/official` — List official admin-curated collections.
- `GET /api/v1/collections/community` — Discover user-created public collections.
- `POST /api/v1/collections` — Create a new custom collection.
- `GET /api/v1/collections/:collectionId` — View details and game list of a collection.
