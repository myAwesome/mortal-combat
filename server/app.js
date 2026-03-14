const express = require('express');

const { Group } = require('../domain/models/Group');
const { RankingBuilder } = require('../domain/builders/ranking');
const repo = require('./db/repo');

const app = express();
app.use(express.json());

// ── Serializers ──────────────────────────────────────────────────────────────
const serializeSet = (set) => set ? `${set.p1}-${set.p2}` : null;

const serializeGroupPlayer = (gp) => ({
  name: gp.player.name,
  points: gp.groupMetadata.points,
  win: gp.groupMetadata.win,
  loose: gp.groupMetadata.loose,
  place: gp.groupMetadata.place,
  group: gp.groupMetadata.group,
});

const serializeGroupMatch = (m, id) => ({
  id,
  player1: m.player1.player.name,
  player2: m.player2.player.name,
  result: serializeSet(m.result),
  winner: m.winner ? m.winner.player.name : null,
});

const serializePlayOffMatch = (m) => ({
  id: m.id,
  stage: m.stage,
  matchNumberInRound: m.matchNumberInRound,
  playersInRound: m.playersInRound,
  prize: m.prize,
  player1: m.player1 ? { name: m.player1.player.name, isBye: m.player1.isBye } : null,
  player2: m.player2 ? { name: m.player2.player.name, isBye: m.player2.isBye } : null,
  result: serializeSet(m.result),
  winner: m.winner ? { name: m.winner.player.name } : null,
});

const serializeGroup = (g) => ({
  name: g.name,
  capacity: g.capacity,
  players: g.players.map(serializeGroupPlayer),
  matches: g.matches.map(serializeGroupMatch),
});

const serializeChampionship = (id, c) => ({
  id,
  name: c.name,
  capacity: c.capacity,
  hasGroups: c.hasGroups,
  ligueLinked: c.ligueLinked || false,
  players: c.players
    ? c.players.map((cp) => ({ name: cp.player.name, points: cp.points }))
    : null,
  groups: c.groups.map(serializeGroup),
  draw: c.draw
    ? {
        capacity: c.draw.capacity,
        qualifiers: c.draw.qualifiers,
        completedMatches: c.draw.completedMatches,
        matches: Array.from(c.draw.matches.values()).map(serializePlayOffMatch),
      }
    : null,
});

// ── Players ──────────────────────────────────────────────────────────────────

