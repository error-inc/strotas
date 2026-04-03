const express = require("express");
const cors = require("cors");
const db = require("./db");


const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running");
});

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


app.listen(3000, () => {
  console.log("Server running on port 3000");
});