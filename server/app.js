const express = require('express');

const { Group } = require('../domain/models/Group');
const { RankingBuilder } = require('../domain/builders/ranking');
const repo = require('./db/repo');

const app = express();
app.use(express.json());

const AUTO_FILL_WINNING_SET_SCORES = [
  [7, 6],
  [7, 5],
  [6, 4],
  [6, 3],
  [6, 2],
  [6, 1],
  [6, 0],
];

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

const generateAutoResult = (setsToWin) => {
  const targetSets = [1, 2, 3].includes(Number(setsToWin)) ? Number(setsToWin) : 1;
  let p1Sets = 0;
  let p2Sets = 0;
  const sets = [];

  while (p1Sets < targetSets && p2Sets < targetSets) {
    const [winnerGames, loserGames] = pickRandom(AUTO_FILL_WINNING_SET_SCORES);
    const p1WinsSet = Math.random() >= 0.5;

    if (p1WinsSet) {
      sets.push(`${winnerGames}-${loserGames}`);
      p1Sets += 1;
    } else {
      sets.push(`${loserGames}-${winnerGames}`);
      p2Sets += 1;
    }
  }

  return sets.join(' ');
};

// ── Serializers ──────────────────────────────────────────────────────────────
const serializeSet = (set) => set ? set.toString() : null;

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
  setsToWin: c.setsToWin,
  ligueId: c.ligueId || null,
  pointsConfig: c.points ? { playoff: c.points, group: c.groupPoints } : null,
  players: c.players
    ? c.players.map((cp) => ({ id: cp.player?.id, name: cp.player?.name, points: cp.points }))
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

// ── Ligues ────────────────────────────────────────────────────────────────────

