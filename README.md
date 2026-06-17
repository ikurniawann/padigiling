# Padigiling CRM

Sistem CRM untuk manajemen order katering **Padigiling** — otomatisasi order dari WhatsApp & multi-channel (Tokopedia, Shopee, website, dll).

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Bahasa | TypeScript 5 (strict mode) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Styling | Tailwind CSS 3 + Custom Glass Morphism |
| State | TanStack Query v5 + React Hooks |
| Validation | Zod v4 |
| Auth | Supabase Auth + Middleware guard |
| Testing | Vitest + Testing Library |
| Deployment | Vercel |

## Fitur

- **Dashboard** — Ringkasan omzet, order terbaru, channel sales
- **Leads** — Manajemen calon customer dari semua channel + search + TanStack Query caching
- **Pipeline** — Kanban board dengan dropdown pindah stage
- **Customers** — Auto-generated dari order, history pembelian
- **Orders** — List + detail order, update status, invoice tracking
- **Create Order** — Paste WhatsApp → auto-parse → field terstruktur → buat order
- **Invoices** — List + summary (total/paid/pending), link Paper.Id
- **Reports** — KPI cards, channel breakdown, conversion rate
- **Master Data** — CRUD 13 tabel master (channel, stage, status, courier, dll)
- **Settings** — Template WhatsApp editable (sync ke Create Order)

## Getting Started

### Prasyarat

- Node.js 18+
- Supabase project
- (Opsional) Akun Paper.Id untuk invoice
- (Opsional) Akun Fonnte untuk WhatsApp API

### 1. Clone & Install

```bash
cd crm-app
npm install
```

### 2. Environment Variables

Copy `.env.local.example` ke `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Setup

1. Buka Supabase SQL Editor
2. Jalankan `crm-ui/database-schema.sql` (410 baris)
3. Ini akan membuat semua table, enum, trigger, dan sequence

### 4. Run Development

```bash
npm run dev     # → http://localhost:3010
```

## Project Structure

```
crm-app/
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   │   ├── (auth)/login/       # Login page (Supabase Auth)
│   │   ├── dashboard/          # Dashboard overview
│   │   ├── leads/              # Leads list + create
│   │   ├── pipeline/           # Kanban board
│   │   ├── customers/          # Customer list
│   │   ├── orders/             # Order list + detail
│   │   ├── create-order/       # WA parser + order form
│   │   ├── invoices/           # Invoice list
│   │   ├── reports/            # Analytics
│   │   ├── master-data/        # CRUD master tables
│   │   ├── settings/           # Template WA + profile
│   │   ├── api/                # REST API routes
│   │   │   ├── leads/          # Leads CRUD
│   │   │   ├── orders/         # Orders CRUD + Zod validation
│   │   │   ├── customers/      # Customers list
│   │   │   ├── invoices/       # Invoices CRUD
│   │   │   ├── dashboard/      # Aggregation endpoint
│   │   │   └── master-data/    # Generic master CRUD
│   │   ├── error.tsx           # Global error boundary
│   │   └── layout.tsx          # Root layout + QueryProvider
│   ├── components/
│   │   ├── AppShell.tsx        # Sidebar + header shell
│   │   ├── PageHeader.tsx      # Page title + action
│   │   ├── providers/
│   │   │   └── query-provider.tsx  # TanStack Query provider
│   │   └── ...
│   ├── hooks/
│   │   └── use-leads.ts        # TanStack Query hooks for Leads
│   ├── lib/
│   │   ├── supabase/           # Supabase clients (browser/server/admin)
│   │   │   ├── server.ts       # Auth-aware server client
│   │   │   └── supabase-admin.ts  # Service role client
│   │   ├── validations/
│   │   │   └── order.ts        # Zod schemas
│   │   ├── wa-parser.ts        # WhatsApp text parser (shared)
│   │   ├── api-response.ts     # ok() / fail() helpers
│   │   └── master-data.ts      # Generic master data config
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces (22 types)
│   ├── test/
│   │   ├── setup.ts            # Vitest setup + mocks
│   │   └── lib/
│   │       └── wa-parser.test.ts  # WA parser tests
│   └── middleware.ts           # Auth guard (protects all routes)
├── crm-ui/                     # DEPRECATED — vanilla HTML prototype
├── vitest.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

## User Roles

| Role | Akses |
|---|---|
| `owner` | Full access |
| `admin` | Manajemen data + user |
| `sales` | Leads, orders, customers |
| `kitchen` | View orders |
| `finance` | Invoices, payments |

## API Endpoints

### Leads
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/leads` | List leads (filter: `stage_id`, `q`) |
| POST | `/api/leads` | Create lead |
| GET | `/api/leads/[id]` | Detail lead |
| PATCH | `/api/leads/[id]` | Update lead (move stage, etc) |
| DELETE | `/api/leads/[id]` | Delete lead |

### Orders
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/orders` | List orders (filter: `status`, `q`) |
| POST | `/api/orders` | Create order (Zod validated) |
| GET | `/api/orders/[id]` | Detail order |
| PATCH | `/api/orders/[id]` | Update status/fields |
| DELETE | `/api/orders/[id]` | Soft delete (set cancelled) |

### Customers & Invoices
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/customers` | List customers |
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice |

### Master Data
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/master-data/[module]` | List module entries |
| POST | `/api/master-data/[module]` | Create entry |
| PATCH | `/api/master-data/[module]/[id]` | Update entry |
| DELETE | `/api/master-data/[module]/[id]` | Soft delete |

### Dashboard
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/dashboard` | Aggregated stats + latest orders |

## Testing

```bash
npm test             # Run all tests
npm test -- --watch  # Watch mode
```

## Deployment

```bash
npm run build   # Build production
npm start       # Start production server (port 3010)
```

Deploy ke Vercel dengan konfigurasi environment variables yang sama seperti `.env.local`.

## Development Phases

| Fase | Status | Deskripsi |
|---|---|---|
| **Fase 1** | ✅ Done | Auth middleware, TypeScript types, Zod validation, error boundary |
| **Fase 2** | ✅ Done | Halaman Leads, Pipeline, Invoices, Reports, Settings |
| **Fase 3** | ✅ Done | WA parser shared module, TanStack Query, tests, README |

## License

Private — Padigiling Kitchen.
