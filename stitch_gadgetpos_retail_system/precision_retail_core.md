---
name: Precision Retail Core
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#004870'
  on-tertiary: '#ffffff'
  tertiary-container: '#006194'
  on-tertiary-container: '#b2d9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-numeric-lg:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  label-numeric-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  label-numeric-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-badge:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
  touch-target-min: 2.75rem
  pos-sidebar-width: 16rem
  pos-cart-width: 24rem
  gutter-default: 1rem
---

## Brand & Style

This design system is engineered for high-velocity retail environments, complex inventory management, and mission-critical cashier terminals. The interface balances high data density with rapid visual scanning, eliminating cognitive friction during high-stress checkout workflows.

### Aesthetic Persona
- **Architectural & Technical:** Rooted in structured, crisp grids, deep navy foundational surfaces, and precision data visualization.
- **Engineered Velocity:** Interaction targets are optimized for both high-resolution mouse inputs and rapid capacitive touch screens, prioritizing immediate feedback and zero layout shift.
- **Operational Trust:** Every price, SKU, barcode, and stock status is rendered with structural clarity, projecting enterprise reliability and rigorous inventory control.

### Design Movement
The system implements **Modern Technical Corporate** infused with **Utility-First Density**:
- Crisp 1px structural framing to segment high-information panels (cart drawer, product catalog, barcode inputs).
- Monospaced tabular numerals for all financial figures, serials, and transaction receipts to ensure vertical alignment across data grids.
- Controlled use of hyper-focused semantic accents against deep navy slate frames to draw immediate focus to stock health and transaction totals.

## Colors

The color architecture is built around an authoritative deep navy structure paired with an energetic sapphire blue for primary operational actions. Semantic colors are strictly calibrated for instantaneous status recognition in fast-paced retail checkout lanes.

### System Palette
- **Primary (`#1D4ED8`):** Sapphire Blue. Used for core interactive states, primary action buttons ("Charge", "Pay Now", "Add to Cart"), active tabs, and primary selection outlines.
- **Secondary (`#0F172A`):** Deep Navy Slate. Serves as the high-contrast structural anchor for persistent navigation sidebars, cashier summary panels, and terminal headers.
- **Tertiary (`#0284C7`):** Electric Cyan Blue. Reserved for secondary system feedback, active search/filter tags, active scanner inputs, and interactive data telemetry.
- **Neutral (`#64748B`):** Slate Grey. Provides neutral mid-tones for borders, secondary labels, disabled states, and subtle row alternating fills (`#F8FAFC`, `#F1F5F9`, `#E2E8F0`).

### Semantic Stock & Operational Palette
- **Success / In Stock:** `#059669` (Emerald Green text/border) on `#ECFDF5` (tint fill).
- **Warning / Low Stock:** `#D97706` (Amber text/border) on `#FFFBEB` (tint fill).
- **Danger / Out of Stock / Void:** `#E11D48` (Rose Red text/border) on `#FFF1F2` (tint fill).
- **Terminal Keypad & System Chrome:** `#1E293B` for high-contrast numeric keypad keys and terminal drawer accents.

## Typography

The typographical hierarchy utilizes a dual-engine structure:
1. **Hanken Grotesk** handles the primary UI layer, navigation, dialogs, and product catalog naming. Its clean, contemporary grotesque construction ensures rapid readability at small scales without aesthetic distortion.
2. **JetBrains Mono** is enforced for all tabular numbers, currencies, totals, discounts, SKUs, serial numbers, UPC barcodes, and terminal transaction feeds. This guarantees uniform column alignment, avoiding jitter when figures recalculate dynamically in line items.

### Sizing and Hierarchy Directives
- **Financial Totals:** Grand totals in checkout drawers use `label-numeric-lg` for instant visibility from over-the-counter angles.
- **Data Table Cells:** Table cells containing financial data, stock quantities, and timestamps strictly utilize `label-numeric-sm`. Descriptive cell text utilizes `body-md` or `body-sm`.
- **SKU & Barcode Displays:** Displayed in uppercase tracking with `label-code` for fast optical scanning alongside physical equipment.

## Layout & Spacing

The system implements a **Desktop-First Fixed-Flex Split Grid** structured for standard POS touch displays (1080p, 1440p) and wide workstation screens.

### Spatial Grid Architecture
- **Navigation Rail / Sidebar:** Fixed width (`pos-sidebar-width`: 256px), collapsible to an icon-only mode (64px) for maximized screen real estate.
- **Transaction & Cart Dock:** Fixed width (`pos-cart-width`: 384px) pinned to the right edge during cashier POS mode, ensuring continuous visibility of running totals and quick-tender keys.
- **Active Workspace (Catalog / Tables / Dashboards):** Flex-grow layout occupying the remaining viewport with structural 16px (`gutter-default`) spacing between operational cards.

### Touch & Dense Workstation Paradigms
- **Touch Safe Targets:** In active cashier scanning mode, interactive keypads, modifier selectors, and product tiles maintain a minimum target height of `touch-target-min` (44px).
- **Data Density Modifiers:** In back-office inventory tables and reporting screens, spacing collapses to compact row padding (`space-xs` top/bottom, `space-md` left/right) to maximize visible data rows above the fold.

## Elevation & Depth

This system avoids heavy drop shadows to preserve operational clarity under bright retail point-of-sale lighting. Depth is articulated through **Tonal Layering** and **Precision Structural Borders**.

