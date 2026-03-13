# Champ

Platform for automation and digitalization of tennis tournaments management.

## Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Testing:** Jest
- **Storage:** In-memory (Maps)

## Getting Started

```bash
npm install
npm start        # starts server on port 3000
npm test         # runs Jest test suite
```

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
| `POST` | `/api/championships` | Create championship (`name`, `capacity`, optional `hasGroups`) |
| `GET` | `/api/championships/:id` | Get championship details |
| `PUT` | `/api/championships/:id` | Update championship |
| `DELETE` | `/api/championships/:id` | Delete championship |
| `POST` | `/api/championships/:id/entry-list` | Add players (`playerIds` array) |
| `POST` | `/api/championships/:id/groups` | Create group stage (optional `optimalGroupSize`, default 3) |
| `POST` | `/api/championships/:id/draw` | Create playoff draw |
| `POST` | `/api/championships/:id/draw/start` | Start draw & seed qualified players |

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

### Ligue (League Rankings)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/ligue` | Overall ranking sorted by points |
| `GET` | `/api/ligue/players` | List all ligue players with stats |
| `POST` | `/api/ligue/players` | Add player to ligue (`playerId` required) |
| `GET` | `/api/ligue/players/:id` | Get ligue player details |
| `PUT` | `/api/ligue/players/:id` | Update ligue player (`points` or `champId`) |
| `DELETE` | `/api/ligue/players/:id` | Remove player from ligue |

## Domain Models

| Model | Description |
|-------|-------------|
| `Player` | Tennis player with a name |
| `Championship` | Tournament with capacity, optional group stage and playoff draw |
| `ChampionshipPlayer` | Player entry in a championship with points |
| `Group` | Round-robin group with players and matches |
| `GroupPlayer` | Player in a group with stats metadata |
| `GroupMetadata` | Points, wins, losses, place within a group |
| `GroupMatch` | Match in group stage |
| `Draw` | Playoff bracket structure |
| `PlayOffMatch` | Match in playoff bracket with seeding and progression info |
| `PlayOffPlayer` | Player in playoff (may be a bye) |
| `TennisSet` | Single set score parsed from string like `"6-4"` |
| `LiguePlayer` | Player in league standings with accumulated points across championships |

## Project Structure

```
champ/
├── server/
│   └── app.js              # Express server & all route handlers
├── domain/
│   ├── models/             # Domain entities
│   ├── builders/
│   │   └── ranking.js      # RankingBuilder
│   └── tests/              # Jest tests
└── utils/
    └── util.js             # Utilities
```
