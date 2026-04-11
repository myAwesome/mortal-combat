const db = require('./connection');
const { Player } = require('../../domain/models/Player');
const { Championship } = require('../../domain/models/Championship');
const { ChampionshipPlayer } = require('../../domain/models/ChampionshipPlayer');
const { Group } = require('../../domain/models/Group');
const { GroupPlayer } = require('../../domain/models/GroupPlayer');
const { GroupMatch } = require('../../domain/models/GroupMatch');
const { Draw } = require('../../domain/models/Draw');
const { PlayOffPlayer } = require('../../domain/models/PlayOffPlayer');
const { LiguePlayer } = require('../../domain/models/LiguePlayer');
const { TennisSet } = require('../../domain/models/TennisSet');
const { points: defaultPoints, groupPoints: defaultGroupPoints } = require('../../domain/models/mocks');

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePlayer(row) {
  const p = new Player(row.name);
  p.id = String(row.id);
  return p;
}

async function loadPlayersMap() {
  const [rows] = await db.query('SELECT id, name FROM players');
  const map = new Map();
  for (const r of rows) map.set(String(r.id), makePlayer(r));
  return map;
}

// ── Championship serialization ────────────────────────────────────────────────

function serializeChampionshipState(champ) {
  const state = {};

  if (champ.players !== null) {
    state.players = champ.players.map(cp => ({
      id: cp.player.id,
      points: cp.points,
    }));
  }

  if (champ.groups && champ.groups.length > 0) {
    state.groups = champ.groups.map(g => ({
      name: g.name,
      capacity: g.capacity,
      players: g.players.map(gp => ({
        id: gp.player.id,
        win: gp.groupMetadata.win,
        loose: gp.groupMetadata.loose,
        points: gp.groupMetadata.points,
        place: gp.groupMetadata.place,
        group: gp.groupMetadata.group,
      })),
      matches: g.matches.map(m => ({
        p1Id: m.player1.player.id,
        p2Id: m.player2.player.id,
        result: m.result ? m.result.toString() : null,
      })),
    }));
  }

  if (champ.draw) {
    const matchesObj = {};
    for (const [id, m] of champ.draw.matches) {
      matchesObj[id] = {
        player1Id: m.player1 && !m.player1.isBye ? m.player1.player.id : null,
        player1IsBye: m.player1 ? m.player1.isBye : false,
        player2Id: m.player2 && !m.player2.isBye ? m.player2.player.id : null,
        player2IsBye: m.player2 ? m.player2.isBye : false,
        result: m.result ? m.result.toString() : null,
        winnerId: m.winner && !m.winner.isBye ? m.winner.player.id : null,
        loserId: m.loser && !m.loser.isBye ? m.loser.player.id : null,
      };
    }
    state.draw = {
      capacity: champ.draw.capacity,
      qualifiers: champ.draw.qualifiers,
      emptySlots: champ.draw.emptySlots,
      completedMatches: champ.draw.completedMatches,
      placesPriority: champ.draw.placesPriority,
      matches: matchesObj,
    };
  }

  return JSON.stringify(state);
}

