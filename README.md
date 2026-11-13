# Meta Gaming

A web app where people connect through the games they play.

## 1. What it is

**The problem:** gamers have no single place to show what they play, talk about it with others and find new games.

**Who it's for:** players who want a profile based on their games, a community for each game and honest reviews from other players.

**Minimum moment of value:** a working app with a public forum for each of your games.

## 2. Features

### In the MVP

- **Accounts.** As a user, I can sign up and log in with email, username and password (stored hashed). An admin logs in through the same form, but their account is flagged as admin and sees a different dashboard.
- **Games and reviews.** As a user, I can search for videogames, post a review (the button changes to "Update review" if I already have one) and see the overall score and other people's reviews. I can also follow a game and see it on my dashboard.
- **Game communities.** As a user, I can open the community of any game and post questions, with threaded answers (reddit-like). A community is created automatically when a game is added.
- **Admin tools.** As an admin, I can add games (name, description, platforms, uploaded images) and ban or unban users. Banned users are hidden from the users list, and the admin has a menu to view the banned list.

### Backlog (not built yet)

- Sharing the games you play on your profile (hours played, etc.)
- Direct messages and group chats with friends
- User collections of games, shareable with others, and official collections configured by admins
- Mobile interface (the UI is already prepared for it)

## 3. How to run it

### Requirements

- Docker and Docker Compose
- (Optional) VS Code with the Dev Containers extension, to work inside the DevContainer

### Start with Docker

```bash
docker compose up --build
```

This starts PostgreSQL, the Express server and the Vue client (served by nginx). Then open:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database: `localhost:5432`

Uploaded game images are stored in a Docker volume (`uploads_data`).

### Run the tests

```bash
npm install
npm test            # runs test:server and then test:client
npm run test:server # backend only
npm run test:client # frontend only
```

### Deployment

The app is deployed with Docker. A Vercel multi-service configuration (`vercel.json`) was attempted but **does not work yet** (see section 5).

### Project structure

```text
MetaGaming/
├── client/          # Vue 3 + Vite + Pinia + Vue Router frontend
├── server/          # Express + TypeScript backend (routes, controllers, services, db)
├── api/             # Leftover Vercel serverless entrypoint from an earlier attempt
├── docs/            # Architecture and API documentation
├── uploads/         # Uploaded game images (a volume in Docker)
├── Dockerfile       # Multi-stage build (targets: server, client)
├── docker-compose.yml
├── vercel.json      # Vercel multi-service config (not working yet)
├── AGENTS.md        # Agent conventions and working rules
└── .env.example
```

## 4. How it was built with AI

The whole project was built with a coding agent, following the course workflow.

**1. Rules first.** The first prompt asked the agent to create a `README.md` and an `AGENTS.md` before any code. `AGENTS.md` defines the stack (TypeScript, Express, PostgreSQL, Vue), the conventions and the working rules:

- `main` is production and `develop` is integration; every feature lives in `feature/<name>`, created from `develop`.
- Commits follow Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`).
- Development happens in a DevContainer; deployment uses Docker.
- No secrets in code: environment variables, `.env` in `.gitignore`, versioned `.env.example`.

**2. Project setup.** The agent showed a plan first, then created the folder structure, DevContainer, Dockerfile, `docker-compose.yml`, `.gitignore`, `.env.example`, the test framework with one passing example test, and pushed `develop` to GitHub in small commits.

**3. One feature at a time.** Each feature (database, core backend, login and dashboard, videogames and reviews, community creation) followed the same loop: I wrote the user story and acceptance criteria, the agent explained its plan and the files it would touch, I approved it, and only then did it write code. After building, the agent wrote tests, ran the whole suite and merged into `develop`.

### An example prompt

```
I want to build this feature: community creation
As an user, I want to be able to interact with the community of a game in the
app, so that i can post my questions, and people can answer them, and people
can answer that people, etc.
Acceptance criteria:
- The user will be able to search for a game and access its community, and interact with it
- Communities are created automatically when adding the videogame
Create a feature/[name] branch from develop. Before writing any code,
explain your plan and which files you will touch, and wait for my approval.
Follow the conventions in AGENTS.md and don't add anything
that is not in the criteria.
```

### What went well

- Asking for a plan and approval before code kept the agent inside the acceptance criteria.
- Writing the rules in `AGENTS.md` once meant every later prompt could stay short.
- Asking the agent to write tests and run the full suite before merging ("don't change a test just to make it pass") caught problems early.

### What was hard

- **Game images did not load.** I opened a dedicated `fix` branch, asked the agent to find the bug, ran the test suite and merged back into `develop`.
- **Vercel deployment.** The agent produced a multi-service `vercel.json` (client, server, container app) and the code changes for it, but the app still does not work on Vercel. Docker deployment works.

## 5. Status and next steps

### Status

| Area                                      | State                                                                                                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Accounts and admin role                   | Works                                                                                                                                          |
| Games, reviews, follow, dashboard         | Works                                                                                                                                          |
| Game communities with threaded replies    | Works                                                                                                                                          |
| Admin: add games, image upload, ban/unban | Works                                                                                                                                          |
| Docker (local) and Docker deployment      | Works                                                                                                                                          |
| Vercel deployment                         | **Not working**                                                                                                                                |
| Tests                                     | 90 tests (Vitest): 70 server, 20 client. Auth, games/reviews and communities are covered; follow, ban/unban and the "Update review" UX are not |

### Next steps

1. **Fix the Vercel deployment.** Review the service names, public routes (`/api/*` to the server) and bindings in `vercel.json`, and make the client URLs agree with them.
2. **Close the test gaps.** Add tests for following/unfollowing games, banning/unbanning users (including the 403 on banned accounts and the "cannot ban yourself or another admin" guards), the image upload limits (5 MB; JPEG/PNG/WEBP/GIF) and the "Update review" form.
3. **Share your games.** Let users select the games they have played, with hours, and show them on their profile.
4. **Direct chats and groups** with friends.
5. **Collections**, personal and official.
6. **Polish the UI** and build the mobile version.
