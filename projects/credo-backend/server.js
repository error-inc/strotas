const express = require("express");
const cors = require("cors");
const db = require("./db");


const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running");
});

//Loan request
app.post("/loan", (req, res) => {
    const {wallet, amount, txId, hash} = req.body;

    if(!wallet, !amount, !txId, !hash)
    {
        return res.status(400).json({error: "missing value"});
    }

    db.execute("Insert into loans(borrower, amount, funded, status, txId, hash) values (?,?,?,?,?,?)",[wallet, amount,0, "Open",txId,hash],
        function(err){
            if(err) return res.status(500).json(err);
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
    )
});


//Fund request
app.post("/fund", (req, res) => {
  const { loanId, wallet, amount , txId, hash} = req.body;

  if (!loanId || !wallet || !amount || !txId || !hash) {
    return res.status(400).json({ error: "Missing fields" });
  }

  db.run(
    "INSERT INTO contributions (loanId, lender, amount,txId,hash) VALUES (?, ?, ?,?,?)",
    [loanId, wallet, amount,txId,hash]
  );

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
});

//Get loans
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


//Get Loans
app.get("/loans", (req, res) => {
  db.all("SELECT * FROM loans", [], (err, rows) => {
    res.json(rows);
  });
});


app.listen(3000, () => {
  console.log("Server running on port 3000");
});