function deserializeChampionshipState(row, playersMap) {
  const setsToWin = row.sets_to_win ? Number(row.sets_to_win) : 1;
  const drawConfig = row.draw_config_json ? JSON.parse(row.draw_config_json) : null;
  const champ = new Championship(row.name, row.capacity, !!row.has_groups, setsToWin, drawConfig);
  champ.ligueId = row.ligue_id ? String(row.ligue_id) : null;
  champ.ligueSynced = !!row.ligue_synced;

  const config = row.points_config_json ? JSON.parse(row.points_config_json) : null;
  champ.points = config ? config.playoff : defaultPoints;
  champ.groupPoints = config ? config.group : defaultGroupPoints;

  if (!row.state_json) return champ;

  const state = JSON.parse(row.state_json);

  if (state.players) {
    champ.players = state.players.map(sp => {
      const cp = new ChampionshipPlayer(playersMap.get(String(sp.id)));
      cp.points = sp.points;
      return cp;
    });
  }

  if (state.groups && state.groups.length > 0) {
    champ.groups = state.groups.map(sg => {
      const g = new Group(sg.name);
      g.capacity = sg.capacity;
      g.players = sg.players.map(sp => {
        const gp = new GroupPlayer(playersMap.get(String(sp.id)));
        gp.groupMetadata.win = sp.win;
        gp.groupMetadata.loose = sp.loose;
        gp.groupMetadata.points = sp.points;
        gp.groupMetadata.place = sp.place;
        gp.groupMetadata.group = sp.group;
        return gp;
      });
      const gpById = new Map(sg.players.map((sp, i) => [String(sp.id), g.players[i]]));
      g.matches = sg.matches.map(sm => {
        const gm = new GroupMatch({
          player1: gpById.get(String(sm.p1Id)),
          player2: gpById.get(String(sm.p2Id)),
          setsToWin: champ.setsToWin,
        });
        if (sm.result) {
          gm.__result = new TennisSet(sm.result, champ.setsToWin);
          gm.winner = gm.__result.p1Wins() ? gm.player1 : gm.player2;
          gm.loser = gm.__result.p1Wins() ? gm.player2 : gm.player1;
        }
        return gm;
      });
      return g;
    });
    champ.groupsLength = champ.groups.length;
  }

  if (state.draw) {
    const sd = state.draw;
    const draw = new Draw(sd.capacity, champ);
    draw.createMatches(sd.capacity);
    draw.qualifiers = sd.qualifiers;
    draw.emptySlots = sd.emptySlots;
    draw.completedMatches = sd.completedMatches;
    draw.placesPriority = sd.placesPriority;

    for (const [matchId, sm] of Object.entries(sd.matches)) {
      const m = draw.matches.get(matchId);
      if (!m) continue;

      if (sm.player1IsBye) {
        m.player1 = new PlayOffPlayer({ name: 'bye' }, true);
      } else if (sm.player1Id != null) {
        m.player1 = new PlayOffPlayer(playersMap.get(String(sm.player1Id)), false);
      }

      if (sm.player2IsBye) {
        m.player2 = new PlayOffPlayer({ name: 'bye' }, true);
      } else if (sm.player2Id != null) {
        m.player2 = new PlayOffPlayer(playersMap.get(String(sm.player2Id)), false);
      }

      if (sm.result) {
        m.__result = new TennisSet(sm.result, champ.setsToWin);
        if (sm.winnerId) {
          const p1IsWinner = m.player1 && !m.player1.isBye &&
            String(m.player1.player.id) === String(sm.winnerId);
          m.winner = p1IsWinner ? m.player1 : m.player2;
          m.loser = p1IsWinner ? m.player2 : m.player1;
        } else if (m.player1 && m.player1.isBye) {
          m.winner = m.player2;
          m.loser = m.player1;
        } else if (m.player2 && m.player2.isBye) {
          m.winner = m.player1;
          m.loser = m.player2;
        }
      }
    }

    champ.draw = draw;
  }

  return champ;
}

// ── Players ───────────────────────────────────────────────────────────────────

async function getAllPlayersList() {
  const [rows] = await db.query('SELECT id, name FROM players');
  return rows.map(r => ({ id: String(r.id), name: r.name }));
}

async function getPlayerRow(id) {
  const [rows] = await db.query('SELECT id, name FROM players WHERE id = ?', [id]);
  return rows[0] ? { id: String(rows[0].id), name: rows[0].name } : null;
}

async function createPlayer(name) {
  const [result] = await db.query('INSERT INTO players (name) VALUES (?)', [name]);
  return { id: String(result.insertId), name };
}

async function updatePlayer(id, name) {
  const [result] = await db.query('UPDATE players SET name = ? WHERE id = ?', [name, id]);
  return result.affectedRows > 0 ? { id: String(id), name } : null;
}

