# LinkPocket design tokens

The single source of truth for colour in the web app. It replaces the colours in the original
DESIGN DIRECTION (near-black ground, `#E4572E` accent); typography and layout from that
direction still apply. Every later phase follows this file.

- **Palette:** Indigo + Violet + Neutral Slate.
- **Implementation:** `app/globals.css` (shadcn token names, oklch values, hex in comments).
  Components use only the Tailwind utilities those tokens create (`bg-primary`,
  `text-muted-foreground`, `border-border` and so on). No component holds a hex, `rgb()`,
  `bg-black`, `bg-zinc-*` or other palette class.
- **Accessibility:** every text/background pair meets WCAG 2.1 AA in both themes, checked by
  axe-core in `e2e/a11y.spec.ts` at 360 and 1440 px. Fix a failing pair by moving to another
  shade of the same ramp, never by adding a colour.

## Typography (unchanged)

Clash Display for headings, Satoshi for UI and body, JetBrains Mono for URLs and domains.

## Tokens

| Token                                     | Light                     | Dark                                  |
| ----------------------------------------- | ------------------------- | ------------------------------------- |
| `background`                              | `#F8FAFC` slate-50        | `#0F172A` slate-900                   |
| `card`, `popover`                         | `#FFFFFF`                 | `#1E293B` slate-800                   |
| `muted`, `secondary`                      | `#F1F5F9` slate-100       | `#1E293B` slate-800                   |
| `accent` (shadcn neutral hover surface)   | `#F1F5F9` slate-100       | `#334155` slate-700                   |
| `border`                                  | `#E2E8F0` slate-200       | `#334155` slate-700                   |
| `input` (form-control outline, see below) | `#64748B` slate-500       | `#64748B` slate-500                   |
| `foreground`                              | `#0F172A` slate-900       | `#F1F5F9` slate-100                   |
| `muted-foreground`                        | `#64748B` slate-500       | `#94A3B8` slate-400                   |
| `primary`                                 | `#4F46E5` indigo-600      | `#818CF8` indigo-400                  |
| `primary-foreground`                      | `#FFFFFF`                 | `#0F172A`                             |
| `primary-hover`                           | `#4338CA` indigo-700      | `#A5B4FC` indigo-300                  |
| `violet`                                  | `#7C3AED` violet-600      | `#A78BFA` violet-400                  |
| `violet-foreground`                       | `#FFFFFF`                 | `#0F172A`                             |
| `indigo-soft` / `indigo-soft-foreground`  | `#EEF2FF` / `#3730A3`     | `rgba(99,102,241,0.15)` / `#A5B4FC`   |
| `violet-soft` / `violet-soft-foreground`  | `#EDE9FE` / `#5B21B6`     | `rgba(139,92,246,0.15)` / `#C4B5FD`   |
| `ring`                                    | `#6366F1` indigo-500      | `#818CF8`                             |
| `destructive`                             | `#DC2626` red-600         | `#F87171` red-400                     |
| `destructive-foreground`                  | `#FFFFFF`                 | `#0F172A`                             |
| `chart-1`, `chart-2`                      | `#4F46E5`, `#7C3AED`      | `#818CF8`, `#A78BFA`                  |
| `overlay` (dialog backdrop)               | slate-900 at 45%          | slate-950 at 60%                      |
| `qr-paper`, `qr-ink`                      | `#FFFFFF`, `#0F172A`      | the same: QR codes stay dark on white |
| `shadow-card`                             | very soft slate-900 at 5% | none                                  |

Dark is slate, never pure black.

**`input` differs from the brief's slate-200.** Text-field and button outlines must reach 3:1
against their surface (WCAG 2.1 SC 1.4.11). Slate-200 gives 1.2:1 on white, so `input` uses
slate-500 (4.8:1 on white, 3.1:1 on slate-800). Card and divider borders stay on `border`.

## Colour roles

- **Indigo (`primary`, `ring`, `indigo-soft`)**: primary buttons (Save, every form submit),
  links, focus rings, the active admin nav item, search and input focus, and "Load more".
- **Violet (`violet`, `violet-soft`)**: pinned state (filled violet pin, a 3 px violet left edge
  on pinned cards, the "Pinned" label and the active "Pinned" filter), active tag filter chips,
  the "Admin" badge, and the second series in admin charts.
- **Slate**: everything else, including the page ground, cards, text, borders, inactive tags
  (slate-soft chips on `secondary`) and the icons in a card's action row.
- **Destructive red**: delete confirmations and error messages only.
- **One gradient**: the logo mark (the dot after "LinkPocket") runs `logo-from` → `logo-to`,
  `#4F46E5` → `#7C3AED` (dark: `#818CF8` → `#A78BFA`). No other gradients anywhere.

## Cards

- Light: `card` (white) on `background` (slate-50), 1 px `border`, `shadow-card`.
- Dark: `card` (slate-800) on `background` (slate-900), 1 px `border` (slate-700), no shadow.
- Hover: the border moves to `indigo-soft-foreground` at 40% opacity.
- Pinned: the violet left edge is an inset shadow (`.pinned-edge`), so the layout does not move.

## Theme

`next-themes`, class strategy (`.dark` on `<html>`). First-time visitors get **light**
whatever the OS prefers; the header toggle switches theme and the choice is kept in
`localStorage` (`lp:theme`). The inline theme script carries the CSP nonce.

## Allowed exceptions

Colours outside `app/globals.css` only where CSS variables cannot be read:

- `lib/qr.ts`: the QR raster (`#0F172A` on `#FFFFFF`), matching `qr-ink` and `qr-paper`.

## Checks

- `e2e/a11y.spec.ts`: axe WCAG 2.1 AA and no horizontal scroll, light and dark, 360 and
  1440 px. It covers signed-out pages, verify-email, the library with the save details open,
  the QR and edit dialogs, account settings, and admin.
- `e2e/theme.spec.ts`: light by default with an OS dark preference; the toggle persists.
- `e2e/screenshots.spec.ts`: design review screenshots when `SCREENSHOT_DIR` is set.
