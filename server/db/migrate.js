const db = require('./connection');

async function migrate() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS players (
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
      state_json LONGTEXT
    ) ENGINE=InnoDB
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ligue_players (
      id INT AUTO_INCREMENT PRIMARY KEY,
      player_id INT NOT NULL,
      points INT NOT NULL DEFAULT 0,
      champs_json TEXT,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
}

module.exports = migrate;
