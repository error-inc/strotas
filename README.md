# Credo — Blockchain Peer-to-Peer Lending

A full-stack web application for **decentralized peer-to-peer lending** on **Algorand**. Borrowers publish loan requests with on-chain proof, lenders fund open listings with signed transactions, and the app tracks funding, repayments, and a protocol-style **Credo Score** derived from loan history.

---

## Project Overview

### Description

**Credo** connects borrowers and lenders through a lending marketplace backed by Algorand payments. Users sign in with Firebase, connect an Algorand wallet (Pera, Defly, Exodus on testnet, or KMD on LocalNet), and interact with the chain for loan creation, funding, and repayment. A Node.js API persists loans, contributions, and repayments in **SQLite** and exposes a **credit score** endpoint used in the UI.

The system:

- Lets borrowers **create loan requests** (title, description, amount, APR, term) anchored by an on-chain transaction (payment with note metadata).
- Lists **open and funded** loans in a dashboard with marketplace and “my loans” views.
- Lets lenders **fund** loans with ALGO transfers recorded in the database.
- Lets borrowers **repay** funded loans, distributing principal + simple interest to contributors via grouped payments when applicable.
- Shows a **Credo Score** (0–100) per borrower wallet from repayment history, utilization, and account-age heuristics.
- Supports **printable HTML receipts** for loans (contributions and repayments ledger).

### Target Users

- **Borrowers** who want transparent, community-funded loans with blockchain receipts.
- **Lenders** browsing a marketplace and funding requests with wallet-signed txs.
- **Builders** learning Algorand + React + a lightweight off-chain indexer pattern.

### Core Value Proposition

- **On-chain anchoring**: Loan creation, funding, and repayment flows use real Algorand transactions (testnet by default in code paths).
- **Transparent ledger**: Contributions and repayments are stored and surfaced in the UI and receipts.
- **Wallet-native UX**: Connect with popular Algorand wallets or LocalNet KMD for development.
- **Reputation signal**: Credo Score summarizes behavior on the platform for quick trust cues.

---

## Technology Stack

### Frontend

- React 18
- Vite (build tool)
- TypeScript
- Tailwind CSS 4 + daisyUI
- React Router DOM 7
- Firebase Authentication (email/password)
- `@txnlab/use-wallet` + `algosdk` (Algorand)
- Lucide React (icons where used)
- notistack (notifications provider)

### Backend

- Node.js
- Express 5
- `sqlite3` (SQLite file database)
- CORS enabled for browser clients

### Database

- **SQLite** (`projects/credo-backend/database.db`)
- Tables: `users`, `loans`, `contributions`, `repayments`

### Authentication & identity

- **Firebase Authentication** on the frontend (signup, login).
- Backend **`POST /user`** syncs `firebaseUid`, optional `email`, optional `wallet` (no Firebase Admin token verification on API routes in the current codebase—protect production APIs accordingly).

### Blockchain

- **Algorand** (default public endpoints in app code: testnet AlgoNode; LocalNet supported via Vite env — see `.env.template`).

---

## Features

### Implemented

- User authentication with Firebase (signup, login); dashboard routes gated client-side.
- Connect Algorand wallet; create loan request with signed **0 ALGO** self-payment + note (creation proof).
- List all loans; **Marketplace** vs **My Loans** tabs.
- Fund open loans (ALGO amount prompt → signed payment → `POST /fund`).
- Loan status: `open` → `funded` (when funded ≥ target) → `repaid` after repayment flow.
- View contributions and repayments per loan; **download/print** HTML receipt.
- **Repay** funded loans (multi-lender payouts with interest heuristic, up to 16 txs in a group).
- **Credo Score** ring + tooltip from `GET /credit-score/:wallet`.
- Responsive, glass-style UI (inline styles + shared CSS classes).

### Not in scope (current repo state)

- Smart contract escrow on-chain (template `credo-contracts` may be absent or removed in your branch).
- Server-side Firebase ID token verification on every API call.
- PostgreSQL / ORM layer (app uses SQLite + raw SQL).

---

## Project Structure

```
credo/
├── projects/
│   ├── credo-backend/           # Express API + SQLite
│   │   ├── db.js                # Schema bootstrap
│   │   ├── server.js            # HTTP routes
│   │   ├── database.db          # SQLite file (local)
│   │   └── package.json
│   │
│   └── credo-frontend/          # React + Vite
│       ├── config/
│       │   └── firebase.ts      # Firebase client config
│       ├── src/
│       │   ├── components/      # Layout, wallet, UI (e.g. CreditScoreRing)
│       │   ├── config/
│       │   │   └── api.ts       # Backend base URL
│       │   ├── hooks/
│       │   ├── pages/           # Home, Login, Signup, Dashboard, CreateLoanRequest
│       │   ├── utils/           # blockchain.ts, network helpers
│       │   ├── App.tsx          # Routes + WalletProvider
│       │   └── main.tsx
│       ├── .env.template        # Algod / KMD / Indexer template
│       ├── package.json
│       └── vite.config.ts
│
└── README.md
```

---

## API Endpoints

