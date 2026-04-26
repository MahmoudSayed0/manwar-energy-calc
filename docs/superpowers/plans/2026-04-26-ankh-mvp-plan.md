# Ankh MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a free Egyptian Arabic + English solar/battery sizing calculator web app at ankh.eg in 4 weeks.

**Architecture:** Next.js 16 App Router (single deployment, no separate backend) + Supabase Postgres for the appliance catalog and shop directory + Vercel hosting. Sizing engine is pure TypeScript in `lib/sizing.ts` — testable in isolation, called from a Route Handler. UI builds on shadcn/ui primitives ported from the existing OSA admin panel for visual continuity, with Ankh-specific theme tokens (Egyptian gold accent on navy primary).

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind v3, shadcn/ui (Radix), Supabase (Postgres + JS client), next-intl (Arabic RTL + English LTR), Plausible Analytics, Vitest (unit), Playwright (E2E), pnpm.

**Spec:** `docs/superpowers/specs/2026-04-26-ankh-mvp-design.md` — read first.

---

## File Structure

```
ankh/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx               # locale-aware root layout (sets dir, fonts, providers)
│   │   ├── page.tsx                 # landing page
│   │   ├── calculator/page.tsx      # the picker + slider flow
│   │   └── result/page.tsx          # share-able result page (reads URL params)
│   ├── api/calculate/route.ts       # POST → runs lib/sizing → returns SizingResult
│   ├── globals.css                  # Ankh theme tokens (ported + adapted from OSA)
│   └── favicon.ico
├── components/
│   ├── ui/                          # shadcn/ui primitives (port from OSA)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── slider.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── toggle.tsx
│   │   ├── label.tsx
│   │   └── sonner.tsx
│   ├── ankh-logo.tsx                # geometric Ankh SVG logo
│   ├── lang-toggle.tsx              # AR/EN switch
│   ├── disclaimer-banner.tsx        # always-visible safety disclaimer
│   ├── appliance-card.tsx           # one card with +/- and variant selector
│   ├── appliance-picker.tsx         # grid of appliance cards
│   ├── backup-hours-slider.tsx      # 1-12h slider
│   ├── calculator-form.tsx          # full state + submit orchestration
│   ├── result-card.tsx              # the recommendation block
│   ├── shop-card.tsx                # one shop with WhatsApp + Maps links
│   └── shops-list.tsx               # fetches and renders 3 shops by governorate
├── lib/
│   ├── sizing.ts                    # PURE calculation engine — no I/O
│   ├── sizing.test.ts               # vitest unit tests (colocated)
│   ├── supabase.ts                  # browser + server clients
│   ├── analytics.ts                 # Plausible event wrapper
│   ├── price-estimate.ts            # EGP price-range calc, reads from Supabase pricing rows
│   └── types.ts                     # shared TS types (Appliance, Variant, Shop, SizingInput, SizingResult)
├── messages/
│   ├── ar.json                      # all Arabic copy
│   └── en.json                      # all English copy
├── i18n.ts                          # next-intl config
├── middleware.ts                    # next-intl locale detection
├── public/
│   ├── og-image.png                 # 1200x630 Ankh OG card
│   ├── robots.txt
│   └── sitemap.xml
├── supabase/
│   └── migrations/
│       ├── 0001_initial_schema.sql  # appliances, variants, shops, prices tables
│       └── 0002_seed_appliances.sql # the 25 appliance variants
├── tests/
│   └── e2e/
│       └── happy-path.spec.ts       # Playwright: pick AC + fridge + lights → see result
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── .env.local.example
├── .env.local                       # NOT committed
├── .gitignore
└── README.md
```

---

## Phase 0: Project Setup (Day 1)

### Task 0.1: Initialize project skeleton

**Files:**
- Create: `/Users/mahmoudomar/Work/sikasio/ankh/package.json`
- Create: `/Users/mahmoudomar/Work/sikasio/ankh/tsconfig.json`
- Create: `/Users/mahmoudomar/Work/sikasio/ankh/.gitignore`

- [ ] **Step 1: Bootstrap Next.js**

```bash
cd /Users/mahmoudomar/Work/sikasio/ankh
pnpm create next-app@latest . --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm
```

When prompted "would you like to use Turbopack" → **yes**.
When prompted about overwriting existing files → **yes** (the `docs/` folder is outside the directories the scaffolder touches and will be preserved).

- [ ] **Step 2: Verify Next.js 16 + React 19**

Run: `cat package.json | grep -E '"next"|"react"'`
Expected: `"next": "^16.x"` and `"react": "^19.x"`. If older, run `pnpm add next@latest react@latest react-dom@latest`.

- [ ] **Step 3: Init git and first commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js 16 project skeleton"
```

---

### Task 0.2: Install all runtime + dev dependencies

- [ ] **Step 1: Install runtime deps**

```bash
pnpm add @radix-ui/react-slot @radix-ui/react-slider @radix-ui/react-select @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-toggle @radix-ui/react-tooltip class-variance-authority clsx tailwind-merge lucide-react sonner next-themes @supabase/supabase-js next-intl
```

- [ ] **Step 2: Install dev deps**

```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @playwright/test tailwindcss-animate
```

- [ ] **Step 3: Initialize Playwright browsers**

```bash
pnpm exec playwright install chromium
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add runtime and dev dependencies"
```

---

### Task 0.3: Port OSA theme to Ankh

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`
- Reference (read-only): `/Users/mahmoudomar/Work/Oinride/OSA-admin-panal/app/globals.css`
- Reference (read-only): `/Users/mahmoudomar/Work/Oinride/OSA-admin-panal/tailwind.config.ts`

- [ ] **Step 1: Replace `app/globals.css` with Ankh tokens**

Write this exact content to `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --font-size: 16px;

    --background: 0 0% 100%;
    --foreground: 222 47% 11%;

    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;

    --primary: 222 69% 26%;
    --primary-foreground: 0 0% 100%;
    --primary-dark: 222 100% 16%;

    --secondary: 222 20% 95%;
    --secondary-foreground: 222 69% 26%;

    --muted: 222 20% 95%;
    --muted-foreground: 222 20% 40%;

    /* Ankh accent: Egyptian gold */
    --accent: 38 80% 55%;
    --accent-foreground: 222 47% 11%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 76% 36%;
    --success-foreground: 0 0% 100%;
    --warning: 25 95% 55%;
    --warning-foreground: 0 0% 100%;

    --border: 222 20% 85%;
    --input: 222 20% 85%;
    --input-background: 0 0% 98%;
    --ring: 38 80% 55%;

    --radius: 0.75rem;
    --radius-sm: 0.5rem;
    --radius-md: 0.75rem;
    --radius-lg: 1rem;
    --radius-xl: 1.25rem;
    --radius-full: 9999px;

    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  .dark {
    --background: 222 47% 7%;
    --foreground: 0 0% 100%;
    --card: 222 47% 11%;
    --card-foreground: 0 0% 100%;
    --popover: 222 47% 11%;
    --popover-foreground: 0 0% 100%;
    --primary: 38 80% 55%;
    --primary-foreground: 222 47% 11%;
    --secondary: 222 30% 18%;
    --secondary-foreground: 0 0% 100%;
    --muted: 222 30% 18%;
    --muted-foreground: 222 15% 65%;
    --accent: 38 80% 55%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 62.8% 50%;
    --destructive-foreground: 0 0% 100%;
    --border: 222 30% 22%;
    --input: 222 30% 22%;
    --input-background: 222 47% 9%;
    --ring: 38 80% 55%;
  }

  * { @apply border-border; }
  body { @apply bg-background text-foreground; }

  html[dir="rtl"] body { font-family: var(--font-arabic), system-ui, sans-serif; }
  html[dir="ltr"] body { font-family: var(--font-latin), system-ui, sans-serif; }
}
```

- [ ] **Step 2: Replace `tailwind.config.ts`**

