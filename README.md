# MyFinance - Component Setup

## Step 1: Create folders in your React project

In your `myfinance` project, create these folders:

```
src/
├── context/
├── components/
│   └── common/
└── pages/
```

Run this in your terminal (inside your myfinance folder):

```bash
mkdir -p src/context src/components/common src/pages
```

## Step 2: Copy files

Copy the files to the correct locations:

| File | Copy to |
|------|---------|
| `AppContext.jsx` | `src/context/AppContext.jsx` |
| `Navigation.jsx` | `src/components/common/Navigation.jsx` |
| `Header.jsx` | `src/components/common/Header.jsx` |
| `LoginPage.jsx` | `src/pages/LoginPage.jsx` |
| `HomePage.jsx` | `src/pages/HomePage.jsx` |
| `TransactionsPage.jsx` | `src/pages/TransactionsPage.jsx` |
| `BudgetsPage.jsx` | `src/pages/BudgetsPage.jsx` |
| `InsightsPage.jsx` | `src/pages/InsightsPage.jsx` |
| `App.jsx` | `src/App.jsx` (replace existing) |

## Step 3: Install lucide-react (if not installed)

```bash
npm install lucide-react
```

## Step 4: Keep your existing supabase.js

Make sure `src/lib/supabase.js` still exists with your credentials.

## Step 5: Run the app

```bash
npm run dev
```

## What you should see

1. Login page
2. After login: Dashboard with 4 tabs (Home, Transactions, Budgets, Insights)
3. Your dummy transactions in the Transactions tab
4. Language toggle (FR/EN) in the header

## File structure after setup

```
src/
├── lib/
│   └── supabase.js          # Your existing file
├── context/
│   └── AppContext.jsx       # NEW
├── components/
│   └── common/
│       ├── Navigation.jsx   # NEW
│       └── Header.jsx       # NEW
├── pages/
│   ├── LoginPage.jsx        # NEW
│   ├── HomePage.jsx         # NEW
│   ├── TransactionsPage.jsx # NEW
│   ├── BudgetsPage.jsx      # NEW
│   └── InsightsPage.jsx     # NEW
├── App.jsx                  # REPLACED
└── App.css                  # Keep existing
```