Base URL: `http://localhost:5000` (configurable in `projects/credo-frontend/src/config/api.ts`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health: `"Backend running"` |
| `POST` | `/user` | Upsert user: `firebaseUid`, optional `email`, optional `wallet` |
| `POST` | `/loan` | Create loan: `wallet`, `title`, `description`, `amount`, `interest_rate`, `term_days`, `txId`, `hash` |
| `GET` | `/loans` | List all loans |
| `POST` | `/fund` | Record funding: `loanId`, `wallet`, `amount`, `txId`, `hash` |
| `GET` | `/loan/:id/contributions` | List contributions for a loan |
| `GET` | `/loan/:id/repayments` | List repayments for a loan |
| `GET` | `/credit-score/:wallet` | JSON score + factor breakdown for borrower wallet |
| `POST` | `/repay` | Mark loan repaid; optional `repayments[]` for ledger rows |

---

## Frontend Routes

| Route | Component | Protected (client) | Description |
|-------|-----------|--------------------|-------------|
| `/` | `Home` | No | Landing |
| `/login` | `Login` | No | Firebase login |
| `/signup` | `Signup` | No | Firebase signup |
| `/dashboard` | `Dashboard` | Yes | Marketplace & my loans |
| `/dashboard/create-loan` | `CreateLoanRequest` | Yes | New loan + on-chain publish |

---

## Setup Instructions

### Prerequisites

- Node.js 20+ and npm 9+ (frontend `engines` in `package.json`)
- Firebase project (Authentication → Email/Password)
- For on-chain flows: Algorand wallet with testnet ALGO, **or** AlgoKit LocalNet for local development

### Backend

1. Open a terminal:

   ```bash
   cd projects/credo-backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server (creates/uses `database.db` next to `server.js`):

   ```bash
   node server.js
   ```

   API listens on **port 5000**.

### Frontend

1. Open a terminal:

   ```bash
   cd projects/credo-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Environment variables:

   - Copy `projects/credo-frontend/.env.template` to `.env` and set **Algod / KMD / Indexer** for your network (LocalNet vs TestNet vs MainNet).
   - Add Firebase keys used in `config/firebase.ts`:

     ```env
     VITE_FIREBASE_APIKEY=...
     VITE_FIREBASE_AUTH_DOMAIN=...
     VITE_FIREBASE_PROJECT_ID=...
     ```

   - Point the app at your API (default in code is localhost):

     In `src/config/api.ts`, set `BACKEND_URL` to your backend (e.g. `http://localhost:5000`).

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Vite defaults to `http://localhost:5173`.

---

## Usage Guide

1. **Sign up / log in** with Firebase on `/signup` or `/login`.
2. **Connect wallet** in the navbar (testnet: Pera / Defly / Exodus; LocalNet: KMD per `App.tsx` + `.env`).
3. **Create a loan** from `/dashboard/create-loan`; approve the Algorand transaction.
4. On **Dashboard → Marketplace**, **Fund** another user’s open loan (enter ALGO amount, sign tx).
5. Under **My Loans**, when status is **funded**, use **Repay** to settle lenders.
6. Use **View Details** for contributions/repayments; use the **receipt** action for a printable summary.
7. Hover/click the **score ring** on a card to see **Credo Score** breakdown.

---

## Testing Checklist

### Authentication

- [ ] Sign up and log in with Firebase
- [ ] Unauthenticated access to `/dashboard` redirects to login

### Wallet & network

- [ ] Connect wallet on testnet (or KMD on LocalNet)
- [ ] Loan creation submits a transaction and appears in `/loans`

### Lending flows

- [ ] Fund an open loan; `funded` increases; status becomes `funded` when fully funded
- [ ] Repay a funded loan; status becomes `repaid`; repayments recorded
- [ ] Contributions and repayments visible in loan details

### Credit score & UX

- [ ] `GET /credit-score/:wallet` returns sensible JSON for wallets with/without history
- [ ] Score ring and tooltip render on loan cards
- [ ] Receipt opens/prints with loan + ledger data

### Resilience

- [ ] Backend stopped: UI degrades gracefully (console / alerts as implemented)
- [ ] Invalid or cancelled wallet txs: user sees error feedback

---

## Database Schema (SQLite)

### `users`

- `firebaseUid` (TEXT, PK)
- `email` (TEXT)
- `wallet` (TEXT)

### `loans`

- `id`, `borrower`, `title`, `description`, `amount`, `interest_rate`, `term_days`, `funded`, `status`, `txId`, `hash`, `created_at`

### `contributions`

- `id`, `loanId`, `lender`, `amount`, `txId`, `hash`, `timestamp`

### `repayments`

- `id`, `loanId`, `lender`, `principal`, `interest`, `txId`, `timestamp`

---

## Future Enhancements

- Smart-contract-based escrow and repayment enforcement on Algorand
- Firebase Admin SDK: verify ID tokens on all mutating routes
- Rate limiting, HTTPS, and production SQLite/Postgres migration
- Email / push notifications for funding and repayment events
- Richer risk models and optional KYC hooks

---

## Resources

- [Algorand Developer Docs](https://developer.algorand.org/)
- [AlgoKit](https://github.com/algorandfoundation/algokit-cli)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Express](https://expressjs.com/)

---

## License

Educational / project use unless otherwise specified.

---

## Contributors
- **Darshan Dalvi** 
- **Prasad Khairnar** 
- **Sakshant Balshetwar** 

---

## Support

For issues or questions, refer to this README and the inline configuration in `projects/credo-frontend/.env.template` and `projects/credo-frontend/src/config/api.ts`.