app.get('/api/ligues', async (_req, res) => {
  try {
    const list = await repo.getAllLigues();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ligues', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const ligue = await repo.createLigue(name);
    res.status(201).json(ligue);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/ligues/:id', async (req, res) => {
  try {
    const ligue = await repo.getLigueById(req.params.id);
    if (!ligue) return res.status(404).json({ error: 'Ligue not found' });
    res.json(ligue);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/ligues/:id', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const ligue = await repo.updateLigue(req.params.id, name);
    if (!ligue) return res.status(404).json({ error: 'Ligue not found' });
    res.json(ligue);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/ligues/:id', async (req, res) => {
  try {
    const deleted = await repo.deleteLigue(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Ligue not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ligues/:id/ranking
app.get('/api/ligues/:id/ranking', async (req, res) => {
  try {
    const ligue = await repo.getLigueById(req.params.id);
    if (!ligue) return res.status(404).json({ error: 'Ligue not found' });
    const playersMap = await repo.loadPlayersMap();
    const list = await repo.getAllLiguePlayers(req.params.id, playersMap);
    const ranking = new RankingBuilder().build(list.map(({ lp }) => lp));
    res.json(ranking);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/ligues/:id/players
app.get('/api/ligues/:id/players', async (req, res) => {
  try {
    const ligue = await repo.getLigueById(req.params.id);
    if (!ligue) return res.status(404).json({ error: 'Ligue not found' });
    const playersMap = await repo.loadPlayersMap();
    const list = await repo.getAllLiguePlayers(req.params.id, playersMap);
    res.json(list.map(({ id, lp }) => ({
      id,
      playerId: String(lp.player.id),
      name: lp.player.name,
      points: lp.points,
      champsPlayed: lp.champs.length,
      champs: lp.champs,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ligues/:id/players  { playerId }
app.post('/api/ligues/:id/players', async (req, res) => {
  try {
    const ligue = await repo.getLigueById(req.params.id);
    if (!ligue) return res.status(404).json({ error: 'Ligue not found' });
    res.status(405).json({
      error: 'Manual adding to ligue is disabled. Players are added from championship entry list.',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ligues/:id/players/batch  { playerIds: [id, ...] }
app.post('/api/ligues/:id/players/batch', async (req, res) => {
  try {
    const ligue = await repo.getLigueById(req.params.id);
    if (!ligue) return res.status(404).json({ error: 'Ligue not found' });
    res.status(405).json({
      error: 'Manual adding to ligue is disabled. Players are added from championship entry list.',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/ligues/:id/players/:playerId
app.delete('/api/ligues/:id/players/:playerId(\\d+)', async (req, res) => {
  try {
    const ligue = await repo.getLigueById(req.params.id);
    if (!ligue) return res.status(404).json({ error: 'Ligue not found' });

    const deleted = await repo.deleteLiguePlayerForLigue(req.params.id, req.params.playerId);
    if (!deleted) return res.status(404).json({ error: 'Ligue player not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/ligues/:id/players/batch  { liguePlayerIds: [id, ...] }
app.delete('/api/ligues/:id/players/batch', async (req, res) => {
  const { liguePlayerIds } = req.body;
  if (!Array.isArray(liguePlayerIds) || liguePlayerIds.length === 0) {
    return res.status(400).json({ error: 'liguePlayerIds array is required' });
  }
  try {
    const ligue = await repo.getLigueById(req.params.id);
    if (!ligue) return res.status(404).json({ error: 'Ligue not found' });

    const uniqueIds = [...new Set(liguePlayerIds.map((lpId) => String(lpId)))];
    const deleted = [];
    const missing = [];

    for (const lpId of uniqueIds) {
      const ok = await repo.deleteLiguePlayerForLigue(req.params.id, lpId);
      if (ok) deleted.push(lpId);
      else missing.push(lpId);
    }

    res.json({ deleted, missing });
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
  const { name, capacity, hasGroups = true, ligueId = null, pointsConfig = null, setsToWin = 1 } = req.body;
  if (!name || !capacity) return res.status(400).json({ error: 'name and capacity are required' });
  if (![1, 2, 3].includes(Number(setsToWin))) {
    return res.status(400).json({ error: 'setsToWin must be 1, 2 or 3' });
  }
  try {
    const { id, champ } = await repo.createChampionship(
      name,
      capacity,
      hasGroups,
      ligueId,
      pointsConfig,
      Number(setsToWin)
    );
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
  const { name, capacity, hasGroups, setsToWin } = req.body;
  if (setsToWin !== undefined && ![1, 2, 3].includes(Number(setsToWin))) {
    return res.status(400).json({ error: 'setsToWin must be 1, 2 or 3' });
  }
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });

    const { champ } = found;
    if (name !== undefined) champ.name = name;
    if (capacity !== undefined) champ.capacity = capacity;
    if (hasGroups !== undefined) champ.hasGroups = hasGroups;
    if (setsToWin !== undefined) champ.setsToWin = Number(setsToWin);

    await repo.updateChampionshipFields(req.params.id, { name, capacity, hasGroups, setsToWin });
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

    if (champ.ligueId) {
      await repo.ensureLiguePlayers(champ.ligueId, players.map((p) => p.id));
    }

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

    const { optimalGroupSize = 3, manualGroups = null } = req.body;
    if (Array.isArray(manualGroups) && manualGroups.length > 0) {
      champ.createGroupsManual(manualGroups);
    } else {
      champ.createGroups(optimalGroupSize);
    }
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
    if (!result) return res.status(400).json({ error: 'result is required (e.g. "6-2 4-6 7-5")' });

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

app.post('/api/championships/:id/groups/auto-fill', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });

    const { champ, id } = found;
    let filledMatches = 0;

    champ.groups.forEach((group) => {
      group.matches.forEach((match) => {
        if (match.result !== null) return;
        match.result = generateAutoResult(champ.setsToWin);
        filledMatches += 1;
      });

      if (group.matches.every((match) => match.result !== null)) {
        group.players.sort(Group.orderPlaces);
        group.orderPlayersByPlace();
      }
    });

    await repo.saveChampionshipState(id, champ);
    res.json({
      filledMatches,
      groups: champ.groups.map(serializeGroup),
    });
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
    if (!result) return res.status(400).json({ error: 'result is required (e.g. "6-2 4-6 7-5")' });

    m.result = result;
    await repo.saveChampionshipState(id, champ);

    const isComplete = champ.draw.completedMatches === champ.draw.matches.size;
    if (champ.ligueId && !champ.ligueSynced && isComplete) {
      await repo.syncChampionshipToLigue(id, champ);
    }

    res.json(serializePlayOffMatch(m));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/championships/:id/draw/auto-fill', async (req, res) => {
  try {
    const playersMap = await repo.loadPlayersMap();
    const found = await repo.getChampionshipById(req.params.id, playersMap);
    if (!found) return res.status(404).json({ error: 'Championship not found' });
    if (!found.champ.draw) return res.status(404).json({ error: 'Draw not created' });

    const { champ, id } = found;
    let filledMatches = 0;
    let guard = champ.draw.matches.size * 4;

    while (guard > 0) {
      const readyMatches = Array.from(champ.draw.matches.values()).filter((match) =>
        !match.result &&
        match.player1 &&
        !match.player1.isBye &&
        match.player2 &&
        !match.player2.isBye
      );

      if (readyMatches.length === 0) break;

      readyMatches.forEach((match) => {
        match.result = generateAutoResult(champ.setsToWin);
        filledMatches += 1;
      });
      guard -= 1;
    }

    await repo.saveChampionshipState(id, champ);

    const isComplete = champ.draw.completedMatches === champ.draw.matches.size;
    if (champ.ligueId && !champ.ligueSynced && isComplete) {
      await repo.syncChampionshipToLigue(id, champ);
    }

    res.json({
      filledMatches,
      draw: {
        completedMatches: champ.draw.completedMatches,
        totalMatches: champ.draw.matches.size,
        matches: Array.from(champ.draw.matches.values()).map(serializePlayOffMatch),
      },
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
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
