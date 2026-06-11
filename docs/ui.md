# UI Coding Standards

This document defines the UI standards for this project. All contributors
(human and AI) must follow these rules when building or modifying any UI.

## 1. shadcn/ui components only

All UI in this project must be built using **shadcn/ui** components from
`src/components/ui/`. Pages and features must compose these components
rather than building UI from raw HTML elements styled with ad-hoc Tailwind
classes.

## 2. No custom components

**Absolutely no custom components may be created.** This includes:

- New files in `src/components/` outside of `src/components/ui/`
- Feature-specific or page-specific components (e.g. a hand-written
  `DatePicker.tsx`, `DashboardCard.tsx`, etc.)
- Hand-rolled wrappers around shadcn primitives that duplicate existing
  shadcn functionality

If a needed UI element does not yet exist in `src/components/ui/`, it must
be added via the shadcn CLI (`npx shadcn add <component>`), not hand-written.

## 3. Use the shadcn CLI to add components

When a page needs a component that isn't yet installed (e.g. `Card`,
`Calendar`, `Popover`, `Input`, `Table`), install it with:

```bash
npx shadcn add <component>
```

This adds the component to `src/components/ui/` following the project's
`components.json` configuration (style: `radix-nova`, base color: `neutral`,
icon library: `lucide`). Do not write equivalent components by hand.

## 4. Composition over creation

Build pages by composing existing shadcn components and primitives
(`Card`, `Button`, `Input`, `Calendar`, `Popover`, `Table`, etc.) directly in
route files (`page.tsx`). Layout and spacing should be handled with Tailwind
utility classes applied directly to shadcn components, not via new wrapper
components.

## 5. Icons

Use `lucide-react` for icons, consistent with the project's configured icon
library. Do not introduce other icon libraries.

## 6. Styling

- Use Tailwind CSS v4 utility classes for layout, spacing, and one-off
  styling.
- Do not introduce CSS Modules, styled-components, or other styling
  approaches.
- Theming and design tokens (colors, radii, etc.) are controlled via
  `src/app/globals.css` and shadcn's CSS variables. Do not hardcode colors
  that bypass the theme.

## 7. Date formatting

All date formatting must use **`date-fns`** (add it to `package.json` if not
already present — do not hand-roll date formatting logic).

Dates must be displayed in the format **`do MMM yyyy`**, e.g.:

- `1st Sep 2026`
- `3rd Jan 2026`

Example:

```ts
import { format } from "date-fns";

format(new Date(), "do MMM yyyy"); // "1st Sep 2026"
```

Do not use `Date.prototype.toLocaleDateString`, manual string concatenation,
or any other ad-hoc date formatting approach.

## 8. Existing non-compliant code

Any existing custom components (e.g. `src/app/dashboard/DatePicker.tsx`)
should be migrated to shadcn equivalents (e.g. `Calendar` + `Popover`) as
they are touched. Do not use them as a pattern for new code.
