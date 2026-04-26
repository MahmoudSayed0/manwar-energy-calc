# Ankh — MVP Design Spec

**Date:** 2026-04-26
**Status:** Draft for review
**Owner:** Sikasio studio (2-person team)

---

## 1. Identity

- **Name:** Ankh (عنخ)
- **Symbol:** The Egyptian ankh — symbol of life. Repurposed here as "the symbol of life that does not go out when the power does."
- **Tagline (EN):** *"The symbol of life. Now powering yours."*
- **Tagline (AR):** *"رمز الحياة… دلوقتي بيشغّل بيتك."*
- **Domain target:** ankh.eg / useankh.com / ankh.app (final pick during week 1)

## 2. Problem & Opportunity

Egypt has been in a daily load-shedding cycle since mid-2024. Households are panic-buying inverters and batteries with **zero engineering knowledge**, leading to:

- Oversized systems they don't need (wasted money)
- Undersized systems that fail under load (lost trust)
- WhatsApp messages to shops from buyers who can't even describe their needs

There is **no clean Arabic-language sizing tool** built for the Egyptian appliance market. That is the gap.

## 3. Target User (V1)

- **Primary:** Egyptian household decision-maker, age 30–55, urban (Cairo, Giza, Alexandria, Mansoura)
- **Tech comfort:** Uses WhatsApp daily. Comfortable with Facebook. Mostly mobile web, not app stores.
- **State of mind:** Already searching "best inverter Egypt" or "battery size calculator" or being told contradictory advice by 3 different shops.
- **Language:** Arabic primary, English secondary toggle.

## 4. V1 Scope

### IN scope ✅

1. **Landing page** — one-sentence problem statement + single CTA: *"احسب احتياجك الآن"* / "Calculate your needs now"
2. **Calculator flow** — appliance picker (cards) → backup hours selector → result page
3. **Pre-populated appliance database** — ~25 most common Egyptian household appliances with running + surge wattage
4. **Sizing engine** — inverter kW rating + battery Ah rating, with surge-aware math
5. **Result page** — system recommendation + price range estimate (EGP) + 3–5 partner shops with public WhatsApp / Maps links
6. **Bilingual UI** — Arabic (RTL) + English (LTR) toggle, full coverage
7. **Analytics** — event tracking on calculator completion + "Where to buy" clicks (Plausible or PostHog)
8. **SEO basics** — proper meta tags, OpenGraph, sitemap, Arabic + English landing pages indexed

### OUT of scope ❌ (V2+ only)

- ❌ Mobile app (React Native / Expo)
- ❌ OCR / barcode scanning of appliance labels
- ❌ User accounts, login, password
- ❌ Payments, escrow, on-platform commission tracking
- ❌ Supplier dashboard (suppliers manage themselves via direct WhatsApp for V1)
- ❌ Power consumption tracking / IoT
- ❌ Push notifications, maintenance reminders
- ❌ Saved calculations / history
- ❌ Solar panel sizing (battery + inverter only for V1)

## 5. User Journey (V1)

```
Landing page (1 sentence + 1 button)
    ↓
Step 1: "What appliances do you have?"
    → Grid of cards (Fridge, AC, TV, Lights, Router, Washer, …)
    → Each card: tap to add, tap again to remove
    → For sized items (AC, fridge): pick small/medium/large variant
    ↓
Step 2: "How many hours of power cuts per day?"
    → Slider 1–12 hours, default 4
    ↓
Step 3: Result page
    → "You need a 3 kW inverter + 2× 200 Ah batteries"
    → Estimated price: EGP 35,000 – 55,000
    → Why this size? (expandable explanation)
    → "Where to buy?" → 3–5 partner shops as cards (name, area, WhatsApp link, Google Maps link)
    → Share button (WhatsApp / Copy link) — preserves the result for re-opening
```

**Total user time to result:** under 90 seconds.

