const db = require('./connection');

// Silently ignore "duplicate column" errors so ALTER TABLE is idempotent
// on MySQL versions that don't support ADD COLUMN IF NOT EXISTS.
async function addColumn(sql) {
  try {
    await db.execute(sql);
  } catch (e) {
    if (e.errno !== 1060) throw e; // 1060 = Duplicate column name
  }
}

async function migrate() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS players (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ligues (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS championships (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      capacity INT NOT NULL,
      has_groups TINYINT(1) NOT NULL DEFAULT 1,
      ligue_linked TINYINT(1) NOT NULL DEFAULT 0,
      ligue_synced TINYINT(1) NOT NULL DEFAULT 0,
      draw_config_json TEXT,
      state_json LONGTEXT
    ) ENGINE=InnoDB
  `);
  await addColumn(`ALTER TABLE championships ADD COLUMN ligue_linked TINYINT(1) NOT NULL DEFAULT 0`);
  await addColumn(`ALTER TABLE championships ADD COLUMN ligue_synced TINYINT(1) NOT NULL DEFAULT 0`);
  await addColumn(`ALTER TABLE championships ADD COLUMN ligue_id INT NULL`);
  await addColumn(`ALTER TABLE championships ADD COLUMN points_config_json TEXT`);
  await addColumn(`ALTER TABLE championships ADD COLUMN sets_to_win TINYINT NOT NULL DEFAULT 1`);
  await addColumn(`ALTER TABLE championships ADD COLUMN draw_config_json TEXT`);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ligue_players (
      id INT AUTO_INCREMENT PRIMARY KEY,
      player_id INT NOT NULL,
      points INT NOT NULL DEFAULT 0,
      champs_json TEXT,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  await addColumn(`ALTER TABLE ligue_players ADD COLUMN ligue_id INT NULL`);
}

module.exports = migrate;
