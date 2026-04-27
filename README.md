<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/MANWAR-logo-white.svg">
    <img src="public/MANWAR-logo.svg" width="240" alt="Manwar — منور">
  </picture>
</p>

<h1 align="center">Manwar &mdash; منور</h1>

<p align="center">
  <strong>The free, Arabic-first inverter and battery sizing calculator for Egyptian homes.</strong>
</p>

<p align="center">
  <em>&ldquo;Keep your home lit, even when the grid isn&rsquo;t.&rdquo;</em>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-3.4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres-3ecf8e?style=flat-square&logo=supabase&logoColor=white">
  <img alt="i18n" src="https://img.shields.io/badge/i18n-AR%20%2B%20EN-4F8DFF?style=flat-square">
  <img alt="Tests" src="https://img.shields.io/badge/Tests-9%2F9%20passing-22c55e?style=flat-square">
  <img alt="License" src="https://img.shields.io/badge/License-Proprietary-orange?style=flat-square">
</p>

---

## The problem

Egypt has been in a daily load-shedding cycle since 2024. Households are buying inverters and batteries with **zero engineering background** &mdash; and getting either oversized systems they don&rsquo;t need (wasted EGP), or undersized systems that fail under real load (lost trust). There is no clean Arabic-language sizing tool built for the Egyptian appliance market and Egyptian-market pricing.

**Manwar fills that gap.**

## What it does

A user picks the appliances they have (categorized: cooling, lighting, kitchen, media, laundry, other), sets how many hours of backup they need, and Manwar tells them:

- The right **inverter size** in kW
- The right **battery pack** (qty &times; Ah at the correct system voltage)
- An estimated **EGP price range** with cost breakdown
- **3+ verified Egyptian suppliers** to buy from

In under 90 seconds. Free. In Arabic or English.

## Highlights

| | |
|---|---|
| **7-step wizard** | One category per step, with skip option, transition loader, and `localStorage` persistence (survives language toggle / refresh). |
| **Bilingual** | Arabic (RTL) + English (LTR), naturally phrased in colloquial Egyptian dialect &mdash; not literal translation. |
| **Inverter AC toggle** | Soft-start ACs drop the surge math &mdash; typically takes the recommendation from 5&nbsp;kW &rarr; 3&nbsp;kW. |
| **Live cost breakdown** | Inverter % vs Battery % with progress bars and per-component price ranges. |
| **Real Egyptian suppliers** | 6 verified shops (Maryzad, Inter Solar Egypt, Egypt Sun, Acropol, Ever Green, 3 H Solar) with tier badges (local / premium / digital). |
| **Educational notes** | Plain-language explanations of what the battery does, what the inverter does, and what affects price. |
| **Animated submit loader** | 3-step "Crunching &rarr; Sizing &rarr; Picking" experience, ~1.8s. |
| **Too-large fallback** | Friendly explanation + actionable tips when the load exceeds 10&nbsp;kW. |
| **Pure-TS sizing engine** | `lib/sizing.ts` is testable in isolation, no I/O, **9 unit tests passing**. |
| **State preservation** | Switching language on `/result` keeps the recommendation. Direct visits redirect to the calculator. |

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | RSC + route handlers + server-side `redirect()` |
| Runtime | React 19 | Server Components, async params |
| Language | TypeScript 5 | Type-safe sizing engine |
| Styling | Tailwind CSS 3.4 | CSS-variable theme tokens, RTL-friendly logical utilities |
| Components | shadcn/ui (Radix + Base UI) | Accessible button, card, slider, dialog |
| Database | Supabase (Postgres) | Free tier, row-level security, instant SQL editor |
| i18n | `next-intl` 4 | Locale routing + RTL/LTR direction handling |
| Animation | CSS keyframes + tailwindcss-animate | No heavy runtime |
| Testing | Vitest + Playwright | Unit + E2E |
| Hosting | Vercel | Zero-config Next.js |
| Fonts | Plus Jakarta Sans + Cairo (Google Fonts) | Geometric sans, full Arabic glyph coverage |
| Icons | lucide-react | Tree-shakeable SVG icon set |

## Quick start

```bash
# 1. Clone
git clone https://github.com/MahmoudSayed0/manwar-energy-calc.git
cd manwar-energy-calc

# 2. Install (pnpm recommended)
pnpm install

# 3. Set up environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase project URL + anon key

# 4. Apply database migrations
# Open https://supabase.com/dashboard/project/<your-project>/sql
# Paste and run, in order:
#   supabase/migrations/0001_initial_schema.sql
#   supabase/migrations/0002_seed_appliances.sql

# 5. Run the dev server
pnpm dev
# Open http://localhost:3000  (redirects to /ar)
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL (e.g. `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase public anon JWT |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | optional | Plausible analytics domain. Script only loads when set. |

## Project structure