## 6. Architecture

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 16 (App Router) | Same stack as OSA panel — team already fluent |
| **UI primitives** | shadcn/ui + Radix | Reused from OSA, consistent design language |
| **Styling** | Tailwind CSS v3 | Reused from OSA |
| **Forms** | react-hook-form + zod | Reused from OSA |
| **Database** | Supabase (Postgres) | Free tier, fast to iterate, hosts the appliance catalog and shop directory |
| **Hosting** | Vercel | Free tier, SSR + edge caching, zero-config Next.js |
| **Analytics** | Plausible (cloud) or PostHog (self-host on Supabase) | GDPR-friendly, lightweight |
| **i18n** | next-intl | Mature, RTL support, route-based locales (`/ar` and `/en`) |
| **Fonts** | IBM Plex Sans Arabic (AR) + Inter (EN) | Free, professional, full Arabic coverage |

**No backend service.** Calculation runs server-side in a Next.js Route Handler (`app/api/calculate/route.ts`). Database holds appliances + shops, not user state.

## 7. Theme — Adapt OSA for Ankh

The OSA admin panel (`/Users/mahmoudomar/Work/Oinride/OSA-admin-panal`) is the visual base. Reuse:

- shadcn/ui component library (Button, Card, Dialog, Slider, Select, Sheet, Sonner toasts)
- 0.75rem default radius, 1rem `lg`, 1.25rem `xl`
- Shadow tokens (sm / md / lg)
- Tailwind config skeleton
- Light + dark mode structure

Adapt for Ankh's heritage feel:

| Token | OSA value | Ankh value | Note |
|-------|-----------|------------|------|
| `--primary` | `222 69% 26%` (navy) | `222 69% 26%` (keep) | Trust, depth, Nile reference |
| `--accent` | `222 30% 90%` (light) | `38 80% 55%` (Egyptian gold) | Heritage warmth, hieroglyph gold leaf |
| `--success` | `142 76% 36%` (green) | keep | "Power on" indicator |
| `--warning` | `38 92% 50%` (amber) | `25 95% 55%` (sunset orange) | Differentiate from gold accent |
| `--radius` | `0.75rem` | keep | Modern but not aggressive |

**Logo direction:** A single-line geometric ankh symbol in the gold accent on navy backgrounds, navy on light backgrounds. Modern minimalist — *not* a literal hieroglyph illustration.

**Type:** IBM Plex Sans Arabic (300/500/700) for Arabic; Inter for English. Both free and load fast.

## 8. Calculation Engine — The Hard Part

### Inputs
- `appliances`: array of `{ id, variant?, count }`
- `backup_hours`: 1–12

### Database fields per appliance variant
- `running_watts`: typical steady-state power draw
- `surge_watts`: startup peak (compressors, motors)
- `inductive`: bool (does it have a motor / compressor)
- `notes_ar`, `notes_en`: free text shown on result if relevant ("AC water heaters drain batteries fast")

### Sizing formulas

**Inverter rating (kW):**
```
sum_running_W   = Σ (variant.running_watts × count) over all selected appliances
max_surge_extra = max over inductive appliances of (surge_watts − running_watts) × count_of_that_one
required_W      = (sum_running_W + max_surge_extra) × 1.20      # 20% safety margin
inverter_kW     = round_up_to_standard(required_W / 1000)
                  # standard sizes: 1, 1.5, 2, 3, 5, 6, 8, 10
```

**Voltage selection (must run BEFORE battery sizing):**
- inverter ≤ 1.5 kW → 12V system
- inverter 2–3 kW → 24V system
- inverter ≥ 5 kW → 48V system

**Battery capacity (Ah at the selected voltage):**
```
energy_needed_Wh    = sum_running_W × backup_hours
inverter_efficiency = 0.85
battery_chemistry   = "lithium"   # V1 default; lead-acid is V2 toggle
DoD                 = 0.80         # lithium
required_Wh         = energy_needed_Wh / (inverter_efficiency × DoD)
required_Ah         = required_Wh / system_voltage_V   # voltage from rule above
(qty, Ah_each)      = pick_pack(required_Ah)
```

**`pick_pack` rule (deterministic, single-result):**
1. Available single-battery sizes: `[100, 150, 200, 250]` Ah
2. Try `qty = 1` with the smallest size that meets `required_Ah`
3. If no single size meets it → `qty = 2` with the smallest size where `2 × size ≥ required_Ah`
4. If 2× still doesn't meet it → `qty = 4` with smallest matching size (avoid 3-battery banks; uneven on 12/24/48V buses)
5. If 4× 250Ah still doesn't meet it → return "system too large for V1, talk to engineer"