Write this exact content:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        success: { DEFAULT: "hsl(var(--success))", foreground: "hsl(var(--success-foreground))" },
        warning: { DEFAULT: "hsl(var(--warning))", foreground: "hsl(var(--warning-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        sm: "var(--radius-sm)", md: "var(--radius-md)", lg: "var(--radius-lg)", xl: "var(--radius-xl)",
        "2xl": "var(--radius-xl)", "3xl": "var(--radius-xl)", full: "var(--radius-full)",
      },
      boxShadow: { sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: { "accordion-down": "accordion-down 0.2s ease-out", "accordion-up": "accordion-up 0.2s ease-out" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

- [ ] **Step 3: Verify dev server starts**

```bash
pnpm dev
```

Expected: server starts on http://localhost:3000 with no Tailwind errors. Open the page — should be a default Next.js page with the new color tokens applied to text.

- [ ] **Step 4: Stop dev server, commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "feat(theme): port OSA theme + add Ankh gold accent palette"
```

---

### Task 0.4: Create `components/ui/` shadcn primitives

**Files (all create):**
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/slider.tsx`
- `components/ui/select.tsx`
- `components/ui/dialog.tsx`
- `components/ui/label.tsx`
- `components/ui/toggle.tsx`
- `components/ui/sonner.tsx`
- `lib/utils.ts`

- [ ] **Step 1: Init shadcn**

```bash
pnpm dlx shadcn@latest init -d
```

When prompted: style=`default`, base color=`slate`, css variables=`yes`.

- [ ] **Step 2: Add primitives**

```bash
pnpm dlx shadcn@latest add button card slider select dialog label toggle sonner
```

- [ ] **Step 3: Verify imports compile**

Create a temp file `app/_check.tsx` with:

```tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
export default function Check() { return <Card><Button>Hi</Button></Card>; }
```

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors. Then delete `app/_check.tsx`.

- [ ] **Step 4: Commit**

```bash
git add components/ui lib/utils.ts components.json
git commit -m "feat(ui): add shadcn primitives"
```

---

### Task 0.5: Create the Ankh logo SVG component

**Files:**
- Create: `components/ankh-logo.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { cn } from "@/lib/utils";

interface AnkhLogoProps {
  className?: string;
  size?: number;
}

export function AnkhLogo({ className, size = 32 }: AnkhLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 96"
      width={size}
      height={size * 1.5}
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block", className)}
      aria-label="Ankh"
    >
      <ellipse cx="32" cy="22" rx="14" ry="18" />
      <line x1="32" y1="40" x2="32" y2="92" />
      <line x1="14" y1="52" x2="50" y2="52" />
    </svg>
  );
}
```

- [ ] **Step 2: Smoke-test render**

Drop temporarily into `app/page.tsx`:

```tsx
import { AnkhLogo } from "@/components/ankh-logo";
export default function Page() {
  return <AnkhLogo className="text-accent" size={64} />;
}
```

Run `pnpm dev` and open http://localhost:3000 — confirm a gold ankh symbol renders. Then revert `app/page.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ankh-logo.tsx
git commit -m "feat(ui): add Ankh logo SVG component"
```

---

### Task 0.6: Set up Supabase project + local dev

**Files:**
- Create: `.env.local.example`
- Create: `.env.local` (NOT committed)
- Create: `lib/supabase.ts`
- Create: `lib/types.ts`

- [ ] **Step 1: Create Supabase project (manual, via web UI)**

Go to https://supabase.com/dashboard → New project → name `ankh`, region `eu-central-1`, set DB password.

Copy the project URL and the anon key.

- [ ] **Step 2: Write `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=ankh.eg
```

- [ ] **Step 3: Write `.env.local` with real values (do NOT commit)**

Copy the example, fill in real values from Step 1.

- [ ] **Step 4: Write `lib/supabase.ts`**

```ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});
```

- [ ] **Step 5: Write `lib/types.ts`**

```ts
export type Governorate = "Cairo" | "Giza" | "Alexandria" | "Other";
export type ApplianceCategory = "cooling" | "lighting" | "kitchen" | "media" | "laundry" | "other";

export interface ApplianceVariant {
  id: string;
  variant_label_ar: string;
  variant_label_en: string;
  running_watts: number;
  surge_watts: number;
}

export interface Appliance {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  category: ApplianceCategory;
  inductive: boolean;
  icon: string;            // lucide-react icon name
  notes_ar?: string;
  notes_en?: string;
  variants: ApplianceVariant[];
}

export interface AppliancePick {
  applianceId: string;
  variantId: string;
  count: number;
}

export interface SizingInput {
  picks: AppliancePick[];
  backupHours: number;     // 1..12
}

export interface SizingResult {
  inverterKw: number;
  systemVoltage: 12 | 24 | 48;
  battery: { qty: number; ahEach: number };
  totalRunningWatts: number;
  estimatedPriceEgp: { min: number; max: number };
  warnings: string[];
  tooLarge: boolean;
}

export interface Shop {
  id: string;
  name: string;
  governorate: Governorate;
  area: string;
  whatsapp_number: string;
  maps_url: string;
  facebook_url?: string;
  specialty_tags: string[];
  is_active: boolean;
}
```

- [ ] **Step 6: Add `.env.local` to `.gitignore`**

Verify it's already there (Next.js default). Confirm with: `grep -q "^.env.local" .gitignore && echo OK`. If not OK, append `.env.local` to `.gitignore`.

- [ ] **Step 7: Commit**

```bash
git add .env.local.example lib/supabase.ts lib/types.ts .gitignore
git commit -m "feat(db): scaffold Supabase client and shared types"
```

---

### Task 0.7: Write initial Supabase schema migration

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0001_initial_schema.sql
create table appliances (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name_ar     text not null,
  name_en     text not null,
  category    text not null check (category in ('cooling','lighting','kitchen','media','laundry','other')),
  inductive   boolean not null default false,
  icon        text not null,
  notes_ar    text,
  notes_en    text,
  sort_order  int  not null default 100,
  created_at  timestamptz not null default now()
);

create table appliance_variants (
  id              uuid primary key default gen_random_uuid(),
  appliance_id    uuid not null references appliances(id) on delete cascade,
  variant_label_ar text not null,
  variant_label_en text not null,
  running_watts   int  not null check (running_watts >= 0),
  surge_watts     int  not null check (surge_watts >= running_watts),
  sort_order      int  not null default 100,
  created_at      timestamptz not null default now()
);

create index appliance_variants_appliance_id_idx on appliance_variants(appliance_id);

create table shops (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  governorate     text not null check (governorate in ('Cairo','Giza','Alexandria','Other')),
  area            text not null,
  whatsapp_number text not null,
  maps_url        text not null,
  facebook_url    text,
  specialty_tags  text[] not null default '{}',
  is_active       boolean not null default true,
  verified_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index shops_active_governorate_idx on shops(is_active, governorate);

create table pricing (
  id                       uuid primary key default gen_random_uuid(),
  inverter_egp_per_kw_min  int not null,
  inverter_egp_per_kw_max  int not null,
  battery_egp_per_wh_min   numeric(5,2) not null,
  battery_egp_per_wh_max   numeric(5,2) not null,
  effective_from           date not null default current_date
);

-- RLS: public read on appliances, variants, shops, pricing
alter table appliances           enable row level security;
alter table appliance_variants   enable row level security;
alter table shops                enable row level security;
alter table pricing              enable row level security;

create policy "appliances are public"   on appliances           for select using (true);
create policy "variants are public"     on appliance_variants   for select using (true);
create policy "active shops are public" on shops                for select using (is_active = true);
create policy "pricing is public"       on pricing              for select using (true);
```

- [ ] **Step 2: Apply via Supabase Dashboard**

Open https://supabase.com/dashboard/project/<your-id>/sql → paste the migration → run.
Expected: "Success. No rows returned."

- [ ] **Step 3: Verify tables exist**

In SQL editor run: `select table_name from information_schema.tables where table_schema = 'public' order by table_name;`
Expected: `appliance_variants`, `appliances`, `pricing`, `shops` (4 rows).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_initial_schema.sql
git commit -m "feat(db): add initial schema for appliances, variants, shops, pricing"
```

---

### Task 0.8: Seed appliance catalog

**Files:**
- Create: `supabase/migrations/0002_seed_appliances.sql`

⚠️ **The wattage values below are conservative starting estimates. Per the spec, they MUST be verified against real Egyptian-market spec sheets in Task 0.9 before launch.** These rows make development possible; the verification task replaces them in-place.

- [ ] **Step 1: Write the seed migration**

```sql
-- 0002_seed_appliances.sql
-- 25 appliances. Wattages = conservative starting estimates. See Task 0.9 for verification.

