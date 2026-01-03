# MyFinance 💰

A personal finance management app built with React and Supabase. Track your expenses, manage budgets, and gain insights into your spending habits.

![React](https://img.shields.io/badge/React-18-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🏠 Dashboard
- Monthly spending overview with KPIs
- Comparison with previous month
- Spending trend chart (6 months)
- Category breakdown
- Budget alerts
- Recent transactions

### 💳 Transactions
- Full transaction list with search
- Filter by category and account
- Month/year navigation
- Add, edit, delete transactions
- Category color coding

### 🐷 Budgets
- Create monthly or yearly budgets
- Link to categories or specific subcategories
- Progress tracking with visual indicators
- Alerts at 80% and 100% thresholds
- Custom icons and colors

### 📊 Insights
- Year-over-year comparison
- Monthly breakdown charts
- Category ranking with percentages
- Category trends over time
- Top merchants analysis

### 🌍 Other Features
- Bilingual support (French/English)
- Mobile-first responsive design
- Real-time data sync with Supabase
- Secure authentication
- Row Level Security (RLS)

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Database:** Supabase (PostgreSQL)
- **Charts:** Recharts
- **Styling:** CSS-in-JS (inline styles)
- **Auth:** Supabase Auth

## 📁 Project Structure

```
src/
├── lib/
│   └── supabase.js           # Supabase client config
├── context/
│   └── AppContext.jsx        # Global state management
├── components/
│   ├── common/
│   │   ├── Header.jsx        # Top bar with language toggle
│   │   ├── Navigation.jsx    # Bottom tab navigation
│   │   └── MonthPicker.jsx   # Month/year selector
│   ├── transactions/
│   │   └── TransactionForm.jsx
│   └── budgets/
│       └── BudgetForm.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── HomePage.jsx
│   ├── TransactionsPage.jsx
│   ├── BudgetsPage.jsx
│   └── InsightsPage.jsx
├── App.jsx
└── App.css
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone the repository

```bash
git clone https://github.com/rickybcp/myfinance.git
cd myfinance
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL schema (see `docs/schema.sql`)
3. Copy your project URL and anon key

### 4. Configure environment

Update `src/lib/supabase.js` with your credentials:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 📊 Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `accounts` | Bank accounts (name, bank, color) |
| `categories` | Spending categories (bilingual) |
| `subcategories` | Subcategories linked to categories |
| `transactions` | All expenses with date, amount, description |
| `budgets` | Budget limits (monthly/yearly) |
| `budget_categories` | Links budgets to categories |
| `budget_subcategories` | Links budgets to subcategories |
| `recurring_templates` | Recurring transaction templates |
| `skipped_recurring` | Track skipped recurring transactions |
| `tags` | User-created tags |
| `transaction_tags` | Links transactions to tags |

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Authentication required for all operations
- Anon key safe for frontend use

## 🗺️ Roadmap

- [ ] Recurring transactions automation
- [ ] Data export (CSV/Excel)
- [ ] Dark mode
- [ ] PWA support
- [ ] Bank import (CSV)
- [ ] Multi-currency support

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Design inspired by KBC banking app
- Built with Claude AI assistance