**Price estimate:** EGP price per inverter kW (EGP 4,500–7,500 mid-2026) and per battery Ah-Wh (EGP 12–18/Wh for lithium). Multiply, output as a range. **All prices stored as Supabase rows so we can update without redeploying.**

### Edge cases handled in V1
- User picks no appliances → block calculate, friendly message
- Total > 10 kW → result says "your load is unusual, talk to an engineer" + link to shops, no specific recommendation
- AC + water heater both selected → notes warning that water heaters on battery is rarely cost-effective

### Engineering risk acknowledgement

This calculation is **simplified by design**. It will not handle:
- Three-phase loads (commercial)
- Solar panel sizing
- Cold/hot temperature derating
- Mixed lithium + lead-acid systems

A disclaimer is **always shown** on the result: *"This is an estimate. Confirm with a licensed installer before purchase."*

## 9. Appliance Database — V1 Catalog

~25 entries, each with size variants where relevant. Stored in Supabase table `appliances`.

| Appliance | Variants | Running W | Surge W | Inductive |
|-----------|----------|-----------|---------|-----------|
| Fridge | small / medium / large | 100 / 150 / 250 | 600 / 900 / 1200 | yes |
| Split AC | 1HP / 1.5HP / 2HP / 3HP | 750 / 1100 / 1500 / 2200 | 2250 / 3300 / 4500 / 6600 | yes |
| LED bulb | 9W / 15W | 9 / 15 | 9 / 15 | no |
| Old bulb | 60W / 100W | 60 / 100 | 60 / 100 | no |
| TV LED | 32" / 43" / 55" / 65" | 60 / 80 / 110 / 150 | same | no |
| Wifi router | — | 10 | 10 | no |
| Phone charger | — | 10 | 10 | no |
| Laptop | — | 80 | 80 | no |
| Desktop PC | — | 250 | 350 | no |
| Washing machine | small / large | 500 / 800 | 1500 / 2400 | yes |
| Washer w/ heater | — | 2000 | 2400 | yes |
| Water heater (electric) | small / large | 1500 / 3000 | same | no |
| Microwave | — | 1200 | 1500 | no |
| Electric iron | — | 1200 | 1200 | no |
| Hair dryer | — | 1800 | 1800 | no |
| Ceiling fan | — | 75 | 150 | yes |
| Desk fan | — | 50 | 100 | yes |
| Vacuum cleaner | — | 1400 | 2000 | yes |
| Coffee machine | — | 1000 | 1000 | no |
| Toaster | — | 800 | 800 | no |
| Blender | — | 400 | 600 | yes |
| Game console | — | 150 | 150 | no |
| Printer | — | 50 (idle) | 600 (printing) | no |
| CCTV / NVR | — | 30 | 30 | no |
| Doorbell / intercom | — | 5 | 5 | no |

Wattages are **conservative typical values** for the Egyptian market based on common-brand spec sheets (LG, Samsung, Tornado, Fresh, Carrier, Sharp). The exact research is part of Week 1 work — these numbers in the spec are placeholder estimates that **must be verified** before launch.

## 10. Shops Directory — V1

Manually curated table in Supabase. Goal: 5 partner shops in Greater Cairo by launch.

Each row:
- `name`, `governorate` (`Cairo` / `Giza` / `Alexandria` / `Other`), `area` (district), `address`
- `whatsapp_number` → deep-linked as `wa.me/<number>`
- `maps_url` (Google Maps)
- `facebook_url`
- `specialty_tags`: subset of `inverter`, `battery`, `solar`, `installation`
- `verified_at` date
- `is_active` boolean

Display rule (V1 — deterministic, no GPS):
- Optional question on the calculator: "Your governorate?" with a 4-option select (`Cairo`, `Giza`, `Alexandria`, `Other`). Default = unset.
- If governorate is set: show up to 3 shops in that governorate first; if fewer than 3 exist there, fill remaining slots from other governorates (random).
- If governorate is unset: show 3 random verified shops.
- If fewer than 3 verified shops exist: display however many there are, plus a single fallback card: *"More shops coming soon — share this result on WhatsApp to get quotes."*

## 11. Success Metrics (60 days post-launch)

