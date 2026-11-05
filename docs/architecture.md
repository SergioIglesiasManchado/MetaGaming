# MetaGaming Architecture & System Design

This document describes the high-level architecture, module breakdown, and data models for the **MetaGaming** platform.

---

## 1. System Topology

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Vue 3 Client  │ ----> │ Express Backend │ ----> │ PostgreSQL DB   │
│   (Port 5173)   │       │   (Port 3000)   │       │   (Port 5432)   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

- **Client (`client/`)**: Single Page Application built with Vue 3, TypeScript, Vite, Pinia for reactive global state, and Vue Router for navigation.
- **Server (`server/`)**: Modular Node.js / Express backend with strict TypeScript types, layered into controllers, services, middleware, and database access.
- **Database (`postgres`)**: Relational PostgreSQL database for users, game metadata, library tracking, posts, comments, chats, and curated game collections.

---

## 2. Core Domain Models

1. **User & Profile**
   - User credentials, email, profile avatar, bio, and privacy settings.
2. **Game & Library Tracker**
   - Title, platform, release date, cover art, genres.
   - User tracking records: playtime (hours), status (`want_to_play`, `playing`, `completed`, `dropped`), personal score, and user review.
3. **Communities & Forum Posts (Reddit-like)**
   - Game hub spaces.
   - Posts: type (`guide`, `question`, `screenshot`, `discussion`), author, title, content/media, upvotes/reactions.
   - Threaded comments: parent-child comment tree hierarchy.
4. **Chat & Messaging**
   - Direct messages (1-on-1).
   - Group chat rooms and membership rosters.
   - Message delivery with timestamping and read markers.
5. **Game Collections**
   - User Collections: Custom curated lists with titles, descriptions, and game references (public or friends-only).
   - Official Collections: Themed lists authored and highlighted by platform administrators.

---

## 3. Layer Separation Guidelines

- **Controllers**: Parse and validate HTTP inputs, call service methods, and return standard JSON payloads.
- **Services**: Execute domain business logic, verify authorization rules, and coordinate data operations.
- **Database / Models**: Parameterized SQL queries via `pg` pool or query builders to ensure safety against SQL injection.
- **Error Handling**: Unified error handling middleware returns clean RFC-compliant error structures without exposing stack traces in production.