async function deletePlayer(id) {
  const [result] = await db.query('DELETE FROM players WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// ── Championships ─────────────────────────────────────────────────────────────

async function getAllChampionships(playersMap) {
  const [rows] = await db.query(
    'SELECT id, name, capacity, has_groups, ligue_id, ligue_synced, points_config_json, sets_to_win, draw_config_json, state_json FROM championships'
  );
  return rows.map(r => ({
    id: String(r.id),
    champ: deserializeChampionshipState(r, playersMap),
  }));
}

async function getChampionshipById(id, playersMap) {
  const [rows] = await db.query(
    'SELECT id, name, capacity, has_groups, ligue_id, ligue_synced, points_config_json, sets_to_win, draw_config_json, state_json FROM championships WHERE id = ?',
    [id]
  );
  if (!rows[0]) return null;
  return { id: String(rows[0].id), champ: deserializeChampionshipState(rows[0], playersMap) };
}

async function getChampionshipName(id) {
  const [rows] = await db.query('SELECT name FROM championships WHERE id = ?', [id]);
  return rows[0] ? rows[0].name : null;
}

async function createChampionship(
  name,
  capacity,
  hasGroups,
  ligueId = null,
  pointsConfig = null,
  setsToWin = 1,
  drawConfig = null
) {
  const configJson = pointsConfig ? JSON.stringify(pointsConfig) : null;
  const drawConfigJson = drawConfig ? JSON.stringify(drawConfig) : null;
  const [result] = await db.query(
    'INSERT INTO championships (name, capacity, has_groups, ligue_id, points_config_json, sets_to_win, draw_config_json) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, capacity, hasGroups ? 1 : 0, ligueId || null, configJson, Number(setsToWin), drawConfigJson]
  );
  const id = String(result.insertId);
  const champ = new Championship(name, capacity, hasGroups, Number(setsToWin), drawConfig);
  champ.points = pointsConfig ? pointsConfig.playoff : defaultPoints;
  champ.groupPoints = pointsConfig ? pointsConfig.group : defaultGroupPoints;
  champ.ligueId = ligueId ? String(ligueId) : null;
  champ.ligueSynced = false;
  return { id, champ };
}

async function updateChampionshipFields(id, updates) {
  const parts = [];
  const params = [];
  if (updates.name !== undefined)      { parts.push('name = ?');       params.push(updates.name); }
  if (updates.capacity !== undefined)  { parts.push('capacity = ?');   params.push(updates.capacity); }
  if (updates.hasGroups !== undefined) { parts.push('has_groups = ?'); params.push(updates.hasGroups ? 1 : 0); }
  if (updates.setsToWin !== undefined) { parts.push('sets_to_win = ?'); params.push(Number(updates.setsToWin)); }
  if (parts.length === 0) return true;
  params.push(id);
  const [result] = await db.query(
    `UPDATE championships SET ${parts.join(', ')} WHERE id = ?`,
    params
  );
  return result.affectedRows > 0;
}

async function saveChampionshipState(id, champ) {
  await db.query(
    'UPDATE championships SET state_json = ? WHERE id = ?',
    [serializeChampionshipState(champ), id]
  );
}

async function deleteChampionship(id) {
  const [result] = await db.query('DELETE FROM championships WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// ── Ligues ────────────────────────────────────────────────────────────────────

async function getAllLigues() {
  const [rows] = await db.query('SELECT id, name FROM ligues');
  return rows.map(r => ({ id: String(r.id), name: r.name }));
}

async function getLigueById(id) {
  const [rows] = await db.query('SELECT id, name FROM ligues WHERE id = ?', [id]);
  return rows[0] ? { id: String(rows[0].id), name: rows[0].name } : null;
}

async function createLigue(name) {
  const [result] = await db.query('INSERT INTO ligues (name) VALUES (?)', [name]);
  return { id: String(result.insertId), name };
}

async function updateLigue(id, name) {
  const [result] = await db.query('UPDATE ligues SET name = ? WHERE id = ?', [name, id]);
  return result.affectedRows > 0 ? { id: String(id), name } : null;
}

async function deleteLigue(id) {
  const [result] = await db.query('DELETE FROM ligues WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

// ── Ligue players ─────────────────────────────────────────────────────────────

function makeLiguePlayer(row, playersMap) {
  const player = playersMap.get(String(row.player_id));
  const lp = new LiguePlayer(player);
  lp.points = row.points;
  lp.champs = JSON.parse(row.champs_json || '[]');
  return lp;
}

async function getAllLiguePlayers(ligueId, playersMap) {
  const [rows] = await db.query(
    'SELECT id, player_id, points, champs_json FROM ligue_players WHERE ligue_id = ?',
    [ligueId]
  );
  return rows.map(r => ({ id: String(r.id), lp: makeLiguePlayer(r, playersMap) }));
}

async function getLiguePlayerById(id, playersMap) {
  const [rows] = await db.query(
    'SELECT id, player_id, points, champs_json FROM ligue_players WHERE id = ?',
    [id]
  );
  if (!rows[0]) return null;
  return { id: String(rows[0].id), lp: makeLiguePlayer(rows[0], playersMap) };
}

async function findLiguePlayerByPlayerId(playerId, ligueId) {
  const [rows] = await db.query(
    'SELECT id FROM ligue_players WHERE player_id = ? AND ligue_id = ?',
    [playerId, ligueId]
  );
  return rows[0] ? String(rows[0].id) : null;
}

async function createLiguePlayer(playerId, ligueId) {
  const [result] = await db.query(
    "INSERT INTO ligue_players (player_id, ligue_id, points, champs_json) VALUES (?, ?, 0, '[]')",
    [playerId, ligueId]
  );
  return String(result.insertId);
}

async function ensureLiguePlayers(ligueId, playerIds) {
  const uniquePlayerIds = [...new Set(playerIds.map((playerId) => String(playerId)))];
  for (const playerId of uniquePlayerIds) {
    const existingId = await findLiguePlayerByPlayerId(playerId, ligueId);
    if (!existingId) {
      await createLiguePlayer(playerId, ligueId);
    }
  }
}

async function updateLiguePlayerPoints(id, addPoints) {
  await db.query(
    'UPDATE ligue_players SET points = points + ? WHERE id = ?',
    [addPoints, id]
  );
}

async function appendLiguePlayerChamp(id, champName) {
  const [rows] = await db.query(
    'SELECT champs_json FROM ligue_players WHERE id = ?',
    [id]
  );
  if (!rows[0]) return false;
  const champs = JSON.parse(rows[0].champs_json || '[]');
  champs.push(champName);
  await db.query(
    'UPDATE ligue_players SET champs_json = ? WHERE id = ?',
    [JSON.stringify(champs), id]
  );
  return true;
}

async function syncChampionshipToLigue(champId, champ) {
  if (!champ.ligueId) return;
  for (const cp of champ.players) {
    const liguePlayerId = await findLiguePlayerByPlayerId(cp.player.id, champ.ligueId);
    if (!liguePlayerId) continue;
    await updateLiguePlayerPoints(liguePlayerId, cp.points);
    await appendLiguePlayerChamp(liguePlayerId, champ.name);
  }
  await db.query('UPDATE championships SET ligue_synced = 1 WHERE id = ?', [champId]);
}

async function deleteLiguePlayer(id) {
  const [result] = await db.query('DELETE FROM ligue_players WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function deleteLiguePlayerForLigue(ligueId, id) {
  const [result] = await db.query(
    'DELETE FROM ligue_players WHERE id = ? AND ligue_id = ?',
    [id, ligueId]
  );
  return result.affectedRows > 0;
}

// ── Utility ───────────────────────────────────────────────────────────────────

async function truncateAll() {
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  await db.query('TRUNCATE TABLE ligue_players');
  await db.query('TRUNCATE TABLE championships');
  await db.query('TRUNCATE TABLE ligues');
  await db.query('TRUNCATE TABLE players');
  await db.query('SET FOREIGN_KEY_CHECKS = 1');
}

module.exports = {
  loadPlayersMap,
  getAllPlayersList,
  getPlayerRow,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getAllChampionships,
  getChampionshipById,
  getChampionshipName,
  createChampionship,
  updateChampionshipFields,
  saveChampionshipState,
  deleteChampionship,
  getAllLigues,
  getLigueById,
  createLigue,
  updateLigue,
  deleteLigue,
  getAllLiguePlayers,
  getLiguePlayerById,
  findLiguePlayerByPlayerId,
  createLiguePlayer,
  ensureLiguePlayers,
  updateLiguePlayerPoints,
  appendLiguePlayerChamp,
  syncChampionshipToLigue,
  deleteLiguePlayer,
  deleteLiguePlayerForLigue,
  truncateAll,
};
