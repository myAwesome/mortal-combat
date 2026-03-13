const express = require('express');

const { Player } = require('../domain/models/Player');
const { Championship } = require('../domain/models/Championship');
const { Group } = require('../domain/models/Group');
const { LiguePlayer } = require('../domain/models/LiguePlayer');
const { RankingBuilder } = require('../domain/builders/ranking');
const { points, groupPoints } = require('../domain/models/mocks');

const app = express();
app.use(express.json());

// ── In-memory store ──────────────────────────────────────────────────────────
let nextId = 1;
const newId = () => String(nextId++);

const store = {
  players: new Map(),        // id → Player
  championships: new Map(),  // id → Championship
  liguePlayers: new Map(),   // id → LiguePlayer
};

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

app.get('/api/players', (_req, res) => {
  const list = Array.from(store.players.entries()).map(([id, p]) => ({ id, name: p.name }));
  res.json(list);
});

app.post('/api/players', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const id = newId();
  store.players.set(id, new Player(name));
  res.status(201).json({ id, name });
});

app.get('/api/players/:id', (req, res) => {
  const p = store.players.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  res.json({ id: req.params.id, name: p.name });
});

app.put('/api/players/:id', (req, res) => {
  const p = store.players.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Player not found' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  p.name = name;
  res.json({ id: req.params.id, name: p.name });
});

app.delete('/api/players/:id', (req, res) => {
  if (!store.players.delete(req.params.id))
    return res.status(404).json({ error: 'Player not found' });
  res.status(204).send();
});

// ── Championships ─────────────────────────────────────────────────────────────

app.get('/api/championships', (_req, res) => {
  res.json(Array.from(store.championships.entries()).map(([id, c]) => serializeChampionship(id, c)));
});

app.post('/api/championships', (req, res) => {
  const { name, capacity, hasGroups = true } = req.body;
  if (!name || !capacity) return res.status(400).json({ error: 'name and capacity are required' });
  const id = newId();
  const champ = new Championship(name, capacity, hasGroups);
  champ.points = points;
  champ.groupPoints = groupPoints;
  store.championships.set(id, champ);
  res.status(201).json(serializeChampionship(id, champ));
});

app.get('/api/championships/:id', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  res.json(serializeChampionship(req.params.id, c));
});

app.put('/api/championships/:id', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  const { name, capacity, hasGroups } = req.body;
  if (name !== undefined) c.name = name;
  if (capacity !== undefined) c.capacity = capacity;
  if (hasGroups !== undefined) c.hasGroups = hasGroups;
  res.json(serializeChampionship(req.params.id, c));
});

app.delete('/api/championships/:id', (req, res) => {
  if (!store.championships.delete(req.params.id))
    return res.status(404).json({ error: 'Championship not found' });
  res.status(204).send();
});

// ── Championship actions ──────────────────────────────────────────────────────

// POST /api/championships/:id/entry-list  { playerIds: [id, ...] }
app.post('/api/championships/:id/entry-list', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });

  const { playerIds } = req.body;
  if (!Array.isArray(playerIds) || playerIds.length === 0)
    return res.status(400).json({ error: 'playerIds array is required' });

  const players = [];
  for (const pid of playerIds) {
    const p = store.players.get(String(pid));
    if (!p) return res.status(404).json({ error: `Player ${pid} not found` });
    players.push(p);
  }

  c.entryList = players;
  res.json(serializeChampionship(req.params.id, c));
});