insert into appliances (slug, name_ar, name_en, category, inductive, icon, sort_order, notes_ar, notes_en) values
  ('fridge',          'تلاجة',       'Fridge',          'kitchen',  true,  'refrigerator',     10, null, null),
  ('split-ac',        'تكييف سبليت', 'Split AC',        'cooling',  true,  'air-vent',         20, 'استهلاك مرتفع. حدد القدرة بدقة.', 'High draw. Choose size carefully.'),
  ('led-bulb',        'لمبة LED',    'LED bulb',        'lighting', false, 'lightbulb',        30, null, null),
  ('old-bulb',        'لمبة قديمة',  'Old bulb',        'lighting', false, 'lightbulb-off',    35, null, null),
  ('tv',              'تلفزيون',     'TV',              'media',    false, 'tv',               40, null, null),
  ('router',          'راوتر',       'WiFi router',     'media',    false, 'router',           50, null, null),
  ('phone-charger',   'شاحن موبايل', 'Phone charger',   'media',    false, 'smartphone',       60, null, null),
  ('laptop',          'لاب توب',     'Laptop',          'media',    false, 'laptop',           70, null, null),
  ('desktop-pc',      'كمبيوتر',     'Desktop PC',      'media',    false, 'monitor',          75, null, null),
  ('washing-machine', 'غسالة',       'Washing machine', 'laundry',  true,  'washing-machine',  80, null, null),
  ('washer-heater',   'غسالة بسخان', 'Washer w/ heater','laundry',  true,  'washing-machine',  85, 'استهلاكها كبير على البطارية.', 'Heavy battery drain.'),
  ('water-heater',    'سخان كهربا',  'Water heater',    'kitchen',  false, 'flame',            90, 'تشغيل السخان على البطارية مكلف.', 'Running this on battery is rarely cost-effective.'),
  ('microwave',       'ميكروويف',    'Microwave',       'kitchen',  false, 'microwave',       100, null, null),
  ('iron',            'مكواة',       'Electric iron',   'other',    false, 'shirt',           110, null, null),
  ('hair-dryer',      'سشوار',       'Hair dryer',      'other',    false, 'wind',            120, null, null),
  ('ceiling-fan',     'مروحة سقف',   'Ceiling fan',     'cooling',  true,  'fan',             130, null, null),
  ('desk-fan',        'مروحة مكتب',  'Desk fan',        'cooling',  true,  'fan',             140, null, null),
  ('vacuum',          'مكنسة كهربا', 'Vacuum cleaner',  'other',    true,  'vacuum',          150, null, null),
  ('coffee-machine',  'ماكينة قهوة', 'Coffee machine',  'kitchen',  false, 'coffee',          160, null, null),
  ('toaster',         'محمصة',       'Toaster',         'kitchen',  false, 'sandwich',        170, null, null),
  ('blender',         'خلاط',        'Blender',         'kitchen',  true,  'blend',           180, null, null),
  ('game-console',    'بلايستيشن',   'Game console',    'media',    false, 'gamepad-2',       190, null, null),
  ('printer',         'طابعة',       'Printer',         'media',    false, 'printer',         200, null, null),
  ('cctv',            'كاميرات مراقبة','CCTV / NVR',    'other',    false, 'video',           210, null, null),
  ('intercom',        'انتركوم',     'Doorbell / intercom','other', false, 'bell',            220, null, null);

-- Variants (for items with multiple sizes; single-variant items get one row)
with a as (select id, slug from appliances)
insert into appliance_variants (appliance_id, variant_label_ar, variant_label_en, running_watts, surge_watts, sort_order)
select id, label_ar, label_en, run_w, surge_w, sort
from a join (values
  ('fridge',          'صغيرة',  'Small',         100,  600, 10),
  ('fridge',          'وسط',    'Medium',        150,  900, 20),
  ('fridge',          'كبيرة',  'Large',         250, 1200, 30),
  ('split-ac',        '1 حصان',   '1 HP',         750, 2250, 10),
  ('split-ac',        '1.5 حصان', '1.5 HP',      1100, 3300, 20),
  ('split-ac',        '2 حصان',   '2 HP',        1500, 4500, 30),
  ('split-ac',        '3 حصان',   '3 HP',        2200, 6600, 40),
  ('led-bulb',        '9 وات',  '9W',              9,    9, 10),
  ('led-bulb',        '15 وات', '15W',            15,   15, 20),
  ('old-bulb',        '60 وات', '60W',            60,   60, 10),
  ('old-bulb',        '100 وات','100W',          100,  100, 20),
  ('tv',              '32 بوصة','32"',            60,   60, 10),
  ('tv',              '43 بوصة','43"',            80,   80, 20),
  ('tv',              '55 بوصة','55"',           110,  110, 30),
  ('tv',              '65 بوصة','65"',           150,  150, 40),
  ('router',          '—', '—',                  10,   10, 10),
  ('phone-charger',   '—', '—',                  10,   10, 10),
  ('laptop',          '—', '—',                  80,   80, 10),
  ('desktop-pc',      '—', '—',                 250,  350, 10),
  ('washing-machine', 'صغيرة','Small',          500, 1500, 10),
  ('washing-machine', 'كبيرة','Large',          800, 2400, 20),
  ('washer-heater',   '—', '—',                2000, 2400, 10),
  ('water-heater',    'صغير', 'Small',          1500, 1500, 10),
  ('water-heater',    'كبير', 'Large',          3000, 3000, 20),
  ('microwave',       '—', '—',                1200, 1500, 10),
  ('iron',            '—', '—',                1200, 1200, 10),
  ('hair-dryer',      '—', '—',                1800, 1800, 10),
  ('ceiling-fan',     '—', '—',                  75,  150, 10),
  ('desk-fan',        '—', '—',                  50,  100, 10),
  ('vacuum',          '—', '—',                1400, 2000, 10),
  ('coffee-machine',  '—', '—',                1000, 1000, 10),
  ('toaster',         '—', '—',                 800,  800, 10),
  ('blender',         '—', '—',                 400,  600, 10),
  ('game-console',    '—', '—',                 150,  150, 10),
  ('printer',         'الخمول','Idle',            50,   50, 10),
  ('printer',         'طباعة','Printing',        600,  600, 20),
  ('cctv',            '—', '—',                  30,   30, 10),
  ('intercom',        '—', '—',                   5,    5, 10)
) as v(slug, label_ar, label_en, run_w, surge_w, sort)
on a.slug = v.slug;

-- Initial pricing row (April 2026, conservative)
insert into pricing (inverter_egp_per_kw_min, inverter_egp_per_kw_max, battery_egp_per_wh_min, battery_egp_per_wh_max)
values (4500, 7500, 12.00, 18.00);
```

- [ ] **Step 2: Apply via Supabase SQL editor**

Paste the migration → run. Expected: success.

- [ ] **Step 3: Verify counts**

In SQL editor:
```sql
select (select count(*) from appliances) as appliances,
       (select count(*) from appliance_variants) as variants,
       (select count(*) from pricing) as pricing;
```
Expected: appliances=25, variants≥38, pricing=1.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_seed_appliances.sql
git commit -m "feat(db): seed 25 appliances with placeholder wattages"
```

---

### Task 0.9: Verify wattages from real Egyptian-market spec sheets (HUMAN WORK)

**This is research, not coding. Estimated time: 4–6 hours over 2 days.**

- [ ] **Step 1: For each of these 8 high-impact appliances, find 3 model spec sheets from common Egyptian-market brands (LG, Samsung, Tornado, Fresh, Carrier, Sharp, B.TECH catalog):**

  1. Fridge (small/medium/large)
  2. Split AC (1HP, 1.5HP, 2HP, 3HP)
  3. Washing machine (with and without heater)
  4. Water heater (small/large)
  5. Microwave
  6. TV (32"/43"/55"/65")
  7. Hair dryer
  8. Vacuum cleaner

- [ ] **Step 2: Record findings in a spreadsheet (any tool):**

| Appliance | Variant | Model | Brand | Running W | Startup W | Source URL |
|-----------|---------|-------|-------|-----------|-----------|------------|

Take the **average** of running watts and the **highest** observed startup as surge.

- [ ] **Step 3: Update `0002_seed_appliances.sql` with verified values**

Open the migration. Replace the placeholder values with verified ones. Re-run on Supabase SQL editor (use `truncate appliance_variants restart identity cascade;` first, then re-insert).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_seed_appliances.sql
git commit -m "data: replace placeholder wattages with verified Egyptian-market values"
```

---

## Phase 1: Sizing Engine (TDD) — Days 3–5

### Task 1.1: Set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "components/**/*.test.tsx"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

- [ ] **Step 2: Add scripts to `package.json`**

In the `scripts` block, add:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

- [ ] **Step 3: Smoke-test**

Run: `pnpm test`
Expected: "No test files found" — the runner works, just no tests yet.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts package.json
git commit -m "chore: add vitest configuration"
```

---

### Task 1.2: Write failing test — empty input rejection

**Files:**
- Create: `lib/sizing.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { calculateSizing } from "./sizing";
import type { SizingInput } from "./types";

const empty: SizingInput = { picks: [], backupHours: 4 };

describe("calculateSizing — guardrails", () => {
  it("throws on empty picks", () => {
    expect(() => calculateSizing(empty, [])).toThrow(/no appliances/i);
  });

  it("throws on backupHours out of range", () => {
    const valid: SizingInput = { picks: [{ applianceId: "a", variantId: "v", count: 1 }], backupHours: 0 };
    expect(() => calculateSizing(valid, [{ id: "a", inductive: false, variants: [{ id: "v", running_watts: 10, surge_watts: 10 }] } as any])).toThrow(/backup hours/i);
  });
});
```

- [ ] **Step 2: Run, expect failure**

Run: `pnpm test`
Expected: error "Cannot find module './sizing'" or "calculateSizing is not a function".

---

### Task 1.3: Implement minimal sizing.ts to pass guardrail tests

**Files:**
- Create: `lib/sizing.ts`

- [ ] **Step 1: Write minimal implementation**