### Elevation Scale
- **Level 0 (Base Canvas):** Background tone (`#F8FAFC`). Pure utility surface.
- **Level 1 (Panels & Surfaces):** Pure white (`#FFFFFF`) framed with a crisp `1px solid #E2E8F0` border. Used for catalog cards, table containers, and filter toolbars.
- **Level 2 (Active Focus & Sticky Cart):** Pure white (`#FFFFFF`) with a subtle technical drop: `0px 2px 4px -1px rgba(15, 23, 42, 0.06), 0px 4px 6px -1px rgba(15, 23, 42, 0.08)`. Border shifts to `#CBD5E1`.
- **Level 3 (Modals, Tender Drawers, Keypad Overlays):** Surface `#FFFFFF` elevated with a distinct boundary shadow: `0px 10px 15px -3px rgba(15, 23, 42, 0.12), 0px 4px 6px -2px rgba(15, 23, 42, 0.04)`, framed with `1px solid #94A3B8`.
- **Level 4 (Persistent Navigation Sidebar):** Deep Navy Slate (`#0F172A`) base creating immediate structural separation without traditional shadow requirements.

## Shapes

The design system maintains a **Soft Architectural (`1`)** shape language. Sharp technical precision is tempered with 4px (`rounded-sm`) to 8px (`rounded-lg`) corner radii, preserving space efficiency within dense grids while avoiding industrial harshness.

### Radius Assignments
- **Input Fields, Table Rows, and Filter Chips:** 4px (`0.25rem`). Ensures optimal horizontal and vertical fit within dense data streams.
- **Buttons, Catalog Cards, and Keypad Buttons:** 6px to 8px (`0.375rem` to `0.5rem`). Provides ergonomic visual affordance for tap and click interactions.
- **Status Badges & Stock Indicators:** 4px (`0.25rem`) micro-radius or fully pill-shaped (only for binary boolean toggles) to differentiate them from actionable buttons.
- **Drawer Panels & Modal Dialogs:** 8px to 12px (`0.5rem` to `0.75rem`) for high-level container boundaries.

## Components

### Buttons
- **Primary (Tender/Pay):** Background `#1D4ED8`, text `#FFFFFF`, font `Hanken Grotesk` 600 weight. Hover: `#1E40AF`. Active: `#1E3A8A`. Height: 44px on POS checkout; 36px in data tables.
- **Secondary (Split Tender, Hold Cart):** Background `#FFFFFF`, border `1px solid #CBD5E1`, text `#0F172A`. Hover: `#F8FAFC` and border `#94A3B8`.
- **Danger (Void Item, Cancel Transaction):** Background `#FFF1F2`, text `#E11D48`, border `1px solid #FECDD3`. Hover: background `#FFE4E6`.
- **Keypad Buttons (Quick Cash, Numpad):** Background `#F1F5F9`, text `#0F172A`, font `JetBrains Mono` 600 weight, 1px border `#CBD5E1`.

### Stock Status Badges
- **General Construction:** Inline-flex, alignment center, padding `2px 6px`, radius 4px, uppercase tracking with `label-badge`.
- **In Stock:** `#ECFDF5` background, `#059669` text, `1px solid #A7F3D0`. Includes a 6px solid circular green dot indicator.
- **Low Stock:** `#FFFBEB` background, `#D97706` text, `1px solid #FDE68A`. Preceded by dynamic quantity remaining (e.g., `ONLY 2 LEFT`).
- **Out of Stock:** `#FFF1F2` background, `#E11D48` text, `1px solid #FECDD3`.

### Input Fields & Barcode Scanners
- **Barcode Scan Input:** Distinctive high-focus state. Border `2px solid #1D4ED8` with a continuous subtle pulse indicator when active for scanner input. Prefix contains a monospaced barcode icon; text rendered in `JetBrains Mono`.
- **Standard Text & Numeric Inputs:** Border `1px solid #CBD5E1`, background `#FFFFFF`, text `#0F172A`, focus ring `2px solid #93C5FD` with zero blur offset.

### Product Catalog Cards (POS Grid)
- Background `#FFFFFF`, border `1px solid #E2E8F0`, padding 12px.
- Thumbnail: 1:1 aspect ratio with subtle `#F8FAFC` background fill.
- Bottom details: Product name in `body-sm` (truncated at 2 lines), followed by SKU in `label-code` (`#64748B`), and price in `label-numeric-md` (`#0F172A`).
- Top-right corner anchors the Stock Status Badge.

### Data Tables (Inventory & Reports)
- **Header:** Background `#F8FAFC`, border-bottom `2px solid #CBD5E1`, text `#475569`, font `Hanken Grotesk` 600 weight, uppercase 11px.
- **Rows:** Height 40px (dense) or 48px (standard). Alternate row striping `#F8FAFC` optional. Hover state: `#F1F5F9`.
- **Alignment Rules:** Text aligns left, status badges align center, financial values and stock counts align strictly right with monospaced tabular numerals.

### Transaction Line Items (Cart Drawer)
- Compact row architecture: Product name, unit price, quantity stepper `[- 1 +]`, total price.
- Quantity buttons maintain a minimum 32px touch target with tactile border feedback.
- Monospaced numeric breakdown shows SKU and tax breakdown directly under the line item.