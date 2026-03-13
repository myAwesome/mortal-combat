const request = require('supertest');
const app = require('../app');
const migrate = require('../db/migrate');
const repo = require('../db/repo');
const pool = require('../db/connection');

beforeAll(async () => {
  await migrate();
  await repo.truncateAll();
});

afterAll(async () => {
  await pool.end();
});

// ── Players ───────────────────────────────────────────────────────────────────

describe('Players API', () => {
  let id;

  test('POST /api/players - creates a player', async () => {
    const res = await request(app).post('/api/players').send({ name: 'Roger Federer' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Roger Federer');
    expect(res.body.id).toBeDefined();
    id = res.body.id;
  });

  test('GET /api/players - lists players', async () => {
    const res = await request(app).get('/api/players');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find((p) => p.id === id)).toBeDefined();
  });

  test('GET /api/players/:id - gets player by id', async () => {
    const res = await request(app).get(`/api/players/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Roger Federer');
  });

  test('PUT /api/players/:id - updates player name', async () => {
    const res = await request(app).put(`/api/players/${id}`).send({ name: 'RF' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('RF');
  });

  test('DELETE /api/players/:id - deletes player', async () => {
    const res = await request(app).delete(`/api/players/${id}`);
    expect(res.status).toBe(204);
  });

  test('GET /api/players/:id - 404 after deletion', async () => {
    const res = await request(app).get(`/api/players/${id}`);
    expect(res.status).toBe(404);
  });

  test('POST /api/players - 400 without name', async () => {
    const res = await request(app).post('/api/players').send({});
    expect(res.status).toBe(400);
  });

  test('PUT /api/players/:id - 404 for unknown id', async () => {
    const res = await request(app).put('/api/players/999').send({ name: 'X' });
    expect(res.status).toBe(404);
  });
});

// ── Championships CRUD ────────────────────────────────────────────────────────

describe('Championships API - CRUD', () => {
  let id;

  test('POST /api/championships - creates championship', async () => {
    const res = await request(app)
      .post('/api/championships')
      .send({ name: 'Test Open', capacity: 9 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Open');
    expect(res.body.id).toBeDefined();
    id = res.body.id;
  });

  test('GET /api/championships - lists championships', async () => {
    const res = await request(app).get('/api/championships');
    expect(res.status).toBe(200);
    expect(res.body.find((c) => c.id === id)).toBeDefined();
  });

  test('GET /api/championships/:id - gets championship', async () => {
    const res = await request(app).get(`/api/championships/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Test Open');
    expect(res.body.capacity).toBe(9);
  });

  test('PUT /api/championships/:id - updates championship', async () => {
    const res = await request(app)
      .put(`/api/championships/${id}`)
      .send({ name: 'Updated Open' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Open');
  });

  test('DELETE /api/championships/:id - deletes championship', async () => {
    const res = await request(app).delete(`/api/championships/${id}`);
    expect(res.status).toBe(204);
  });

  test('GET /api/championships/:id - 404 after deletion', async () => {
    const res = await request(app).get(`/api/championships/${id}`);
    expect(res.status).toBe(404);
  });

  test('POST /api/championships - 400 without name', async () => {
    const res = await request(app)
      .post('/api/championships')
      .send({ capacity: 9 });
    expect(res.status).toBe(400);
  });
});

// ── Full tournament flow ──────────────────────────────────────────────────────

describe('Full tournament flow', () => {
  const playerNames = [
    'Federer', 'Nadal', 'Djokovic', 'Murray',
    'Wawrinka', 'Cilic', 'Berdych', 'Tsonga', 'Ferrer',
  ];
  let playerIds = [];
  let champId;

  beforeAll(async () => {
    for (const name of playerNames) {
      const res = await request(app).post('/api/players').send({ name });
      playerIds.push(res.body.id);
    }
    const res = await request(app)
      .post('/api/championships')
      .send({ name: 'Grand Slam', capacity: 9, hasGroups: true });
    champId = res.body.id;
  });

  test('POST entry-list - adds players to championship', async () => {
    const res = await request(app)
      .post(`/api/championships/${champId}/entry-list`)
      .send({ playerIds });
    expect(res.status).toBe(200);
    expect(res.body.players).toHaveLength(9);
  });

  test('POST groups - creates group stage', async () => {
    const res = await request(app)
      .post(`/api/championships/${champId}/groups`)
      .send({ optimalGroupSize: 3 });
    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(3);
    expect(res.body.groups[0].name).toBe('A');
  });

  test('POST draw - creates playoff draw', async () => {
    const res = await request(app).post(`/api/championships/${champId}/draw`);
    expect(res.status).toBe(200);
    expect(res.body.draw).toBeDefined();
  });

  test('GET groups - lists all groups', async () => {
    const res = await request(app).get(`/api/championships/${champId}/groups`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  test('GET groups/:name - gets a specific group', async () => {
    const res = await request(app).get(`/api/championships/${champId}/groups/A`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('A');
    expect(res.body.players).toHaveLength(3);
    expect(res.body.matches).toHaveLength(3);
  });

  test('GET groups/:name/matches - lists group matches', async () => {
    const res = await request(app).get(
      `/api/championships/${champId}/groups/A/matches`
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toMatchObject({ player1: expect.any(String), player2: expect.any(String) });
  });

  test('PUT groups/:name/matches/:id - records all group results', async () => {
    const groupsRes = await request(app).get(`/api/championships/${champId}/groups`);
    for (const group of groupsRes.body) {
      const matchesRes = await request(app).get(
        `/api/championships/${champId}/groups/${group.name}/matches`
      );
      for (let i = 0; i < matchesRes.body.length; i++) {
        const res = await request(app)
          .put(`/api/championships/${champId}/groups/${group.name}/matches/${i}`)
          .send({ result: '6-4' });
        expect(res.status).toBe(200);
        expect(res.body.result).toBe('6-4');
      }
    }
  });

  test('PUT groups/:name/matches/:id - 400 without result', async () => {
    const res = await request(app)
      .put(`/api/championships/${champId}/groups/A/matches/0`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('POST draw/start - seeds and starts playoff', async () => {
    const res = await request(app).post(`/api/championships/${champId}/draw/start`);
    expect(res.status).toBe(200);
    expect(res.body.draw.matches.length).toBeGreaterThan(0);
  });

  test('GET draw/matches - lists playoff matches', async () => {
    const res = await request(app).get(`/api/championships/${champId}/draw/matches`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET draw/matches/:matchId - gets specific match', async () => {
    const listRes = await request(app).get(`/api/championships/${champId}/draw/matches`);
    const firstMatch = listRes.body[0];
    const res = await request(app).get(
      `/api/championships/${champId}/draw/matches/${firstMatch.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(firstMatch.id);
  });

  test('PUT draw/matches/:matchId - records playoff results round by round', async () => {
    let matchesRes = await request(app).get(`/api/championships/${champId}/draw/matches`);
    const rounds = [...new Set(matchesRes.body.map((m) => m.playersInRound))].sort(
      (a, b) => b - a
    );

    for (const round of rounds) {
      matchesRes = await request(app).get(`/api/championships/${champId}/draw/matches`);
      const pending = matchesRes.body.filter(
        (m) =>
          m.playersInRound === round &&
          m.player1 &&
          m.player2 &&
          m.result === null
      );
      for (const match of pending) {
        const res = await request(app)
          .put(`/api/championships/${champId}/draw/matches/${match.id}`)
          .send({ result: '6-4' });
        expect(res.status).toBe(200);
        expect(res.body.result).toBe('6-4');
      }
    }
  });
});

// ── Ligue API ─────────────────────────────────────────────────────────────────

describe('Ligue API', () => {
  let playerId, liguePlayerId;

  beforeAll(async () => {
    const res = await request(app).post('/api/players').send({ name: 'Ligue Star' });
    playerId = res.body.id;
  });

  test('POST /api/ligue/players - adds player to ligue', async () => {
    const res = await request(app).post('/api/ligue/players').send({ playerId });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Ligue Star');
    expect(res.body.points).toBe(0);
    liguePlayerId = res.body.id;
  });

  test('POST /api/ligue/players - 409 if player already in ligue', async () => {
    const res = await request(app).post('/api/ligue/players').send({ playerId });
    expect(res.status).toBe(409);
  });

  test('GET /api/ligue/players - lists ligue players', async () => {
    const res = await request(app).get('/api/ligue/players');
    expect(res.status).toBe(200);
    expect(res.body.find((lp) => lp.id === liguePlayerId)).toBeDefined();
  });

  test('GET /api/ligue/players/:id - gets ligue player', async () => {
    const res = await request(app).get(`/api/ligue/players/${liguePlayerId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Ligue Star');
  });

  test('PUT /api/ligue/players/:id - adds points', async () => {
    const res = await request(app)
      .put(`/api/ligue/players/${liguePlayerId}`)
      .send({ points: 250 });
    expect(res.status).toBe(200);
    expect(res.body.points).toBe(250);
  });

  test('GET /api/ligue - returns sorted ranking', async () => {
    const res = await request(app).get('/api/ligue');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/ligue/players/:id - 404 for unknown id', async () => {
    const res = await request(app).get('/api/ligue/players/999');
    expect(res.status).toBe(404);
  });

  test('DELETE /api/ligue/players/:id - removes from ligue', async () => {
    const res = await request(app).delete(`/api/ligue/players/${liguePlayerId}`);
    expect(res.status).toBe(204);
  });

  test('GET /api/ligue/players/:id - 404 after deletion', async () => {
    const res = await request(app).get(`/api/ligue/players/${liguePlayerId}`);
    expect(res.status).toBe(404);
  });
});