```ts
import type { Appliance, AppliancePick, SizingInput, SizingResult } from "./types";

const STANDARD_INVERTERS_KW = [1, 1.5, 2, 3, 5, 6, 8, 10] as const;
const BATTERY_SIZES_AH = [100, 150, 200, 250] as const;
const SAFETY_MARGIN = 1.20;
const INVERTER_EFFICIENCY = 0.85;
const LITHIUM_DOD = 0.80;

function roundUpInverter(kw: number): number | null {
  for (const s of STANDARD_INVERTERS_KW) if (s >= kw) return s;
  return null;
}

function selectVoltage(kw: number): 12 | 24 | 48 {
  if (kw <= 1.5) return 12;
  if (kw <= 3) return 24;
  return 48;
}

function pickPack(requiredAh: number): { qty: number; ahEach: number } | null {
  for (const ah of BATTERY_SIZES_AH) if (ah >= requiredAh) return { qty: 1, ahEach: ah };
  for (const ah of BATTERY_SIZES_AH) if (2 * ah >= requiredAh) return { qty: 2, ahEach: ah };
  for (const ah of BATTERY_SIZES_AH) if (4 * ah >= requiredAh) return { qty: 4, ahEach: ah };
  return null;
}

export function calculateSizing(input: SizingInput, catalog: Appliance[]): SizingResult {
  if (input.picks.length === 0) throw new Error("No appliances selected");
  if (input.backupHours < 1 || input.backupHours > 12) throw new Error("Backup hours must be 1..12");

  let sumRunningW = 0;
  let maxSurgeExtra = 0;

  for (const pick of input.picks) {
    const appl = catalog.find(a => a.id === pick.applianceId);
    if (!appl) continue;
    const variant = appl.variants.find(v => v.id === pick.variantId);
    if (!variant) continue;

    sumRunningW += variant.running_watts * pick.count;

    if (appl.inductive) {
      const extra = (variant.surge_watts - variant.running_watts) * pick.count;
      if (extra > maxSurgeExtra) maxSurgeExtra = extra;
    }
  }

  const requiredW = (sumRunningW + maxSurgeExtra) * SAFETY_MARGIN;
  const inverterKw = roundUpInverter(requiredW / 1000);

  if (inverterKw === null) {
    return {
      inverterKw: 10,
      systemVoltage: 48,
      battery: { qty: 0, ahEach: 0 },
      totalRunningWatts: sumRunningW,
      estimatedPriceEgp: { min: 0, max: 0 },
      warnings: ["TOO_LARGE"],
      tooLarge: true,
    };
  }

  const systemVoltage = selectVoltage(inverterKw);
  const energyNeededWh = sumRunningW * input.backupHours;
  const requiredWh = energyNeededWh / (INVERTER_EFFICIENCY * LITHIUM_DOD);
  const requiredAh = requiredWh / systemVoltage;
  const battery = pickPack(requiredAh);

  if (battery === null) {
    return {
      inverterKw,
      systemVoltage,
      battery: { qty: 0, ahEach: 0 },
      totalRunningWatts: sumRunningW,
      estimatedPriceEgp: { min: 0, max: 0 },
      warnings: ["TOO_LARGE"],
      tooLarge: true,
    };
  }

  return {
    inverterKw,
    systemVoltage,
    battery,
    totalRunningWatts: sumRunningW,
    estimatedPriceEgp: { min: 0, max: 0 },     // filled in by price-estimate.ts
    warnings: [],
    tooLarge: false,
  };
}
```

- [ ] **Step 2: Run, expect pass**

Run: `pnpm test`
Expected: 2 passed.

- [ ] **Step 3: Commit**

```bash
git add lib/sizing.ts lib/sizing.test.ts
git commit -m "feat(sizing): implement guardrails and core skeleton"
```

---

### Task 1.4: Test + verify single-AC sizing

- [ ] **Step 1: Append test cases to `lib/sizing.test.ts`**

```ts
import type { Appliance } from "./types";

const catalog: Appliance[] = [
  {
    id: "ac", slug: "split-ac", name_ar: "تكييف", name_en: "AC",
    category: "cooling", inductive: true, icon: "air-vent",
    variants: [
      { id: "ac-1.5", variant_label_ar: "1.5 حصان", variant_label_en: "1.5 HP", running_watts: 1100, surge_watts: 3300 },
    ],
  },
  {
    id: "fridge", slug: "fridge", name_ar: "تلاجة", name_en: "Fridge",
    category: "kitchen", inductive: true, icon: "refrigerator",
    variants: [
      { id: "fridge-m", variant_label_ar: "وسط", variant_label_en: "Medium", running_watts: 150, surge_watts: 900 },
    ],
  },
  {
    id: "led", slug: "led-bulb", name_ar: "لمبة", name_en: "LED",
    category: "lighting", inductive: false, icon: "lightbulb",
    variants: [
      { id: "led-9", variant_label_ar: "9", variant_label_en: "9W", running_watts: 9, surge_watts: 9 },
    ],
  },
];

describe("calculateSizing — single AC", () => {
  it("1.5HP AC alone → 5kW inverter (handles surge)", () => {
    // running 1100 + surge_extra 2200 = 3300W. ×1.20 safety = 3960W. round up = 5kW.
    const r = calculateSizing({ picks: [{ applianceId: "ac", variantId: "ac-1.5", count: 1 }], backupHours: 4 }, catalog);
    expect(r.inverterKw).toBe(5);
    expect(r.systemVoltage).toBe(48);
    expect(r.tooLarge).toBe(false);
  });
});
```

- [ ] **Step 2: Run, expect pass**

Run: `pnpm test`
Expected: 3 passed.

- [ ] **Step 3: Commit**

```bash
git add lib/sizing.test.ts
git commit -m "test(sizing): single-AC inverter sizing"
```

---

### Task 1.5: Test combined load case

- [ ] **Step 1: Append**

```ts
describe("calculateSizing — combined household", () => {
  it("AC 1.5HP + fridge + 5 LED bulbs, 4h backup → reasonable sizing", () => {
    const r = calculateSizing(
      {
        picks: [
          { applianceId: "ac",     variantId: "ac-1.5", count: 1 },
          { applianceId: "fridge", variantId: "fridge-m", count: 1 },
          { applianceId: "led",    variantId: "led-9", count: 5 },
        ],
        backupHours: 4,
      },
      catalog,
    );
    // running: 1100 + 150 + 45 = 1295W
    // max surge_extra: AC = (3300-1100)=2200W (highest)
    // required: (1295 + 2200) × 1.20 = 4194W → 5kW inverter, 48V
    // energy: 1295 × 4 = 5180Wh / (0.85 × 0.80) = 7618Wh
    // required Ah at 48V = 158.7 → pick 200Ah × 1
    expect(r.inverterKw).toBe(5);
    expect(r.systemVoltage).toBe(48);
    expect(r.battery).toEqual({ qty: 1, ahEach: 200 });
    expect(r.totalRunningWatts).toBe(1295);
  });

  it("only LED lights for 6h → small system, 12V", () => {
    const r = calculateSizing(
      { picks: [{ applianceId: "led", variantId: "led-9", count: 5 }], backupHours: 6 },
      catalog,
    );
    // 45W × 1.20 = 54W → smallest standard = 1kW. 12V.
    expect(r.inverterKw).toBe(1);
    expect(r.systemVoltage).toBe(12);
    // 45 × 6 / (0.85 × 0.80) = 397Wh / 12V = 33Ah → 100Ah × 1
    expect(r.battery).toEqual({ qty: 1, ahEach: 100 });
  });
});
```

- [ ] **Step 2: Run, expect pass**

Run: `pnpm test`
Expected: 5 passed.

- [ ] **Step 3: Commit**

```bash
git add lib/sizing.test.ts
git commit -m "test(sizing): combined household and lights-only cases"
```

---

### Task 1.6: Test "too large" fallback

- [ ] **Step 1: Append**

```ts
describe("calculateSizing — too large", () => {
  it("massive simultaneous AC fleet exceeds 10kW → tooLarge", () => {
    const r = calculateSizing(
      { picks: [{ applianceId: "ac", variantId: "ac-1.5", count: 8 }], backupHours: 4 },
      catalog,
    );
    // running 8800, surge_extra (one AC) 2200, total 11000 × 1.20 = 13200W → no standard fits
    expect(r.tooLarge).toBe(true);
    expect(r.warnings).toContain("TOO_LARGE");
  });
});
```

- [ ] **Step 2: Run, expect pass**

Run: `pnpm test`
Expected: 6 passed.

- [ ] **Step 3: Commit**

```bash
git add lib/sizing.test.ts
git commit -m "test(sizing): too-large load fallback"
```

---

### Task 1.7: Add price estimation

**Files:**
- Create: `lib/price-estimate.ts`
- Modify: `lib/sizing.ts` (call price estimator)

- [ ] **Step 1: Write `lib/price-estimate.ts`**