// POST /api/championships/:id/groups  { optimalGroupSize?: number }
app.post('/api/championships/:id/groups', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  if (!c.players) return res.status(400).json({ error: 'Entry list not set' });

  const { optimalGroupSize = 3 } = req.body;
  try {
    c.createGroups(optimalGroupSize);
    res.json(serializeChampionship(req.params.id, c));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/championships/:id/draw
app.post('/api/championships/:id/draw', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  try {
    c.createDraw();
    res.json(serializeChampionship(req.params.id, c));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/championships/:id/draw/start  — seed qualified players into draw
app.post('/api/championships/:id/draw/start', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  if (!c.draw) return res.status(400).json({ error: 'Draw not created yet' });
  try {
    if (c.hasGroups) {
      c.addPointsAccordingToPlace();
      c.joinedGroupsResult = c.createJoinedGroupsResult(c.groups);
    }
    c.prepareQualifiersForDraw();
    c.seedDrawPlayers();
    c.startDraw();
    res.json(serializeChampionship(req.params.id, c));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Groups ────────────────────────────────────────────────────────────────────

app.get('/api/championships/:id/groups', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  res.json(c.groups.map(serializeGroup));
});

app.get('/api/championships/:id/groups/:name', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  const g = c.groups.find((g) => g.name === req.params.name);
  if (!g) return res.status(404).json({ error: 'Group not found' });
  res.json(serializeGroup(g));
});

// ── Group matches ─────────────────────────────────────────────────────────────

app.get('/api/championships/:id/groups/:name/matches', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  const g = c.groups.find((g) => g.name === req.params.name);
  if (!g) return res.status(404).json({ error: 'Group not found' });
  res.json(g.matches.map(serializeGroupMatch));
});

// PUT /api/championships/:id/groups/:name/matches/:matchId  { result: "6-4" }
app.put('/api/championships/:id/groups/:name/matches/:matchId', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  const g = c.groups.find((g) => g.name === req.params.name);
  if (!g) return res.status(404).json({ error: 'Group not found' });

  const matchIndex = parseInt(req.params.matchId, 10);
  const m = g.matches[matchIndex];
  if (!m) return res.status(404).json({ error: 'Match not found' });

  const { result } = req.body;
  if (!result) return res.status(400).json({ error: 'result is required (e.g. "6-4")' });

  try {
    m.result = result;

    if (g.matches.every((m) => m.result !== null)) {
      g.players.sort(Group.orderPlaces);
      g.orderPlayersByPlace();
    }

    res.json(serializeGroupMatch(m, matchIndex));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Draw matches ──────────────────────────────────────────────────────────────

app.get('/api/championships/:id/draw/matches', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  if (!c.draw) return res.status(404).json({ error: 'Draw not created' });
  res.json(Array.from(c.draw.matches.values()).map(serializePlayOffMatch));
});

app.get('/api/championships/:id/draw/matches/:matchId', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  if (!c.draw) return res.status(404).json({ error: 'Draw not created' });
  const m = c.draw.matches.get(req.params.matchId);
  if (!m) return res.status(404).json({ error: 'Match not found' });
  res.json(serializePlayOffMatch(m));
});

// PUT /api/championships/:id/draw/matches/:matchId  { result: "6-4" }
app.put('/api/championships/:id/draw/matches/:matchId', (req, res) => {
  const c = store.championships.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Championship not found' });
  if (!c.draw) return res.status(404).json({ error: 'Draw not created' });
  const m = c.draw.matches.get(req.params.matchId);
  if (!m) return res.status(404).json({ error: 'Match not found' });

  const { result } = req.body;
  if (!result) return res.status(400).json({ error: 'result is required (e.g. "6-4")' });

  try {
    m.result = result;
    res.json(serializePlayOffMatch(m));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Ligue players ─────────────────────────────────────────────────────────────

app.get('/api/ligue', (_req, res) => {
  const ranking = new RankingBuilder().build(Array.from(store.liguePlayers.values()));
  res.json(ranking);
});

app.get('/api/ligue/players', (_req, res) => {
  const list = Array.from(store.liguePlayers.entries()).map(([id, lp]) => ({
    id,
    name: lp.player.name,
    points: lp.points,
    champsPlayed: lp.champs.length,
    champs: lp.champs,
  }));
  res.json(list);
});

app.post('/api/ligue/players', (req, res) => {
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: 'playerId is required' });

  const p = store.players.get(String(playerId));
  if (!p) return res.status(404).json({ error: 'Player not found' });

  const existing = Array.from(store.liguePlayers.entries()).find(([, lp]) => lp.player === p);
  if (existing) return res.status(409).json({ error: 'Player already in ligue', id: existing[0] });

  const id = newId();
  store.liguePlayers.set(id, new LiguePlayer(p));
  res.status(201).json({ id, name: p.name, points: 0, champsPlayed: 0, champs: [] });
});

app.get('/api/ligue/players/:id', (req, res) => {
  const lp = store.liguePlayers.get(req.params.id);
  if (!lp) return res.status(404).json({ error: 'Ligue player not found' });
  res.json({ id: req.params.id, name: lp.player.name, points: lp.points, champsPlayed: lp.champs.length, champs: lp.champs });
});

// PUT /api/ligue/players/:id  { points?: number, champId?: string }
app.put('/api/ligue/players/:id', (req, res) => {
  const lp = store.liguePlayers.get(req.params.id);
  if (!lp) return res.status(404).json({ error: 'Ligue player not found' });

  const { points: pts, champId } = req.body;
  if (pts !== undefined) lp.points += pts;
  if (champId !== undefined) {
    const c = store.championships.get(String(champId));
    if (!c) return res.status(404).json({ error: 'Championship not found' });
    lp.champs.push(c.name);
  }

  res.json({ id: req.params.id, name: lp.player.name, points: lp.points, champsPlayed: lp.champs.length, champs: lp.champs });
});

app.delete('/api/ligue/players/:id', (req, res) => {
  if (!store.liguePlayers.delete(req.params.id))
    return res.status(404).json({ error: 'Ligue player not found' });
  res.status(204).send();
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
