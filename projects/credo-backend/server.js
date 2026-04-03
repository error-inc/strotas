const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running");
});

// ✅ Sync User Info
app.post("/user", (req, res) => {
  const { firebaseUid, email, wallet } = req.body;

  if (!firebaseUid) {
    return res.status(400).json({ error: "Missing firebaseUid" });
  }

  // Use INSERT OR REPLACE to handle both signup and login scenarios elegantly
  db.run(
    "INSERT OR REPLACE INTO users (firebaseUid, email, wallet) VALUES (?, ?, ?)",
    [firebaseUid, email || null, wallet || null],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    }
  );
});

// ✅ Create Loan
app.post("/loan", (req, res) => {
  const { wallet, amount, txId, hash } = req.body;

  if (!wallet || !amount || !txId || !hash) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.run(
    "INSERT INTO loans (borrower, amount, funded, status, txId, hash) VALUES (?, ?, ?, ?,?,?)",
    [wallet, amount, 0, "open", txId, hash],
    function (err) {
      if (err) return res.status(500).json(err);

      res.json({
        id: this.lastID,
        borrower: wallet,
        amount,
        funded: 0,
        status: "open",
        txId,
        hash
      });
    }
  );
});

// ✅ Fund Loan
app.post("/fund", (req, res) => {
  const { loanId, wallet, amount, txId, hash } = req.body;

  if (!loanId || !wallet || !amount || !txId || !hash) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.run(
    "INSERT INTO contributions (loanId, lender, amount, txId, hash) VALUES (?, ?, ?, ?, ?)",
    [loanId, wallet, amount, txId, hash],
    function (err) {
      if (err) return res.status(500).json(err);
      
      db.get(
        "SELECT funded, amount FROM loans WHERE id = ?",
        [loanId],
        (err, row) => {
          if (!row) return res.status(404).json({ error: "Loan not found" });

          const newFunded = row.funded + amount;
          const status = newFunded >= row.amount ? "funded" : "open";

          db.run(
            "UPDATE loans SET funded = ?, status = ? WHERE id = ?",
            [newFunded, status, loanId],
            () => {
              res.json({
                loanId,
                funded: newFunded,
                status
              });
            }
          );
        }
      );
    }
  );
});

// ✅ Get contributions
app.get("/loan/:id/contributions", (req, res) => {
  const loanId = req.params.id;

  db.all(
    "SELECT * FROM contributions WHERE loanId = ?",
    [loanId],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

// ✅ Get Loans
app.get("/loans", (req, res) => {
  db.all("SELECT * FROM loans", [], (err, rows) => {
    res.json(rows);
  });
});

// ✅ Repay Loan
app.post("/repay", (req, res) => {
  const { loanId, txId, hash } = req.body;

  if (!loanId || !txId || !hash) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.run(
    "UPDATE loans SET status = 'repaid', txId = ?, hash = ? WHERE id = ?",
    [txId, hash, loanId],
    () => {
      res.json({ success: true });
    }
  );
});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});