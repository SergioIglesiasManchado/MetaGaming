# AGENTS.md — Development Guidelines & Working Rules

This document outlines the project mission, tech stack, architecture conventions, and mandatory working rules for AI agents and human contributors working on **MetaGaming**.

---

## 1. Project Description

**MetaGaming** is a web platform for gamers to interact based on the video games they play.
Key capabilities include:
- **Gamer Profiles & Trackers**: Record games played, playtime stats, platforms, and completion metrics.
- **Social & Messaging**: Direct 1-to-1 chats and group conversations with friends.
- **Game Communities**: Subreddit-style dedicated hubs per game with posts, screenshots, guides, questions, reactions, and threaded comments.
- **Game Collections**: User-curated custom game lists (shareable publicly or with friends) and admin-curated official thematic collections.

---

## 2. Technology Stack

- **Frontend**: Vue 3 (Composition API with `<script setup lang="ts">`), TypeScript, Vite, Pinia (state management), Vue Router.
- **Backend**: Node.js, Express, TypeScript.
- **Database**: PostgreSQL (relational modeling for users, games, posts, comments, chats, collections).
- **Environment & Containerization**: DevContainers (`.devcontainer`), Docker, Docker Compose.

---

## 3. Mandatory Working Rules

### 3.1. Git Workflow
- **`main`**: Production branch. Contains only stable, release-ready code. Direct commits are strictly prohibited.
- **`develop`**: Integration branch. All ongoing features and fixes are integrated here.
- **Feature Branches**: Every feature or non-trivial change must be developed in a dedicated branch named `feature/<name>` (e.g., `feature/user-profiles`, `feature/game-collections`) branched off `develop`.
- **Merging**: Merge feature branches back into `develop` through pull requests or review. Only merge `develop` into `main` for release milestones.

### 3.2. Commit Message Conventions
All commit messages must adhere to the **Conventional Commits** specification:
```text
<type>(<optional-scope>): <description>

[optional body]

[optional footer(s)]
```
Allowed types:
- `feat`: A new user-facing feature or API capability.
- `fix`: A bug fix.
- `docs`: Documentation changes only (e.g., `README.md`, `AGENTS.md`, code comments).
- `refactor`: Code changes that neither fix a bug nor add a feature.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Maintenance tasks, dependency updates, tooling configuration, Docker/DevContainer scripts.

*Examples*:
- `feat(auth): implement user registration with password hashing`
- `fix(chat): prevent duplicate websocket message delivery`
- `docs(readme): add docker compose startup instructions`
- `chore(devcontainer): add postgres client extension`

### 3.3. Development Environment
- The official development environment is a **DevContainer** located in `.devcontainer/`.
- All dependencies, runtime environments (Node.js, TypeScript), and linked services (PostgreSQL) should run seamlessly within the DevContainer to guarantee parity across developer machines.

### 3.4. Deployment & Packaging
- The application is deployed with **Docker**.
- Provide production-grade multi-stage Dockerfiles (`Dockerfile.client`, `Dockerfile.server`) to produce lean, secure runtime images.
- A root `docker-compose.yml` must orchestrate the containers (client, server, database) for deployment and integration testing.

### 3.5. Secrets & Security Management
- **Never hardcode secrets, API keys, credentials, or private connection strings in the codebase.**
- Use environment variables accessed via process/runtime config.
- Ensure `.env` and any environment files containing real credentials are listed in `.gitignore`.
- Provide and maintain a version-controlled `.env.example` in the repository root and/or subdirectories documenting all required keys with dummy/placeholder values.

---

## 4. Code & Architecture Conventions

### 4.1. TypeScript & Typing
- Enable strict mode in `tsconfig.json` (`"strict": true`).
- Avoid using `any`; define explicit interfaces, types, or generics.
- Keep shared domain types (e.g. `User`, `Game`, `Collection`, `Post`) organized and reusable.

### 4.2. Backend (Express & PostgreSQL)
- **Layered Architecture**: Keep concerns separated:
  - `routes/`: Routing and HTTP verb definitions.
  - `controllers/`: Input validation and HTTP request/response handling.
  - `services/`: Business logic.
  - `db/` or `models/`: Database access, queries, transactions, and migrations.
- Always use parameterized SQL queries or query builders to prevent SQL injection.
- Centralize error handling with Express error middleware; never leak raw stack traces in production responses.

### 4.3. Frontend (Vue 3)
- Use **Vue 3 Composition API** with `<script setup lang="ts">`.
- Group global state into cohesive Pinia stores (e.g., `auth`, `communities`, `chat`).
- Ensure responsive UI design and maintain reusable UI components in `src/components/`.

---

## 5. Agent Operational Checklist

When modifying or generating code:
1. Ensure changes align with the target feature branch created from `develop`.
2. Do not include credentials or tokens in code or commit history.
3. Check that newly added environment variables are reflected in `.env.example`.
4. Ensure TypeScript compiles without errors.
5. Provide conventional commit messages for all proposed commits.
