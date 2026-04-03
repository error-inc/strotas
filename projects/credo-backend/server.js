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
  const { wallet, title, description, amount, interest_rate, term_days, txId, hash } = req.body;

  if (!wallet || !title || !amount || !term_days || !txId || !hash) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.run(
    "INSERT INTO loans (borrower, title, description, amount, interest_rate, term_days, funded, status, txId, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [wallet, title, description || "", amount, interest_rate || 0, term_days, 0, "open", txId, hash],
    function (err) {
      if (err) return res.status(500).json(err);

      res.json({
        id: this.lastID,
        borrower: wallet,
        title,
        description,
        amount,
        interest_rate,
        term_days,
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

// ✅ Get repayments
app.get("/loan/:id/repayments", (req, res) => {
  const loanId = req.params.id;

  db.all(
    "SELECT * FROM repayments WHERE loanId = ?",
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

// ✅ Credit Score for a wallet
app.get("/credit-score/:wallet", (req, res) => {
  const wallet = req.params.wallet;

  // Fetch all loans for this borrower
  db.all("SELECT * FROM loans WHERE borrower = ?", [wallet], (err, loans) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!loans || loans.length === 0) {
      // No loan history — neutral/default score
      return res.json({
        score: 50,
        factors: {
          repaymentHistory: { score: 50, weight: 0.40, label: "No history yet" },
          creditUtilization: { score: 50, weight: 0.35, label: "No loans yet" },
          accountAge: { score: 50, weight: 0.25, label: "Unknown" },
        },
        breakdown: "No loan history found for this wallet.",
      });
    }

    const totalLoans = loans.length;
    const repaidLoans = loans.filter((l) => l.status === "repaid").length;
    const openLoans = loans.filter((l) => l.status === "open").length;
    const fundedLoans = loans.filter((l) => l.status === "funded").length;

    // ── Factor 1: Repayment History (40%) ──────────────────────────
    // Score based on % of non-abandoned loans that were repaid
    const closedLoans = repaidLoans + fundedLoans; // funded = currently being serviced
    let repaymentScore;
    if (totalLoans === 0) {
      repaymentScore = 50;
    } else {
      const repaidRatio = repaidLoans / totalLoans;
      // Bonus for higher repaid ratio, penalty for open/abandoned
      repaymentScore = Math.round(repaidRatio * 100);
      // If they have funded but not yet repaid loans, treat as neutral (give partial credit)
      if (fundedLoans > 0 && repaidLoans === 0) repaymentScore = Math.max(repaymentScore, 45);
    }
    repaymentScore = Math.min(100, Math.max(0, repaymentScore));

    // ── Factor 2: Credit Utilization (35%) ──────────────────────────
    // How much of requested amount is currently funded vs total requested
    const totalRequested = loans.reduce((acc, l) => acc + (l.amount || 0), 0);
    const totalFunded = loans.reduce((acc, l) => acc + (l.funded || 0), 0);
    let utilizationScore;
    if (totalRequested === 0) {
      utilizationScore = 50;
    } else {
      const utilizationRatio = totalFunded / totalRequested;
      // Low utilization = good; high constant borrowing at max = risky
      // Sweet spot: 30-70% utilization; >90% is risky
      if (utilizationRatio <= 0.3) utilizationScore = 85;
      else if (utilizationRatio <= 0.7) utilizationScore = 100;
      else if (utilizationRatio <= 0.9) utilizationScore = 65;
      else utilizationScore = 30;
    }
    // penalize if many loans are still open (not repaid)
    const openRatio = openLoans / totalLoans;
    if (openRatio > 0.7) utilizationScore = Math.round(utilizationScore * 0.7);
    utilizationScore = Math.min(100, Math.max(0, utilizationScore));

    // ── Factor 3: Account Age / Protocol Longevity (25%) ──────────────────────────
    // Use created_at of the FIRST loan as "account age" proxy
    const sortedByDate = [...loans].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const firstLoanDate = sortedByDate[0]?.created_at ? new Date(sortedByDate[0].created_at) : new Date();
    const ageMs = Date.now() - firstLoanDate.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    // Score: 0 days = 10, 30 days = 50, 90 days = 80, 180+ days = 100
    let ageScore;
    if (ageDays < 1) ageScore = 10;
    else if (ageDays < 7) ageScore = 25;
    else if (ageDays < 30) ageScore = 50;
    else if (ageDays < 90) ageScore = 70;
    else if (ageDays < 180) ageScore = 85;
    else ageScore = 100;

    // ── Composite Score ──────────────────────────────────────────────
    const score = Math.round(
      repaymentScore * 0.40 +
      utilizationScore * 0.35 +
      ageScore * 0.25
    );

    res.json({
      score: Math.min(100, Math.max(1, score)),
      factors: {
        repaymentHistory: {
          score: repaymentScore,
          weight: 0.40,
          label: `${repaidLoans}/${totalLoans} loans repaid`,
        },
        creditUtilization: {
          score: utilizationScore,
          weight: 0.35,
          label: `${Math.round((totalFunded / (totalRequested || 1)) * 100)}% utilization`,
        },
        accountAge: {
          score: ageScore,
          weight: 0.25,
          label: ageDays < 1 ? "< 1 day" : ageDays < 30 ? `${Math.round(ageDays)} days` : `${Math.round(ageDays / 30)} months`,
        },
      },
      breakdown: `Based on ${totalLoans} loan(s): ${repaidLoans} repaid, ${fundedLoans} active, ${openLoans} open.`,
    });
  });
});

// ✅ Repay Loan
app.post("/repay", (req, res) => {
  const { loanId, txId, hash, repayments } = req.body;

  if (!loanId || !txId || !hash) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.run(
    "UPDATE loans SET status = 'repaid', txId = ?, hash = ? WHERE id = ?",
    [txId, hash, loanId],
    () => {
      // Loop and insert into repayments table if provided
      if (repayments && Array.isArray(repayments)) {
        const stmt = db.prepare("INSERT INTO repayments (loanId, lender, principal, interest, txId) VALUES (?, ?, ?, ?, ?)");
        for (const rep of repayments) {
          stmt.run([loanId, rep.lender, rep.principal, rep.interest, txId]);
        }
        stmt.finalize();
      }
      res.json({ success: true });
    }
  );
});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});