```ts
export interface PricingTier {
  inverter_egp_per_kw_min: number;
  inverter_egp_per_kw_max: number;
  battery_egp_per_wh_min: number;
  battery_egp_per_wh_max: number;
}

export function estimatePriceEgp(
  inverterKw: number,
  batteryQty: number,
  ahEach: number,
  systemVoltage: number,
  pricing: PricingTier,
): { min: number; max: number } {
  const inverterMin = inverterKw * pricing.inverter_egp_per_kw_min;
  const inverterMax = inverterKw * pricing.inverter_egp_per_kw_max;
  const totalWh = batteryQty * ahEach * systemVoltage;
  const batteryMin = totalWh * pricing.battery_egp_per_wh_min;
  const batteryMax = totalWh * pricing.battery_egp_per_wh_max;
  return {
    min: Math.round((inverterMin + batteryMin) / 1000) * 1000,
    max: Math.round((inverterMax + batteryMax) / 1000) * 1000,
  };
}
```

- [ ] **Step 2: Write a test**

Append to `lib/sizing.test.ts`:

```ts
import { estimatePriceEgp } from "./price-estimate";

describe("estimatePriceEgp", () => {
  it("3kW inverter + 1× 200Ah at 24V, mid-tier pricing", () => {
    const r = estimatePriceEgp(3, 1, 200, 24, {
      inverter_egp_per_kw_min: 4500,
      inverter_egp_per_kw_max: 7500,
      battery_egp_per_wh_min: 12,
      battery_egp_per_wh_max: 18,
    });
    // inverter: 3 × 4500..7500 = 13500..22500
    // battery: 200×24 = 4800Wh × 12..18 = 57600..86400
    // total: 71100..108900 → rounded to nearest 1000
    expect(r.min).toBe(71000);
    expect(r.max).toBe(109000);
  });
});
```

- [ ] **Step 3: Run, expect pass**

Run: `pnpm test`
Expected: 7 passed.

- [ ] **Step 4: Commit**

```bash
git add lib/price-estimate.ts lib/sizing.test.ts
git commit -m "feat(sizing): add price estimator"
```

---

### Task 1.8: Build the calculate API route

**Files:**
- Create: `app/api/calculate/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { calculateSizing } from "@/lib/sizing";
import { estimatePriceEgp } from "@/lib/price-estimate";
import type { Appliance, SizingInput } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: SizingInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || !Array.isArray(body.picks) || typeof body.backupHours !== "number") {
    return NextResponse.json({ error: "Invalid payload shape" }, { status: 400 });
  }

  const [{ data: appliances, error: aErr }, { data: variants, error: vErr }, { data: pricingRows, error: pErr }] =
    await Promise.all([
      supabase.from("appliances").select("*"),
      supabase.from("appliance_variants").select("*"),
      supabase.from("pricing").select("*").order("effective_from", { ascending: false }).limit(1),
    ]);

  if (aErr || vErr || pErr || !appliances || !variants || !pricingRows?.length) {
    return NextResponse.json({ error: "Catalog unavailable" }, { status: 503 });
  }

  const catalog: Appliance[] = appliances.map(a => ({
    ...a,
    variants: variants.filter(v => v.appliance_id === a.id).map(v => ({
      id: v.id,
      variant_label_ar: v.variant_label_ar,
      variant_label_en: v.variant_label_en,
      running_watts: v.running_watts,
      surge_watts: v.surge_watts,
    })),
  })) as Appliance[];

  try {
    const result = calculateSizing(body, catalog);
    if (!result.tooLarge) {
      result.estimatedPriceEgp = estimatePriceEgp(
        result.inverterKw,
        result.battery.qty,
        result.battery.ahEach,
        result.systemVoltage,
        pricingRows[0],
      );
    }
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Calculation failed" }, { status: 400 });
  }
}
```

- [ ] **Step 2: Manual smoke test**

Run dev server: `pnpm dev`. In another terminal:

```bash
curl -X POST http://localhost:3000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"picks":[{"applianceId":"<real-uuid>","variantId":"<real-uuid>","count":1}],"backupHours":4}'
```

Look up real UUIDs in Supabase SQL editor first (`select id from appliances where slug='split-ac';`).

Expected: JSON `SizingResult` with non-zero `inverterKw` and price.

- [ ] **Step 3: Commit**

```bash
git add app/api/calculate/route.ts
git commit -m "feat(api): add /api/calculate route handler"
```

---

## Phase 2: UI Components — Days 6–10

### Task 2.1: AppliancePicker grid

**Files:**
- Create: `components/appliance-card.tsx`
- Create: `components/appliance-picker.tsx`

- [ ] **Step 1: Write `components/appliance-card.tsx`**

