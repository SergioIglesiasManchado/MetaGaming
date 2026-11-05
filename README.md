# MetaGaming 🎮

**MetaGaming** is a community-driven web platform connecting gamers through the titles they play. Players can curate their gaming history, share play statistics, chat one-on-one or in groups, participate in Reddit-style game communities, and create or discover game collections.

---

## 🌟 Key Features

1. **Gamer Profiles & Game Library**
   - Showcase played games, platforms, playtime tracking, reviews, and completion statuses.
   - Customizable public gamer profiles.

2. **Direct & Group Messaging**
   - Real-time 1-on-1 private messaging.
   - Group chats to coordinate gaming sessions with friends.

3. **Game Communities (Reddit-like)**
   - Dedicated hubs for every game.
   - Post guides, gameplay screenshots, questions, and patch discussions.
   - Upvoting, reactions, and threaded comment discussions.

4. **Game Collections**
   - **User Collections**: Curate custom lists (e.g., *"Top Co-op Games"*, *"Indie Gems"*) and share them with friends or the community.
   - **Official Collections**: Themed lists curated by platform administrators.

---

## 🛠️ Tech Stack

- **Frontend**: [Vue.js 3](https://vuejs.org/) (Composition API, `<script setup lang="ts">`), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), [Pinia](https://pinia.vuejs.org/), [Vue Router](https://router.vuejs.org/)
- **Backend**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Environment & Deployment**: DevContainers, Docker, Docker Compose

---

## 📁 Project Structure

```text
MetaGaming/
├── .devcontainer/                # Visual Studio Code DevContainer configuration
│   ├── devcontainer.json         # DevContainer settings and extensions
│   └── docker-compose.dev.yml    # Development multi-container definition
├── client/                       # Vue 3 Frontend application
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── assets/               # CSS styles, images, icons
│   │   ├── components/           # Reusable UI components
│   │   ├── composables/          # Vue composables (custom hooks)
│   │   ├── layouts/              # Page layouts (Navbar, Sidebar, Footer)
│   │   ├── router/               # Vue Router configuration
│   │   ├── services/             # API client calls (Axios/Fetch)
│   │   ├── stores/               # Pinia state stores (Auth, Games, Chat)
│   │   ├── types/                # TypeScript interfaces and types
│   │   ├── views/                # Route views / pages
│   │   ├── App.vue               # Root Vue component
│   │   └── main.ts               # Client entry point
│   ├── index.html                # Vite HTML entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                       # Express Backend application
│   ├── src/
│   │   ├── config/               # Database and app configuration
│   │   ├── controllers/          # Route controller handlers
│   │   ├── db/                   # PostgreSQL connection pool & migrations
│   │   ├── middleware/           # Auth, validation, and error middlewares
│   │   ├── routes/               # Express API route declarations
│   │   ├── services/             # Business logic layer
│   │   ├── types/                # TypeScript models and shared types
│   │   ├── utils/                # Helper utilities and loggers
│   │   └── app.ts                # Express application setup
│   │   └── index.ts              # Server bootstrap and listener
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example              # Server environment variable template
├── docker/                       # Production Docker configurations
│   ├── Dockerfile.client         # Multi-stage build for Vue app
│   └── Dockerfile.server         # Multi-stage build for Express app
├── docker-compose.yml            # Multi-service stack (Client, Server, Postgres)
├── .env.example                  # Root environment variable template
├── .gitignore                    # Git ignore file (includes .env)
├── AGENTS.md                     # Agent development guidelines and conventions
└── README.md                     # Project documentation
```

---

## 🚀 How to Run the Project

### Option A: Using DevContainer (Recommended)

1. Open the project folder in **Visual Studio Code** or any editor supporting DevContainers.
2. Install the **Dev Containers** extension (`ms-vscode-remote.remote-containers`).
3. Press `F1` (or `Ctrl+Shift+P`) and choose **Dev Containers: Reopen in Container**.
4. The container will automatically set up Node.js, TypeScript, and a linked PostgreSQL instance.

---

### Option B: Using Docker Compose

1. Clone the repository and navigate into the folder:
   ```bash
   git clone <repo-url>
   cd MetaGaming
   ```
2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
3. Start all services (Database, Express Backend, and Vue Frontend):
   ```bash
   docker compose up --build
   ```
4. Access the applications:
   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:3000](http://localhost:3000)
   - **Database**: `localhost:5432`

---

### Option C: Manual Local Setup

#### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL (v15+)
- npm or pnpm

#### 1. Setup Database
Create a database named `metagaming` in PostgreSQL:
```sql
CREATE DATABASE metagaming;
```

#### 2. Backend Setup
```bash
cd server
cp .env.example .env # adjust DB connection strings and secrets
npm install
npm run dev
```

#### 3. Frontend Setup
```bash
cd client
cp .env.example .env # adjust API URL if needed
npm install
npm run dev
```

---

## 🔒 Security & Environment Variables

- **Never commit secrets** or `.env` files into source control.
- Keep `.env.example` files updated whenever adding or changing required variables.
- Required keys are documented in `.env.example`.

---

## 📜 Development Guidelines & Git Workflow

Refer to [AGENTS.md](file:///home/Arioch/Trabajo/universidad/EUNICE/AI%20assisted%20development/MVP/MetaGaming/AGENTS.md) for branch strategies, Conventional Commits format, code standards, and agent rules.
