# 🥗 FreshTrack — Kitchen Intelligence Platform

A premium AI-powered Smart Fridge & Pantry Management platform built with React + TypeScript + Vite.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open in browser
# http://localhost:5173
```

---

## 🏗 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # Desktop sidebar navigation
│   │   └── Sidebar.module.css
│   └── ui/
│       ├── index.tsx            # Button, Card, Tag, Avatar, Toggle, SearchBar, TabBar, Input, Select, etc.
│       ├── ui.module.css
│       ├── Toast.tsx            # Toast notifications
│       ├── Toast.module.css
│       ├── Modal.tsx            # Reusable modal overlay
│       └── Modal.module.css
├── data/
│   └── mockData.ts              # All mock data: items, recipes, grocery, analytics, notifications, user
├── features/
│   ├── auth/
│   │   ├── AuthScreen.tsx       # Onboarding + Login + Register + Forgot Password
│   │   └── AuthScreen.module.css
│   ├── dashboard/
│   │   ├── Dashboard.tsx        # KPI cards, expiry alerts, quick recipes, chart, activity
│   │   └── Dashboard.module.css
│   ├── inventory/
│   │   ├── Inventory.tsx        # Grid/list view, filters, food cards, add item modal
│   │   └── Inventory.module.css
│   ├── scanner/
│   │   ├── Scanner.tsx          # Upload zone, scan animation, AI results, history
│   │   └── Scanner.module.css
│   ├── recipes/
│   │   ├── Recipes.tsx          # Recipe cards, match bars, detail modal, cooking mode
│   │   └── Recipes.module.css
│   ├── grocery/
│   │   ├── GroceryList.tsx      # Checklist, qty controls, progress bar, categories
│   │   └── GroceryList.module.css
│   ├── analytics/
│   │   ├── Analytics.tsx        # Bar charts, KPI cards, category breakdown, health stats
│   │   └── Analytics.module.css
│   └── pages/
│       ├── Pages.tsx            # Notifications, Profile, Settings (combined)
│       └── Pages.module.css
├── hooks/
│   ├── useToast.ts              # Toast state management
│   ├── useInventory.ts          # Inventory CRUD state
│   └── useGrocery.ts            # Grocery list state
├── types/
│   └── index.ts                 # All TypeScript types
├── App.tsx                      # Root component, routing, mobile nav, FAB
├── App.module.css
├── index.css                    # CSS variables, reset, global animations
└── main.tsx                     # ReactDOM entry point
```

---

## 📱 Screens

| Screen        | Features |
|---------------|----------|
| **Auth**      | Onboarding slides, Login, Register, Forgot Password, Social login buttons |
| **Dashboard** | KPI stats, expiry alerts, quick recipes, weekly bar chart, activity feed, quick actions |
| **Inventory** | Grid/list views, search, multi-filter tabs, food cards, expiry bars, add/edit/delete/consume |
| **AI Scanner**| Drag-drop upload, scan animation with progress, confidence scores, editable results |
| **Recipes**   | AI-generated cards, ingredient match bars, filter tabs, recipe detail modal, cooking mode |
| **Grocery**   | Category groups, checkboxes, qty controls, progress bar, smart suggestions, add modal |
| **Analytics** | Bar charts (waste + spend), category breakdown, inventory health, savings tracker |
| **Notifications** | Filterable list, unread indicators, dismiss, mark-all-read |
| **Profile**   | Hero card, personal info form, subscription, household members, activity history |
| **Settings**  | Toggle switches, language/units/date format, danger zone |

---

## 🎨 Design System

- **Primary color**: Emerald Green (`#10B981`)
- **Fonts**: Fraunces (display/headings) + DM Sans (body)
- **Radii**: `--radius: 16px`, `--radius-sm: 10px`, `--radius-lg: 24px`
- **Shadows**: Three tiers — subtle, medium, large
- **CSS Variables**: All design tokens in `src/index.css` under `:root`

### Reusable Components (`src/components/ui/index.tsx`)
`Button` · `Tag` · `Card` · `Avatar` · `Badge` · `ProgressBar` · `ExpiryBar` · `Toggle` · `Skeleton` · `EmptyState` · `SearchBar` · `TabBar` · `SectionHeader` · `Input` · `Select`

---

## 🔌 Adding a Backend

All data is currently mocked in `src/data/mockData.ts`.

To connect a real backend:
1. Replace mock arrays in `mockData.ts` with API fetch calls
2. Update hooks (`useInventory.ts`, `useGrocery.ts`) to call your API
3. Add an auth provider (e.g. Supabase, Firebase, Auth.js) and wire to `AuthScreen.tsx`
4. Replace `MOCK_ANALYTICS` with real chart data from your analytics endpoint

---

## 🛠 Tech Stack

| Tool       | Version   | Purpose                |
|------------|-----------|------------------------|
| React      | 18        | UI framework           |
| TypeScript | 5.3       | Type safety            |
| Vite       | 5         | Build tool & dev server|
| CSS Modules| built-in  | Scoped component styles|

No UI library dependencies — all components are hand-crafted.

---

## 📦 Build for Production

```bash
npm run build
# Output in /dist — ready to deploy to Vercel, Netlify, Cloudflare Pages, etc.
```

---

## 🚧 Roadmap (Backend Integration)

- [ ] Supabase auth + database
- [ ] Real AI scanner via OpenAI Vision API
- [ ] Recipe generation via Claude API
- [ ] Push notifications
- [ ] Barcode scanning via ZXing or QuaggaJS
- [ ] Household real-time sync via Supabase Realtime
- [ ] PWA support for mobile install
