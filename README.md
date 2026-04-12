# Champ

Platform for automation and digitalization of tennis tournament management.

## Screenshots

![Championship view 1](.vibe-attachments/c8c1a630-7a21-4b67-93e3-2bbef7830e15_localhost_5173_championships_6.png)

![Championship view 2](.vibe-attachments/69cc7615-7c5e-48a2-b4ee-2dc6c8d52b98_localhost_5173_championships_11.png)

## Stack

**Backend**
- Runtime: Node.js
- Framework: Express.js
- Database: MySQL 5.7+
- Testing: Jest + Supertest

**Frontend**
- Framework: React 18
- Build Tool: Vite
- Routing: React Router v6

## Getting Started

### Prerequisites

- Node.js
- MySQL 5.7+ running locally

### Environment

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=champ
```

### Backend

```bash
npm install
npm start        # starts Express server on port 3000
npm test         # runs Jest test suite
```

### Frontend

```bash
cd client
npm install
npm run dev      # starts Vite dev server (proxies /api to port 3000)
npm run build    # production build
```

### Run Both (Server + Client)

Use the helper script to start backend and frontend together:

```bash
./dev.sh
```

`dev.sh` loads DB credentials from root `.env`.  
MySQL is expected to already be running locally with those credentials.

## API Routes

### Players

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/players` | List all players |
| `POST` | `/api/players` | Create player (`name` required) |
| `GET` | `/api/players/:id` | Get player by ID |
| `PUT` | `/api/players/:id` | Update player name |
| `DELETE` | `/api/players/:id` | Delete player |

### Championships

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/championships` | List all championships |
| `POST` | `/api/championships` | Create championship (`name`, `capacity`, optional `hasGroups`, `ligueId`) |
| `GET` | `/api/championships/:id` | Get championship details |
| `PUT` | `/api/championships/:id` | Update championship |
| `DELETE` | `/api/championships/:id` | Delete championship |
| `POST` | `/api/championships/:id/entry-list` | Set player entry list (`playerIds` array) |
| `POST` | `/api/championships/:id/groups` | Create group stage (optional `optimalGroupSize`, default 3) |
| `POST` | `/api/championships/:id/draw` | Create playoff draw |
| `POST` | `/api/championships/:id/draw/start` | Seed qualified players and start playoff (auto or manual with `manualPlayerIds`) |

### Groups

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/championships/:id/groups` | List all groups |
| `GET` | `/api/championships/:id/groups/:name` | Get group details |
| `GET` | `/api/championships/:id/groups/:name/matches` | List group matches |
| `PUT` | `/api/championships/:id/groups/:name/matches/:matchId` | Record match result (`result` e.g. `"6-4"`) |

### Playoff Draw

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/championships/:id/draw/matches` | List all playoff matches |
| `GET` | `/api/championships/:id/draw/matches/:matchId` | Get playoff match |
| `PUT` | `/api/championships/:id/draw/matches/:matchId` | Record playoff match result |

### Ligues (League Rankings)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/ligues` | List all ligues |
| `POST` | `/api/ligues` | Create ligue (`name` required) |
| `GET` | `/api/ligues/:id` | Get ligue details |
| `DELETE` | `/api/ligues/:id` | Delete ligue |
| `GET` | `/api/ligues/:id/players` | List ligue players |
| `POST` | `/api/ligues/:id/players` | Add player to ligue (`playerId` required) |
| `POST` | `/api/ligues/:id/players/batch` | Batch add players (`playerIds` array) |
| `DELETE` | `/api/ligues/:id/players/:playerId` | Remove one ligue player |
| `DELETE` | `/api/ligues/:id/players/batch` | Batch remove ligue players (`liguePlayerIds` array) |
| `GET` | `/api/ligues/:id/ranking` | Get ligue ranking sorted by points |

## Tournament Workflow

1. **Entry List** — add players to a championship
2. **Group Stage** *(optional)* — round-robin groups; points awarded by finishing place
3. **Create Draw** — generate playoff bracket (power-of-2 capacity)
4. **Start Draw** — seed qualified players using serpentine algorithm or manually assign slots
5. **Playoff** — record bracket match results; bye matches advance automatically
6. **League Sync** *(optional)* — championship points aggregated to ligue standings

## Domain Models

| Model | Description |
|-------|-------------|
| `Player` | Tennis player with a name |
| `Championship` | Tournament with capacity, optional group stage, playoff draw, and per-championship points config |
| `ChampionshipPlayer` | Player entry in a championship with accumulated points |
| `Group` | Round-robin group with players and matches |
| `GroupPlayer` | Player in a group with stats metadata |
| `GroupMetadata` | Points, wins, losses, place within a group |
| `GroupMatch` | Match in group stage; updates player stats on result |
| `Draw` | Playoff bracket structure (power-of-2 capacity) |
| `PlayOffMatch` | Bracket match with seeding, bye handling, and winner/loser progression |
| `PlayOffPlayer` | Player in playoff bracket (may be a bye) |
| `TennisSet` | Single set score parsed from string like `"6-4"` |
| `LiguePlayer` | Player in league standings with accumulated points across championships |

## Project Structure

```
champ/
├── server/
│   ├── app.js              # Express server & all route handlers
│   └── db/
│       ├── connection.js   # MySQL connection pool
│       ├── migrate.js      # Schema creation & migrations
│       └── repo.js         # DB abstraction layer & state serialization
├── domain/
│   ├── models/             # Domain entities (Player, Championship, Group, Draw, …)
│   ├── builders/
│   │   └── ranking.js      # RankingBuilder
│   └── tests/              # Domain unit tests
├── client/
│   ├── src/
│   │   ├── App.jsx         # Routes & NavBar
│   │   ├── pages/          # Dashboard, Players, Championships, Ligues, …
│   │   ├── components/     # Shared UI (NavBar, Spinner, StatusBadge, …)
│   │   ├── features/
│   │   │   └── championship/  # Workflow steps, bracket rendering, stage logic
│   │   └── api/            # Fetch wrappers per resource
│   └── vite.config.js      # Vite config + /api proxy
└── utils/
    └── util.js             # Test helpers
```
