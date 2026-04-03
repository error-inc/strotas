const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  // 1. Users table (already created)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      firebaseUid TEXT PRIMARY KEY,
      email TEXT,
      wallet TEXT
    )
  `);

  // 2. Optimized Loans table
  db.run(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      borrower TEXT,
      title TEXT,           -- Added: Title of the loan
      description TEXT,     -- Added: Why they need money
      amount INTEGER,
      interest_rate REAL,   -- Added: Interest percentage
      term_days INTEGER,    -- Added: How long to repay
      funded INTEGER DEFAULT 0,
      status TEXT,          -- open, funded, repaid, overdue
      txId TEXT,
      hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- Added: Track request time
    )
  `);

  // 3. Optimized Contributions table
  db.run(`
    CREATE TABLE IF NOT EXISTS contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loanId INTEGER,
      lender TEXT,
      amount INTEGER,
      txId TEXT,
      hash TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP -- Added: Track funding time
    )
  `);

  // 4. Repayments tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS repayments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loanId INTEGER,
      lender TEXT,
      principal INTEGER,
      interest REAL,
      txId TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;
