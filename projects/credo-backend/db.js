const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      firebaseUid TEXT PRIMARY KEY,
      email TEXT,
      wallet TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      borrower TEXT,
      amount INTEGER,
      funded INTEGER,
      status TEXT,
      txId TEXT,
      hash TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loanId INTEGER,
      lender TEXT,
      amount INTEGER,
      txId TEXT,
      hash TEXT
    )
  `);
});

module.exports = db;