```
manwar-energy-calc/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # locale-aware wrapper (RTL/LTR + fonts)
│   │   ├── page.tsx                # landing page (2-col hero with sun graphic)
│   │   ├── calculator/page.tsx     # wizard host (h-100dvh, fixed height)
│   │   └── result/page.tsx         # recommendation + shops + warning fallback
│   ├── api/calculate/route.ts      # POST /api/calculate (uses lib/sizing)
│   ├── globals.css                 # theme tokens + animation keyframes
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── ui/                         # shadcn primitives
│   ├── ankh-logo.tsx               # 3 variants: default / white / black
│   ├── animated-lines.tsx          # decorative animated streaks
│   ├── webgl-shader.tsx            # three.js shader (unused on landing currently)
│   ├── appliance-card.tsx          # icon + chip variants + counter + inverter toggle
│   ├── category-section.tsx        # grid of appliance cards per category
│   ├── calculator-form.tsx         # 7-step wizard with state, transitions, submit loader
│   ├── wizard-progress.tsx         # compact progress bar
│   ├── hours-picker.tsx            # backup hours preset chips + ± buttons
│   ├── live-calc-card.tsx          # gradient blue recommendation card
│   ├── result-card.tsx             # full result with breakdown + notes
│   ├── shops-list.tsx              # fetches & sorts shops by tier + governorate
│   ├── shop-card.tsx               # shop with tier badge + actions
│   ├── lang-toggle.tsx             # AR/EN toggle, preserves query params
│   ├── footer.tsx                  # generic footer template
│   └── disclaimer-banner.tsx       # Manwar-specific footer + notes panel
├── lib/
│   ├── sizing.ts                   # pure sizing engine
│   ├── sizing.test.ts              # 9 unit tests
│   ├── price-estimate.ts           # EGP price estimator
│   ├── supabase.ts                 # lazy supabase client
│   ├── analytics.ts                # plausible event wrapper
│   ├── types.ts                    # shared TS types
│   └── utils.ts                    # cn() helper
├── messages/
│   ├── ar.json                     # Arabic copy
│   └── en.json                     # English copy
├── public/
│   ├── MANWAR-logo.svg             # blue (default)
│   ├── MANWAR-logo-white.svg       # white (for primary backgrounds)
│   ├── MANWAR-logo-black.svg       # black (for footer)
│   ├── MANWAR-sun.svg              # sun-only crop (hero showpiece)
│   └── og-image.png                # social share card placeholder
├── supabase/
│   └── migrations/
│       ├── 0001_initial_schema.sql
│       └── 0002_seed_appliances.sql
├── i18n.ts                         # next-intl config
├── middleware.ts                   # locale detection
├── tailwind.config.ts
└── next.config.ts
```

## Sizing engine &mdash; the math

All sizing logic lives in **`lib/sizing.ts`** as a pure TypeScript function: no I/O, no side effects, no async. The catalog is passed in as an argument. The engine is unit-tested in isolation.

### Inverter sizing

```
sum_running_W   = Σ (variant.running_watts × count) for every pick
max_surge_extra = max over inductive non-inverter-AC appliances of
                    (surge_watts − running_watts) × count_of_that_one
required_W      = (sum_running_W + max_surge_extra) × 1.20    ← 20% safety margin
inverter_kW     = smallest of [1, 1.5, 2, 3, 5, 6, 8, 10] ≥ required_W ÷ 1000
```

If `required_W ÷ 1000 > 10`, the system is too large for the calculator and the user sees the warning page.

### Voltage selection

```
inverter_kW ≤ 1.5  →  12V
inverter_kW ≤ 3    →  24V
inverter_kW ≥ 5    →  48V
```

### Battery sizing (Lithium, V1)

```
energy_needed_Wh = sum_running_W × backup_hours
required_Wh      = energy_needed_Wh / (0.85 × 0.80)   ← inverter eff × Li DoD
required_Ah      = required_Wh / system_voltage
```

`pickPack(required_Ah)` deterministic rule:

1. Try `qty=1` with smallest of `[100, 150, 200, 250]` Ah ≥ required
2. Else try `qty=2` with smallest where `2 × size ≥ required`
3. Else try `qty=4` with smallest where `4 × size ≥ required` (skip 3 &mdash; uneven on 12/24/48V buses)
4. Else &rarr; too-large fallback

### Inverter AC toggle

When a user marks an AC pick as "Inverter AC", that pick&rsquo;s `surge_extra` contribution drops to zero (soft-start ACs don&rsquo;t pull 3&ndash;5&times; compressor inrush).

Practical impact: a household with `1× 1.5HP AC + fridge + 5 LEDs at 4h backup` drops from a **5&nbsp;kW** to a **3&nbsp;kW** recommendation.

### Price estimation