app.get('/api/players', async (_req, res) => {
  try {
    const list = await repo.getAllPlayersList();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/players', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const player = await repo.createPlayer(name);
    res.status(201).json(player);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/players/:id', async (req, res) => {
  try {
    const p = await repo.getPlayerRow(req.params.id);
    if (!p) return res.status(404).json({ error: 'Player not found' });
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/players/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const p = await repo.updatePlayer(req.params.id, name);
    if (!p) return res.status(404).json({ error: 'Player not found' });
    res.json(p);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const deleted = await repo.deletePlayer(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Player not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Championships ─────────────────────────────────────────────────────────────

app.get('/api/championships', async (_req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const list = await repo.getAllChampionships(playersMap);
    res.json(list.map(({ id, champ }) => serializeChampionship(id, champ)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/championships', async (req, res) => {
  const { name, capacity, hasGroups = true, ligueLinked = false } = req.body;
  if (!name || !capacity) return res.status(400).json({ error: 'name and capacity are required' });
  try {
    const { id, champ } = await repo.createChampionship(name, capacity, hasGroups, ligueLinked);
    res.status(201).json(serializeChampionship(id, champ));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/championships/:id', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });
    res.json(serializeChampionship(found.id, found.champ));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/championships/:id', async (req, res) => {
  const { name, capacity, hasGroups } = req.body;
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });

    const { champ } = found;
    if (name !== undefined) champ.name = name;
    if (capacity !== undefined) champ.capacity = capacity;
    if (hasGroups !== undefined) champ.hasGroups = hasGroups;

    await repo.updateChampionshipFields(req.params.id, { name, capacity, hasGroups });
    res.json(serializeChampionship(found.id, champ));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/championships/:id', async (req, res) => {
  try {
    const deleted = await repo.deleteChampionship(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Championship not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Championship actions ──────────────────────────────────────────────────────

// POST /api/championships/:id/entry-list  { playerIds: [id, ...] }
app.post('/api/championships/:id/entry-list', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });

    const { playerIds } = req.body;
    if (!Array.isArray(playerIds) || playerIds.length === 0)
      return res.status(400).json({ error: 'playerIds array is required' });

    const players = [];
    for (const pid of playerIds) {
      const p = playersMap.get(String(pid));
      if (!p) return res.status(404).json({ error: `Player ${pid} not found` });
      players.push(p);
    }

    const { id, champ } = found;
    champ.entryList = players;
    await repo.saveChampionshipState(id, champ);
    res.json(serializeChampionship(id, champ));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/championships/:id/groups  { optimalGroupSize?: number }
app.post('/api/championships/:id/groups', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });

    const { champ, id } = found;
    if (!champ.players) return res.status(400).json({ error: 'Entry list not set' });

    const { optimalGroupSize = 3 } = req.body;
    champ.createGroups(optimalGroupSize);
    await repo.saveChampionshipState(id, champ);
    res.json(serializeChampionship(id, champ));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/championships/:id/draw
app.post('/api/championships/:id/draw', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });

    const { champ, id } = found;
    champ.createDraw();
    await repo.saveChampionshipState(id, champ);
    res.json(serializeChampionship(id, champ));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/championships/:id/draw/start
app.post('/api/championships/:id/draw/start', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });

    const { champ, id } = found;
    if (!champ.draw) return res.status(400).json({ error: 'Draw not created yet' });

    if (champ.hasGroups) {
      champ.addPointsAccordingToPlace();
      champ.joinedGroupsResult = champ.createJoinedGroupsResult(champ.groups);
    }
    champ.prepareQualifiersForDraw();
    champ.seedDrawPlayers();
    champ.startDraw();
    await repo.saveChampionshipState(id, champ);
    res.json(serializeChampionship(id, champ));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Groups ────────────────────────────────────────────────────────────────────

app.get('/api/championships/:id/groups', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });
    res.json(found.champ.groups.map(serializeGroup));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/championships/:id/groups/:name', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });
    const g = found.champ.groups.find((g) => g.name === req.params.name);
    if (!g) return res.status(404).json({ error: 'Group not found' });
    res.json(serializeGroup(g));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Group matches ─────────────────────────────────────────────────────────────

app.get('/api/championships/:id/groups/:name/matches', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });
    const g = found.champ.groups.find((g) => g.name === req.params.name);
    if (!g) return res.status(404).json({ error: 'Group not found' });
    res.json(g.matches.map(serializeGroupMatch));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/championships/:id/groups/:name/matches/:matchId  { result: "6-4" }
app.put('/api/championships/:id/groups/:name/matches/:matchId', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });
    const { champ, id } = found;
    const g = champ.groups.find((g) => g.name === req.params.name);
    if (!g) return res.status(404).json({ error: 'Group not found' });

    const matchIndex = parseInt(req.params.matchId, 10);
    const m = g.matches[matchIndex];
    if (!m) return res.status(404).json({ error: 'Match not found' });

    const { result } = req.body;
    if (!result) return res.status(400).json({ error: 'result is required (e.g. "6-4")' });

    m.result = result;

    if (g.matches.every((m) => m.result !== null)) {
      g.players.sort(Group.orderPlaces);
      g.orderPlayersByPlace();
    }

    await repo.saveChampionshipState(id, champ);
    res.json(serializeGroupMatch(m, matchIndex));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Draw matches ──────────────────────────────────────────────────────────────

app.get('/api/championships/:id/draw/matches', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });
    if (!found.champ.draw) return res.status(404).json({ error: 'Draw not created' });
    res.json(Array.from(found.champ.draw.matches.values()).map(serializePlayOffMatch));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/championships/:id/draw/matches/:matchId', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });
    if (!found.champ.draw) return res.status(404).json({ error: 'Draw not created' });
    const m = found.champ.draw.matches.get(req.params.matchId);
    if (!m) return res.status(404).json({ error: 'Match not found' });
    res.json(serializePlayOffMatch(m));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/championships/:id/draw/matches/:matchId  { result: "6-4" }
app.put('/api/championships/:id/draw/matches/:matchId', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });
    if (!found.champ.draw) return res.status(404).json({ error: 'Draw not created' });

    const { champ, id } = found;
    const m = champ.draw.matches.get(req.params.matchId);
    if (!m) return res.status(404).json({ error: 'Match not found' });

    const { result } = req.body;
    if (!result) return res.status(400).json({ error: 'result is required (e.g. "6-4")' });

    m.result = result;
    await repo.saveChampionshipState(id, champ);

    const isComplete = champ.draw.completedMatches === champ.draw.matches.size;
    if (champ.ligueLinked && !champ.ligueSynced && isComplete) {
      await repo.syncChampionshipToLigue(id, champ);
    }

    res.json(serializePlayOffMatch(m));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Ligue players ─────────────────────────────────────────────────────────────

app.get('/api/ligue', async (_req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const list = await repo.getAllLiguePlayers(playersMap);
    const ranking = new RankingBuilder().build(list.map(({ lp }) => lp));
    res.json(ranking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/ligue/players', async (_req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const list = await repo.getAllLiguePlayers(playersMap);
    res.json(list.map(({ id, lp }) => ({
      id,
      name: lp.player.name,
      points: lp.points,
      champsPlayed: lp.champs.length,
      champs: lp.champs,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ligue/players', async (req, res) => {
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId is required' });
  try {
    const p = await repo.getPlayerRow(String(playerId));
    if (!p) return res.status(404).json({ error: 'Player not found' });

    const existingId = await repo.findLiguePlayerByPlayerId(String(playerId));
    if (existingId)
      return res.status(409).json({ error: 'Player already in ligue', id: existingId });

    const id = await repo.createLiguePlayer(String(playerId));
    res.status(201).json({ id, name: p.name, points: 0, champsPlayed: 0, champs: [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/ligue/players/:id', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getLiguePlayerById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Ligue player not found' });
    const { id, lp } = found;
    res.json({ id, name: lp.player.name, points: lp.points, champsPlayed: lp.champs.length, champs: lp.champs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/ligue/players/:id  { points?: number, champId?: string }
app.put('/api/ligue/players/:id', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getLiguePlayerById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Ligue player not found' });

    const { points: pts, champId } = req.body;

    if (pts !== undefined) {
      await repo.updateLiguePlayerPoints(req.params.id, pts);
    }
    if (champId !== undefined) {
      const champName = await repo.getChampionshipName(String(champId));
      if (!champName) return res.status(404).json({ error: 'Championship not found' });
      await repo.appendLiguePlayerChamp(req.params.id, champName);
    }

    const updated = await repo.getLiguePlayerById(req.params.id, playersMap);
    const { id, lp } = updated;
    res.json({ id, name: lp.player.name, points: lp.points, champsPlayed: lp.champs.length, champs: lp.champs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/ligue/players/:id', async (req, res) => {
  try {
    const deleted = await repo.deleteLiguePlayer(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Ligue player not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  const migrate = require('./db/migrate');
  migrate()
    .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
    .catch((err) => { console.error('Migration failed', err); process.exit(1); });
}

module.exports = app;