| Metric | Win threshold | Lose threshold |
|--------|---------------|----------------|
| Calculator completions | ≥ 1,000 | < 200 |
| "Where to buy" clicks | ≥ 100 | < 20 |
| Avg session duration | ≥ 90 seconds | < 30 seconds |
| Bounce rate | ≤ 60% | > 85% |
| Return visitors (30d) | ≥ 100 | < 10 |

**Decision rule:**
- All "win" thresholds met → invest in V2 (supplier dashboard, lead routing, commission)
- Some met → diagnose specific funnel step, iterate V1
- All "lose" thresholds → kill or pivot before more capital is sunk

## 12. 4-Week Phased Build

### Week 1 — Data + design foundation
- Set up Next.js 16 project at `/Users/mahmoudomar/Work/sikasio/ankh/app`
- Port OSA's Tailwind config, globals.css, and shadcn/ui components
- Apply Ankh palette (gold accent, refined fonts)
- Research and verify the 25 appliance wattages from real Egyptian-market spec sheets
- Set up Supabase project, create `appliances` and `shops` tables
- Seed `appliances` with verified data
- Domain purchase + DNS pointed to Vercel

### Week 2 — Calculator engine + result page
- Build the sizing formulas as pure TypeScript functions in `lib/sizing.ts` (testable in isolation)
- Unit tests for sizing edge cases (no appliances, only AC, AC + fridge + lights)
- Build appliance picker UI (cards with `+/−` count and variant selector)
- Build backup hours slider
- Build result page with system recommendation + price range
- API route `app/api/calculate/route.ts` that calls `lib/sizing.ts`

### Week 3 — Polish + bilingual + landing
- Build landing page with hero, problem statement, single CTA
- Set up next-intl with `/ar` (RTL) and `/en` (LTR) routes
- Translate all copy (60-80 strings — manageable)
- Add OpenGraph, Twitter cards, sitemap, robots.txt
- Recruit 5 shops manually (in-person or via WhatsApp), populate `shops` table
- Add analytics (Plausible)

### Week 4 — Deploy + dogfood + share
- Production deploy on Vercel
- Test with 10 friends/family across phones (Android Chrome, iOS Safari)
- Fix all critical bugs
- Soft launch on personal Facebook + WhatsApp groups
- Set up a feedback collection mechanism (simple Google Form linked from result page)

## 13. Open Decisions for User Review

These are explicit — please confirm or change:

1. **Domain:** prefer `ankh.eg` if available; fallback `useankh.com`. **(decision needed by Day 3)**
2. **Lithium-only V1:** lead-acid math is more complex (DoD 50%, lower roundtrip eff). V1 assumes lithium. Lead-acid is a V1.1 toggle if shop feedback demands it.
3. **Shop count for launch:** 5 is the target. Soft launch is OK with 3 verified shops + the fallback message.
4. **Pricing data freshness:** prices in Supabase, manually updated monthly. No automated scraping in V1.
5. **No accounts in V1:** confirmed. Result is share-only via URL parameters (`/result?inv=3&bat=200&qty=2`).

## 14. Risks (and mitigations)

| Risk | Mitigation |
|------|------------|
| Wattage data is wrong → undersized recommendations → bad reviews | Conservative round-up + 20% safety margin + always-visible disclaimer |
| Shops won't agree to be listed | Soft launch with 3 shops + fallback "share on WhatsApp" CTA |
| Arabic text rendering bugs (RTL) | Use battle-tested libraries (next-intl, IBM Plex Arabic) and test on real Android devices early |
| Traffic is too low to validate | Pre-launch: prepare 5 Facebook posts, 3 reels, 1 outreach to a known electrician influencer. SEO is week-3 work, not week-4 wishful thinking. |
| Team gets pulled into V2 features before V1 ships | Hard rule: nothing in the OUT-of-scope list ships in the first 4 weeks, regardless of how easy it seems |

## 15. What Happens After V1

If success metrics hit, V2 is **the supplier-facing layer**:
- Supplier login + lightweight dashboard (uses OSA panel patterns directly)
- Lead intake: each result-page WhatsApp click is logged with a unique ID, supplier confirms close → commission triggered
- Paid placement tier (top-of-list)
- Solar panel sizing extension
- Lead-acid + hybrid system support

If success metrics miss, the calculator stays online as a free SEO asset and content magnet, while we evaluate whether the gap is in the product, the market, or the marketing.

---

**End of spec.**