```tsx
"use client";

import { useMemo } from "react";
import { Plus, Minus } from "lucide-react";
import * as Icons from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Appliance, AppliancePick } from "@/lib/types";

interface Props {
  appliance: Appliance;
  pick?: AppliancePick;
  locale: "ar" | "en";
  onChange: (pick: AppliancePick | null) => void;
}

export function ApplianceCard({ appliance, pick, locale, onChange }: Props) {
  const Icon = (Icons as any)[toPascal(appliance.icon)] ?? Icons.Plug;
  const name = locale === "ar" ? appliance.name_ar : appliance.name_en;
  const variants = appliance.variants;
  const selectedVariant = useMemo(
    () => pick ? variants.find(v => v.id === pick.variantId) ?? variants[0] : variants[0],
    [pick, variants],
  );

  const count = pick?.count ?? 0;
  const hasMultiVariants = variants.length > 1;

  function setCount(n: number) {
    if (n <= 0) onChange(null);
    else onChange({ applianceId: appliance.id, variantId: selectedVariant.id, count: n });
  }

  function setVariant(variantId: string) {
    onChange({ applianceId: appliance.id, variantId, count: count || 1 });
  }

  return (
    <Card className={`p-4 flex flex-col gap-3 ${count > 0 ? "ring-2 ring-accent" : ""}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-medium">{name}</span>
      </div>

      {hasMultiVariants && (
        <Select value={selectedVariant.id} onValueChange={setVariant}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {variants.map(v => (
              <SelectItem key={v.id} value={v.id}>
                {locale === "ar" ? v.variant_label_ar : v.variant_label_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center justify-between">
        <Button size="icon" variant="outline" onClick={() => setCount(Math.max(0, count - 1))} aria-label="decrement">
          <Minus className="h-4 w-4" />
        </Button>
        <span className="font-semibold w-8 text-center">{count}</span>
        <Button size="icon" variant="outline" onClick={() => setCount(count + 1)} aria-label="increment">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

function toPascal(s: string): string {
  return s.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join("");
}
```

- [ ] **Step 2: Write `components/appliance-picker.tsx`**

```tsx
"use client";

import { ApplianceCard } from "./appliance-card";
import type { Appliance, AppliancePick } from "@/lib/types";

interface Props {
  appliances: Appliance[];
  picks: AppliancePick[];
  locale: "ar" | "en";
  onPicksChange: (picks: AppliancePick[]) => void;
}

export function AppliancePicker({ appliances, picks, locale, onPicksChange }: Props) {
  function update(id: string, next: AppliancePick | null) {
    const without = picks.filter(p => p.applianceId !== id);
    onPicksChange(next ? [...without, next] : without);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {appliances.map(a => (
        <ApplianceCard
          key={a.id}
          appliance={a}
          pick={picks.find(p => p.applianceId === a.id)}
          locale={locale}
          onChange={(p) => update(a.id, p)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/appliance-card.tsx components/appliance-picker.tsx
git commit -m "feat(ui): appliance picker grid with variant + count"
```

---

### Task 2.2: BackupHoursSlider

**Files:**
- Create: `components/backup-hours-slider.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Props {
  hours: number;
  locale: "ar" | "en";
  onChange: (hours: number) => void;
}

export function BackupHoursSlider({ hours, locale, onChange }: Props) {
  const label = locale === "ar" ? "ساعات انقطاع الكهرباء" : "Power-cut hours per day";
  const unit = locale === "ar" ? "ساعة" : "hours";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">{label}</Label>
        <span className="text-2xl font-bold text-accent">
          {hours} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Slider min={1} max={12} step={1} value={[hours]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/backup-hours-slider.tsx
git commit -m "feat(ui): backup hours slider"
```

---

### Task 2.3: CalculatorForm orchestration

**Files:**
- Create: `components/calculator-form.tsx`

- [ ] **Step 1: Write the form**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppliancePicker } from "./appliance-picker";
import { BackupHoursSlider } from "./backup-hours-slider";
import type { Appliance, AppliancePick } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  appliances: Appliance[];
  locale: "ar" | "en";
}

export function CalculatorForm({ appliances, locale }: Props) {
  const router = useRouter();
  const [picks, setPicks] = useState<AppliancePick[]>([]);
  const [hours, setHours] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  const ctaLabel = locale === "ar" ? "احسب احتياجي" : "Calculate";
  const errEmpty = locale === "ar" ? "اختر جهاز واحد على الأقل" : "Pick at least one appliance";
  const errFail = locale === "ar" ? "حدث خطأ، حاول تاني" : "Something went wrong, try again";

  async function submit() {
    if (picks.length === 0) { toast.error(errEmpty); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ picks, backupHours: hours }),
      });
      if (!res.ok) throw new Error("calc failed");
      const data = await res.json();
      const params = new URLSearchParams({
        kw: String(data.inverterKw),
        v: String(data.systemVoltage),
        bq: String(data.battery.qty),
        ba: String(data.battery.ahEach),
        w: String(data.totalRunningWatts),
        pmin: String(data.estimatedPriceEgp.min),
        pmax: String(data.estimatedPriceEgp.max),
        h: String(hours),
        big: data.tooLarge ? "1" : "0",
      });
      router.push(`/${locale}/result?${params.toString()}`);
    } catch {
      toast.error(errFail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <AppliancePicker appliances={appliances} picks={picks} locale={locale} onPicksChange={setPicks} />
      <BackupHoursSlider hours={hours} locale={locale} onChange={setHours} />
      <Button size="lg" className="w-full bg-accent text-accent-foreground hover:opacity-90" onClick={submit} disabled={submitting}>
        {submitting ? "..." : ctaLabel}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

Run: `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/calculator-form.tsx
git commit -m "feat(ui): calculator form with submit + result navigation"
```

---

### Task 2.4: ResultCard, ShopCard, ShopsList

**Files:**
- Create: `components/result-card.tsx`
- Create: `components/shop-card.tsx`
- Create: `components/shops-list.tsx`

- [ ] **Step 1: Write `components/result-card.tsx`**

```tsx
import { Card } from "@/components/ui/card";
import { AnkhLogo } from "./ankh-logo";

interface Props {
  inverterKw: number;
  systemVoltage: number;
  batteryQty: number;
  batteryAh: number;
  priceMin: number;
  priceMax: number;
  hours: number;
  locale: "ar" | "en";
}

export function ResultCard({ inverterKw, systemVoltage, batteryQty, batteryAh, priceMin, priceMax, hours, locale }: Props) {
  const t = locale === "ar"
    ? { need: "محتاج", inverter: "إنفرتر", batteries: batteryQty === 1 ? "بطارية" : "بطاريات", at: "على", priceLabel: "السعر التقديري", egp: "ج.م", forH: "لتغطية", h: "ساعة قطع" }
    : { need: "You need", inverter: "kW inverter", batteries: batteryQty === 1 ? "battery" : "batteries", at: "@", priceLabel: "Estimated price", egp: "EGP", forH: "to cover", h: "hours of outage" };

  return (
    <Card className="p-8 space-y-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <AnkhLogo size={48} className="text-accent" />
      <div className="space-y-2">
        <p className="text-sm opacity-80">{t.need}</p>
        <p className="text-3xl font-bold">{inverterKw} {t.inverter}</p>
        <p className="text-2xl">{batteryQty}× {batteryAh}Ah {t.batteries} {t.at} {systemVoltage}V</p>
      </div>
      <div className="pt-4 border-t border-white/20">
        <p className="text-sm opacity-80">{t.priceLabel}</p>
        <p className="text-2xl font-semibold text-accent">
          {priceMin.toLocaleString()} – {priceMax.toLocaleString()} {t.egp}
        </p>
      </div>
      <p className="text-sm opacity-70">{t.forH} {hours} {t.h}</p>
    </Card>
  );
}
```

- [ ] **Step 2: Write `components/shop-card.tsx`**

```tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, MapPin } from "lucide-react";
import type { Shop } from "@/lib/types";

interface Props {
  shop: Shop;
  locale: "ar" | "en";
  onShopClick: (shopId: string) => void;
}

export function ShopCard({ shop, locale, onShopClick }: Props) {
  const ctaWa = locale === "ar" ? "واتساب" : "WhatsApp";
  const ctaMaps = locale === "ar" ? "الموقع" : "Map";

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div>
        <p className="font-semibold">{shop.name}</p>
        <p className="text-sm text-muted-foreground">{shop.area}, {shop.governorate}</p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="default" size="sm" className="flex-1" onClick={() => onShopClick(shop.id)}>
          <a href={`https://wa.me/${shop.whatsapp_number}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4 me-1" />
            {ctaWa}
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" onClick={() => onShopClick(shop.id)}>
          <a href={shop.maps_url} target="_blank" rel="noopener noreferrer">
            <MapPin className="h-4 w-4 me-1" />
            {ctaMaps}
          </a>
        </Button>
      </div>
    </Card>
  );
}
```

- [ ] **Step 3: Write `components/shops-list.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShopCard } from "./shop-card";
import { trackEvent } from "@/lib/analytics";
import type { Shop, Governorate } from "@/lib/types";

interface Props {
  governorate?: Governorate;
  locale: "ar" | "en";
}

export function ShopsList({ governorate, locale }: Props) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("shops").select("*").eq("is_active", true);
      const all = (data ?? []) as Shop[];
      const local = governorate ? all.filter(s => s.governorate === governorate) : [];
      const others = all.filter(s => !governorate || s.governorate !== governorate);
      const ordered = [...local, ...others.sort(() => Math.random() - 0.5)].slice(0, 3);
      setShops(ordered);
      setLoading(false);
    })();
  }, [governorate]);

  const empty = locale === "ar"
    ? "محلات قريبًا — شارك النتيجة على واتساب لتأخذ عرض سعر."
    : "More shops coming soon — share this result on WhatsApp to get quotes.";

  if (loading) return <div className="text-center text-muted-foreground py-8">...</div>;
  if (shops.length === 0) return <p className="text-sm text-muted-foreground py-4">{empty}</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {shops.map(s => <ShopCard key={s.id} shop={s} locale={locale} onShopClick={(id) => trackEvent("shop_click", { shop_id: id })} />)}
    </div>
  );
}
```

- [ ] **Step 4: TypeScript check + commit**

Run: `pnpm exec tsc --noEmit` → expect 0 errors.

```bash
git add components/result-card.tsx components/shop-card.tsx components/shops-list.tsx
git commit -m "feat(ui): result card + shop card + shops list"
```

---

### Task 2.5: Analytics wrapper

**Files:**
- Create: `lib/analytics.ts`

- [ ] **Step 1: Write the wrapper**

```ts
declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string | number | boolean> }) => void;
  }
}

export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  if (typeof window.plausible !== "function") return;
  window.plausible(name, props ? { props } : undefined);
}

export {};
```

- [ ] **Step 2: Commit**

```bash
git add lib/analytics.ts
git commit -m "feat(analytics): plausible event wrapper"
```

---

## Phase 3: Pages, i18n, SEO — Days 11–17

### Task 3.1: Set up next-intl

**Files:**
- Create: `i18n.ts`
- Create: `middleware.ts`
- Modify: `next.config.ts`
- Create: `messages/ar.json`
- Create: `messages/en.json`

- [ ] **Step 1: Write `i18n.ts`**

```ts
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

const locales = ["ar", "en"] as const;
export type Locale = typeof locales[number];

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();
  return { messages: (await import(`./messages/${locale}.json`)).default };
});
```

- [ ] **Step 2: Write `middleware.ts`**

```ts
import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["ar", "en"],
  defaultLocale: "ar",
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 3: Update `next.config.ts`**

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 4: Write `messages/en.json`**

```json
{
  "site": {
    "title": "Ankh — The symbol of life. Now powering yours.",
    "description": "Free Egyptian battery and inverter sizing calculator. Tell us your appliances; we tell you what to buy."
  },
  "landing": {
    "hero_kicker": "When the power goes out, life shouldn't.",
    "hero_title": "What inverter and batteries do you really need?",
    "hero_subtitle": "Free, in Arabic, sized for your home in 90 seconds.",
    "cta_calculate": "Calculate now"
  },
  "calculator": {
    "step1_title": "What appliances do you have?",
    "step1_hint": "Tap to add. Tap + or − to set how many.",
    "submit": "Calculate"
  },
  "result": {
    "title": "Your recommendation",
    "share": "Share on WhatsApp",
    "shops_title": "Where to buy",
    "disclaimer": "This is an estimate. Confirm with a licensed installer before purchase.",
    "too_large_title": "Your load is unusually large",
    "too_large_body": "Talk to a licensed engineer for proper sizing."
  },
  "common": {
    "ar": "العربية",
    "en": "English"
  }
}
```

- [ ] **Step 5: Write `messages/ar.json`**

```json
{
  "site": {
    "title": "عنخ — رمز الحياة. دلوقتي بيشغل بيتك.",
    "description": "حاسبة مجانية مصرية تحدد لك الإنفرتر والبطاريات اللي محتاجها في بيتك."
  },
  "landing": {
    "hero_kicker": "لما الكهرباء تقطع، الحياة ما تتقطعش.",
    "hero_title": "إنفرتر وبطاريات إيه فعلاً اللي محتاجها؟",
    "hero_subtitle": "مجانًا، بالعربي، محسوب لبيتك في 90 ثانية.",
    "cta_calculate": "احسب احتياجك"
  },
  "calculator": {
    "step1_title": "إيه الأجهزة اللي عندك؟",
    "step1_hint": "اضغط على الجهاز عشان تضيفه. + و− يحددوا العدد.",
    "submit": "احسب"
  },
  "result": {
    "title": "النتيجة",
    "share": "شارك على واتساب",
    "shops_title": "محلات تشتري منها",
    "disclaimer": "النتيجة تقديرية. أكد مع فني مرخص قبل الشراء.",
    "too_large_title": "الحمل الكلي أكبر من المعتاد",
    "too_large_body": "تواصل مع مهندس مرخص لحساب المنظومة بدقة."
  },
  "common": {
    "ar": "العربية",
    "en": "English"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add i18n.ts middleware.ts next.config.ts messages/
git commit -m "feat(i18n): set up next-intl with ar (RTL) and en (LTR)"
```

---

### Task 3.2: Build root + locale layouts

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/[locale]/layout.tsx`

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["300", "500", "700"], variable: "--font-arabic" });
const latin = Inter({ subsets: ["latin"], variable: "--font-latin" });

export const metadata: Metadata = {
  title: "Ankh",
  description: "Egyptian battery & inverter sizing calculator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${arabic.variable} ${latin.variable}`} suppressHydrationWarning>
      <body>
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create `app/[locale]/layout.tsx`**

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

const locales = ["ar", "en"];

export function generateStaticParams() { return locales.map(l => ({ locale: l })); }

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} className="min-h-screen">
      <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
```

- [ ] **Step 3: TypeScript check**

Run: `pnpm exec tsc --noEmit` → expect 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/[locale]/layout.tsx
git commit -m "feat(layout): root + locale-aware layouts with fonts and direction"
```

---

### Task 3.3: Build landing page

**Files:**
- Create: `app/[locale]/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AnkhLogo } from "@/components/ankh-logo";
import { LangToggle } from "@/components/lang-toggle";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default function LandingPage({ params }: { params: { locale: "ar" | "en" } }) {
  return <LandingContent locale={params.locale} />;
}

function LandingContent({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("landing");

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <AnkhLogo className="text-accent" size={36} />
          <span className="text-xl font-bold">Ankh</span>
        </div>
        <LangToggle currentLocale={locale} />
      </header>

      <section className="container py-16 md:py-24 text-center max-w-3xl mx-auto">
        <p className="text-sm font-medium text-accent uppercase tracking-wider">{t("hero_kicker")}</p>
        <h1 className="text-4xl md:text-6xl font-extrabold mt-3 leading-tight">{t("hero_title")}</h1>
        <p className="text-lg text-muted-foreground mt-6">{t("hero_subtitle")}</p>
        <Button asChild size="lg" className="mt-10 bg-accent text-accent-foreground hover:opacity-90 text-lg px-10 py-6">
          <Link href={`/${locale}/calculator`}>{t("cta_calculate")}</Link>
        </Button>
      </section>

      <DisclaimerBanner locale={locale} />
    </main>
  );
}
```

- [ ] **Step 2: Smoke test**

Run `pnpm dev`. Open http://localhost:3000 — should redirect to `/ar` and show the landing page.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/page.tsx
git commit -m "feat(page): landing page with hero and CTA"
```

---

### Task 3.4: Build LangToggle, DisclaimerBanner

**Files:**
- Create: `components/lang-toggle.tsx`
- Create: `components/disclaimer-banner.tsx`

- [ ] **Step 1: Write LangToggle**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props { currentLocale: "ar" | "en" }

export function LangToggle({ currentLocale }: Props) {
  const pathname = usePathname();
  const target = currentLocale === "ar" ? "en" : "ar";
  const newPath = pathname.replace(/^\/(ar|en)/, `/${target}`);
  const label = target === "ar" ? "العربية" : "English";

  return (
    <Button asChild variant="ghost" size="sm">
      <Link href={newPath}>{label}</Link>
    </Button>
  );
}
```

- [ ] **Step 2: Write DisclaimerBanner**

```tsx
import { useTranslations } from "next-intl";

export function DisclaimerBanner({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("result");
  return (
    <div className="container py-4 text-center text-xs text-muted-foreground border-t mt-12">
      ⚠️ {t("disclaimer")}
    </div>
  );
}
```

- [ ] **Step 3: TypeScript check + commit**

Run: `pnpm exec tsc --noEmit` → expect 0 errors.

```bash
git add components/lang-toggle.tsx components/disclaimer-banner.tsx
git commit -m "feat(ui): language toggle and disclaimer banner"
```

---

### Task 3.5: Build calculator page

**Files:**
- Create: `app/[locale]/calculator/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import { supabase } from "@/lib/supabase";
import { CalculatorForm } from "@/components/calculator-form";
import { LangToggle } from "@/components/lang-toggle";
import { AnkhLogo } from "@/components/ankh-logo";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Appliance } from "@/lib/types";

export default async function CalculatorPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calculator" });

  const [{ data: appliances }, { data: variants }] = await Promise.all([
    supabase.from("appliances").select("*").order("sort_order"),
    supabase.from("appliance_variants").select("*").order("sort_order"),
  ]);

  const catalog: Appliance[] = (appliances ?? []).map((a: any) => ({
    ...a,
    variants: (variants ?? []).filter((v: any) => v.appliance_id === a.id),
  }));

  return (
    <main className="min-h-screen">
      <header className="container flex items-center justify-between py-6">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <AnkhLogo className="text-accent" size={32} />
          <span className="text-lg font-bold">Ankh</span>
        </Link>
        <LangToggle currentLocale={locale} />
      </header>

      <section className="container max-w-5xl py-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("step1_title")}</h1>
          <p className="text-muted-foreground mt-2">{t("step1_hint")}</p>
        </div>
        <CalculatorForm appliances={catalog} locale={locale} />
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Smoke test**

Run dev server. Open http://localhost:3000/ar/calculator. Confirm: appliance grid renders, slider works, submit button triggers (will fail server-side without real Supabase data — expected).

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/calculator/page.tsx
git commit -m "feat(page): calculator page with appliance picker and slider"
```

---

### Task 3.6: Build result page

**Files:**
- Create: `app/[locale]/result/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ResultCard } from "@/components/result-card";
import { ShopsList } from "@/components/shops-list";
import { LangToggle } from "@/components/lang-toggle";
import { AnkhLogo } from "@/components/ankh-logo";
import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/disclaimer-banner";

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "result" });

  const tooLarge = sp.big === "1";

  if (tooLarge) {
    return (
      <main className="min-h-screen container py-12 max-w-2xl mx-auto text-center space-y-4">
        <AnkhLogo size={48} className="text-accent mx-auto" />
        <h1 className="text-2xl font-bold">{t("too_large_title")}</h1>
        <p className="text-muted-foreground">{t("too_large_body")}</p>
        <Button asChild>
          <Link href={`/${locale}/calculator`}>← {locale === "ar" ? "ارجع" : "Back"}</Link>
        </Button>
      </main>
    );
  }

  const inverterKw = Number(sp.kw);
  const systemVoltage = Number(sp.v);
  const batteryQty = Number(sp.bq);
  const batteryAh = Number(sp.ba);
  const priceMin = Number(sp.pmin);
  const priceMax = Number(sp.pmax);
  const hours = Number(sp.h);

  return (
    <main className="min-h-screen">
      <header className="container flex items-center justify-between py-6">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <AnkhLogo className="text-accent" size={32} />
          <span className="text-lg font-bold">Ankh</span>
        </Link>
        <LangToggle currentLocale={locale} />
      </header>

      <section className="container max-w-2xl py-8 space-y-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <ResultCard
          inverterKw={inverterKw}
          systemVoltage={systemVoltage}
          batteryQty={batteryQty}
          batteryAh={batteryAh}
          priceMin={priceMin}
          priceMax={priceMax}
          hours={hours}
          locale={locale}
        />

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{t("shops_title")}</h2>
          <ShopsList locale={locale} />
        </div>
      </section>

      <DisclaimerBanner locale={locale} />
    </main>
  );
}
```

- [ ] **Step 2: Smoke test**

Open http://localhost:3000/ar/result?kw=3&v=24&bq=1&ba=200&w=1295&pmin=71000&pmax=109000&h=4&big=0
Expected: result card renders with the values.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/result/page.tsx
git commit -m "feat(page): result page reading from query params"
```

---

### Task 3.7: SEO assets — robots, sitemap, OG

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`
- Create: `public/og-image.png` (manual export from a design tool — placeholder for now)

- [ ] **Step 1: Write `app/sitemap.ts`**

```ts
import type { MetadataRoute } from "next";

const BASE = "https://ankh.eg";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/calculator"];
  const locales = ["ar", "en"];
  return routes.flatMap(r => locales.map(l => ({ url: `${BASE}/${l}${r}`, lastModified: new Date() })));
}
```

- [ ] **Step 2: Write `app/robots.ts`**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://ankh.eg/sitemap.xml",
  };
}
```

- [ ] **Step 3: Add OG metadata to `app/[locale]/page.tsx`**

Append at the top of the file:

```tsx
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: ["/og-image.png"],
      type: "website",
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
  };
}
```

- [ ] **Step 4: Create placeholder OG image**

Create `public/og-image.png` (1200×630). For now, use any solid-color placeholder PNG. Replace with branded export before launch.

- [ ] **Step 5: Verify**

```bash
pnpm dev
curl -s http://localhost:3000/sitemap.xml | head -20
curl -s http://localhost:3000/robots.txt
```
Expected: sitemap XML lists 4 URLs; robots allows all.

- [ ] **Step 6: Commit**

```bash
git add app/sitemap.ts app/robots.ts app/[locale]/page.tsx public/og-image.png
git commit -m "feat(seo): sitemap, robots, OpenGraph metadata"
```

---

### Task 3.8: Add Plausible script

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add the script tag**

In `app/layout.tsx`, add inside the `<html>` (just before `<body>`):

```tsx
<head>
  <script
    defer
    data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
    src="https://plausible.io/js/script.js"
  />
</head>
```

- [ ] **Step 2: Add a Plausible site for ankh.eg in the Plausible dashboard**

Visit https://plausible.io/sites → add `ankh.eg`.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat(analytics): add Plausible tracking script"
```

---

### Task 3.9: Recruit and seed shops (HUMAN WORK)

**5 shops in Greater Cairo. Estimated: 4–6 hours of in-person + WhatsApp outreach.**

- [ ] **Step 1: Build a target list of 10 shops**

Visit Abbas El Akkad (Nasr City), Obour, Maadi, El-Khazendar (Heliopolis). Note the names and WhatsApp numbers of inverter/battery shops.

- [ ] **Step 2: Pitch each in person or via WhatsApp**

Pitch script: *"بنبني موقع مجاني يساعد الناس تحدد محتاجة إنفرتر وبطاريات بأي حجم. لما حد يخلص الحساب بنوريهم 3 محلات. بنحب نضم محلكم. مفيش رسوم، مفيش عمولة. شغل تجريبي للشهور الأولى."*

- [ ] **Step 3: Confirm 5 yeses, collect details**

For each: name, governorate, area, WhatsApp number (with country code, no leading 0), Google Maps URL, Facebook URL, specialty tags.

- [ ] **Step 4: Insert into shops table via Supabase SQL editor**

```sql
insert into shops (name, governorate, area, whatsapp_number, maps_url, facebook_url, specialty_tags, is_active, verified_at) values
  ('Shop 1 Name', 'Cairo', 'Nasr City', '20102XXXXXXX', 'https://maps.google.com/?q=...', 'https://facebook.com/...', '{inverter,battery,installation}', true, now()),
  -- ... 4 more rows
;
```

- [ ] **Step 5: Verify**

In Supabase SQL: `select count(*) from shops where is_active;` → should be ≥ 3, target = 5.

---

## Phase 4: E2E + Launch — Days 18–28

### Task 4.1: Playwright E2E happy path

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/happy-path.spec.ts`

- [ ] **Step 1: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } },
  ],
  webServer: { command: "pnpm dev", port: 3000, reuseExistingServer: true },
});
```

- [ ] **Step 2: Write `tests/e2e/happy-path.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("calculator happy path produces a result", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: /احسب/ }).click();
  await expect(page).toHaveURL(/\/calculator$/);

  // increment first appliance
  const firstIncrement = page.getByLabel("increment").first();
  await firstIncrement.click();

  await page.getByRole("button", { name: /احسب/i }).click();
  await page.waitForURL(/\/result/);

  await expect(page.getByText(/إنفرتر/)).toBeVisible();
});
```

- [ ] **Step 3: Run E2E**

Run: `pnpm test:e2e`
Expected: 2 passes (chromium + mobile).

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/happy-path.spec.ts
git commit -m "test(e2e): happy path from landing → calculator → result"
```

---

### Task 4.2: Production build verification

- [ ] **Step 1: Build**

Run: `pnpm build`
Expected: build completes with no errors. Note any large bundle warnings.

- [ ] **Step 2: Run production server locally**

Run: `pnpm start`
Open http://localhost:3000 and walk through landing → calculator → result.
Expected: identical behavior to dev mode.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: 0 errors. Fix any.

- [ ] **Step 4: Commit any lint fixes**

```bash
git add -p
git commit -m "chore: lint fixes pre-deploy"
```

---

### Task 4.3: Deploy to Vercel

- [ ] **Step 1: Install Vercel CLI**

```bash
pnpm add -g vercel
vercel login
```

- [ ] **Step 2: Link the project**

```bash
cd /Users/mahmoudomar/Work/sikasio/ankh
vercel link
```

When prompted: scope = your team, framework = Next.js (auto-detected), root = `.`

- [ ] **Step 3: Set env vars on Vercel**

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# paste value
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# paste value
vercel env add NEXT_PUBLIC_PLAUSIBLE_DOMAIN production
# enter ankh.eg
```

Repeat for `preview` environment.

- [ ] **Step 4: Deploy**

```bash
vercel --prod
```

Note the deployed URL.

- [ ] **Step 5: Smoke test on production**

Open the production URL. Walk through landing → calculator → result. Confirm everything works.

- [ ] **Step 6: Connect custom domain (when DNS ready)**

In Vercel dashboard → project settings → domains → add `ankh.eg` and `www.ankh.eg`. Follow DNS instructions.

---

### Task 4.4: Cross-device testing

- [ ] **Step 1: Test on Android Chrome**

On a real Android phone, open the production URL. Walk through full flow. Note any issues:
- Text legibility
- RTL layout correctness
- Slider thumb size
- Tap target sizes
- Form submission speed

- [ ] **Step 2: Test on iOS Safari**

Repeat on a real iPhone. Note any issues.

- [ ] **Step 3: Fix critical bugs**

For each issue, create a focused commit. No batched fixes.

- [ ] **Step 4: Re-test fixes**

Confirm each fix on the original device.

---

### Task 4.5: Soft launch + feedback collection

- [ ] **Step 1: Create a Google Form**

Title: "Ankh Beta Feedback". 5 short questions:
1. Did you find what you needed? (yes/partly/no)
2. Was the calculator easy to use? (1–5)
3. What appliance was missing?
4. Any bugs or confusion?
5. Would you recommend it? (1–5)

- [ ] **Step 2: Add a feedback link to the result page**

In `app/[locale]/result/page.tsx`, add a small button/link at the bottom of the page:
```tsx
<a href="https://forms.gle/YOUR-FORM-ID" target="_blank" rel="noopener" className="text-sm text-muted-foreground underline">
  {locale === "ar" ? "أعطنا رأيك" : "Send us feedback"}
</a>
```

- [ ] **Step 3: Commit + redeploy**

```bash
git add app/[locale]/result/page.tsx
git commit -m "feat(launch): add feedback link to result page"
vercel --prod
```

- [ ] **Step 4: Soft-launch posts**

Prepare and publish:
1. One Facebook post (personal + sikasio page) explaining the problem and the link.
2. One WhatsApp Status share to your contacts.
3. Direct DM to 5 friends asking them to try it and break it.

- [ ] **Step 5: Watch Plausible for the first 7 days**

Monitor: completion rate, "Where to buy" click rate, average time, top exit page. Diagnose drop-off points before week 2.

---

## Self-Review Checklist (Pre-Launch)

Run through this before claiming "done":

- [ ] All 25 appliance wattages verified against real spec sheets (Task 0.9 done, not skipped)
- [ ] All 7+ unit tests passing (`pnpm test`)
- [ ] E2E test passing on chromium + mobile (`pnpm test:e2e`)
- [ ] Production build clean (`pnpm build`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Light + dark mode both visually correct
- [ ] AR (RTL) and EN (LTR) both render without layout breaks
- [ ] Result page works when accessed by URL alone (share URL test)
- [ ] At least 3 active shops in the database
- [ ] Disclaimer banner visible on landing + result
- [ ] Feedback link present on result page
- [ ] Plausible tracking events firing (verify in Plausible dashboard)
- [ ] Custom domain pointing to production
- [ ] OG image renders correctly in WhatsApp / Facebook share preview

---

## Spec Coverage Map

| Spec section | Tasks |
|--------------|-------|
| §1 Identity | 0.5 (logo) |
| §2 Problem | (no code — context) |
| §3 Target user | (no code — context) |
| §4 V1 scope IN | 0.4–4.5 |
| §4 V1 scope OUT | (none — explicitly excluded) |
| §5 User journey | 3.3, 3.5, 3.6 |
| §6 Architecture | 0.1, 0.2, 0.6 |
| §7 Theme adaptation | 0.3 |
| §8 Calculation engine | 1.2–1.7 |
| §9 Appliance database | 0.7, 0.8, 0.9 |
| §10 Shops directory | 0.7, 2.4, 3.9 |
| §11 Success metrics | 4.5 (Plausible tracking) |
| §12 4-week timeline | All phases |
| §13 Open decisions | (resolved before plan execution) |
| §14 Risks | (mitigations baked into tasks) |
| §15 Post-V1 | (out of scope) |

---

**End of plan.**