```
inverter_price = inverter_kW × {min: 4500, max: 7500} EGP/kW
battery_price  = (qty × Ah × system_voltage) Wh × {min: 12, max: 18} EGP/Wh
total          = inverter_price + battery_price   (rounded to nearest 1000)
```

Pricing tier is stored in Supabase `pricing` table; updated manually as the market shifts.

## Database schema

Four tables, all with public read RLS:

| Table | Rows | Purpose |
|---|---|---|
| `appliances` | 25 | Slug, name (AR/EN), category, inductive flag, lucide icon name |
| `appliance_variants` | 38 | Per-size running/surge wattages |
| `shops` | 6 | Verified suppliers with tier (local / premium / digital), maps URL, social, specialties |
| `pricing` | 1 | Current EGP rates per kW (inverter) and per Wh (battery) |

See `supabase/migrations/0001_initial_schema.sql` for the full DDL.

## Localization

- **Routes:** `/ar/...` and `/en/...` via `next-intl`
- **Default locale:** Arabic
- **Direction:** Arabic = RTL, English = LTR (set on `<div dir="...">` in `app/[locale]/layout.tsx`)
- **Logical Tailwind utilities** (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) for direction-agnostic spacing
- **Fonts:** Cairo (Arabic) + Plus Jakarta Sans (Latin), each weight 300&ndash;700, swapped via CSS variables based on `html[dir]`

Top-level page strings live in `messages/ar.json` and `messages/en.json`. Component-level locale strings (e.g., wizard step descriptions and notes) are inlined in the component for clarity and to avoid translation files getting unwieldy.

## Testing

```bash
pnpm test                  # vitest unit (or pnpm test:watch)
pnpm test:e2e              # playwright (chromium + mobile)
pnpm exec tsc --noEmit     # type check
pnpm build                 # production build
```

Unit test coverage in `lib/sizing.test.ts`:

- Guardrails &mdash; empty picks, invalid hours
- Single AC sizing with surge handling
- Combined household (AC + fridge + lights)
- Inverter AC tag (surge skip)
- Too-large fallback
- Price estimator

**Status: 9 / 9 passing.**

## Deployment (Vercel)

```bash
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NEXT_PUBLIC_PLAUSIBLE_DOMAIN production    # optional
vercel --prod
```

Then point your custom domain in Vercel&rsquo;s dashboard.

## Roadmap

### V1 (shipped)

- Free Arabic + English calculator
- Wizard flow with 6 categories + hours
- Result page with shops directory
- 6 verified Egyptian suppliers seeded

### V1.1 (next)

- Real WhatsApp / phone numbers for shops (currently placeholders)
- Wattage values verified against real Egyptian-market spec sheets
- Privacy / Terms / Contact pages
- Plausible analytics enabled with real domain
- Open Graph image (1200&times;630 PNG)
- Rename `middleware.ts` &rarr; `proxy.ts` (Next.js 16 deprecation)

### V2

- Mobile app (React Native / Expo)
- OCR / barcode scanning of energy labels
- User accounts + saved calculations
- Solar panel sizing
- Lead-acid / Tubular battery support
- Supplier dashboard with lead tracking
- On-platform commission / escrow

## Architecture notes

- **Lazy Supabase client** (`lib/supabase.ts`) &mdash; the client is created on first call, so build-time rendering doesn&rsquo;t crash if env vars aren&rsquo;t set. Production must have them.
- **`localStorage` wizard persistence** &mdash; picks, hours, and step index are saved client-side under `manwar:wizard:state`, versioned for future schema changes.
- **Language toggle preserves query params** &mdash; switching `/ar/result?kw=5&...` &harr; `/en/result?kw=5&...` keeps the recommendation intact via `useSearchParams()`.
- **Server-side redirect on missing result params** &mdash; direct visits to `/result` without valid query params get redirected to `/calculator` via `next/navigation`&rsquo;s `redirect()`.
- **No emojis in UI copy** &mdash; all visual indicators use lucide-react icons in primary-tinted circles. Emojis are reserved for the README and external content.
- **Logical CSS utilities** &mdash; `ms-`, `me-`, `start-`, `end-` instead of `ml-`, `mr-`, `left-`, `right-`. RTL layouts mirror automatically.

## Contributing

This project is built and maintained by [Sikasio](https://www.sikasio.com). For collaboration inquiries, open an issue or reach out via [LinkedIn](https://www.linkedin.com/company/sikasio).

## Credits

- **Design + product:** Sikasio team
- **Engineering:** Sikasio + Claude (Anthropic)
- **Brand:** Manwar (منور) &mdash; Egyptian Arabic for "lit / illuminated"
- **Logo + sun graphic:** Sikasio in-house

## License

Copyright &copy; 2026 [Sikasio](https://www.sikasio.com). All rights reserved.

---

<p align="center">
  <strong>صنع في مصر بحب &nbsp;&middot;&nbsp; Made in Egypt with care</strong>
</p>
