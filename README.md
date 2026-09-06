# Electronics/Gadgets Store POS System
 
A web-based Point of Sale system for an electronics/gadgets retail store, developed for CSC4630 using the **Unified Process (UP)** — iterative, incremental, use-case driven, risk-driven, and architecture-centric. This file is the single entry point for the project: what it is, where things stand, how the documentation is organized, and the rules that govern how it gets built.
 
> **Reference texts:** Craig Larman, *Applying UML and Patterns: An Introduction to Object-Oriented Analysis and Design and Iterative Development* (3rd Ed.) — the course's assigned reference and the source of the POS case study this design follows; and `csc4630 Software projects_Marking_Guide1.pdf`, the grading rubric this project is built against.
 
## 1. Problem & Solution
 
Electronics retail businesses commonly struggle with inaccurate inventory tracking, slow checkout, poor reporting/sales analysis, and no centralized sales record. This system automates sales processing, inventory updates, report generation, and user management to address those problems. Full detail: `business_case.md`.
 
## 2. Methodology & Current Status
 
| Weeks | UP Phase | Milestone | Status |
|---|---|---|---|
| 1–2 | Inception | Vision & Feasibility | ✅ Complete |
| 3–5 | Elaboration (Iteration 1) | Core Architecture & Requirements | ✅ Complete |
| 6–8 | Elaboration (Iteration 2) | Risk-Driven Design | ✅ Complete |
| 9–12 | Construction (Iterations 3–4) | Feature Implementation | ⏳ Not started |
| 13–14 | Transition (Iteration 5) | Polishing & Deployment Prep | ⏳ Not started |
| 15 | Transition | Demo & Final Submission | ⏳ Not started |
 
Full detail and per-iteration deliverables: `iteration_plan.md`.
 
This is currently a **solo effort** (originally a group submission — "Group 22"). Do not assume any deliverable is being produced by anyone else.
 
## 3. Documentation Index
 
| Document | Phase | What it contains |
|---|---|---|
| `business_case.md` | Inception | Problem statement, proposed solution, benefits, business value, cost considerations |
| `high_level_requirements.md` | Inception | Functional & non-functional requirements (FR1–FR15, NFR1–NFR6) |
| `use_cases.md` | Inception | The 8 high-level use cases, with traceability to the detailed use cases below |
| `risk_list.md` | Inception → Iter. 1 → Iter. 2 | Risk register with likelihood/impact, mitigation strategy, and mitigation progress; feasibility analysis |
| `iteration_plan.md` | All | UP phase/week breakdown, objectives and deliverables per iteration, status |
| `layered_architecture.md` | Elaboration Iter. 1 | The architectural proof-of-concept: 4-layer architecture, tech stack, rationale |
| `domain_model.md` | Elaboration Iter. 1 | Conceptual class diagram write-up (companion to `Untitled Diagram.drawio.png`) |
| `detailed_use_cases_iteration1.md` | Elaboration Iter. 1 | 9 detailed use cases with System Sequence Diagrams (the "30%") |
| `detailed_use_cases_iteration2.md` | Elaboration Iter. 2 | Remaining 9 detailed use cases with SSDs (the "70%") |
| `design_class_diagram.md` | Elaboration Iter. 2 | Domain classes with methods + Controller classes, GRASP patterns applied |
| `ui_prototype.md` + `ui_prototype.html` | Elaboration Iter. 2 | Screen descriptions and a clickable static prototype (Login, Sales/Checkout, Inventory, Reports). **Superseded as the active design reference** — kept only as the historical Iteration 2 deliverable record. See Section 10 for the current reference. |
| `precision_retail_core.md` | Elaboration Iter. 2 | **The design system spec — the canonical source for colors, typography, spacing, elevation, and component styling.** Generated alongside the Stitch screens; use this (not a screen's embedded `tailwind.config`) as the reference when wiring up `tailwind.config.js`. |
| `dashboard_code.html` / `_screen.png`, `point_of_sale_terminal_code.html` / `_screen.png`, `inventory_stock_management_code.html` / `_screen.png`, `project_management_catalog_code.html` / `_screen.png`, `gadgetpos_logo_code.html` / `_screen.png`, `staff_headshot.png` | Elaboration Iter. 2 (supersedes `ui_prototype.html`) | The actual visual/interaction reference for implementation — real Tailwind markup (the `_code.html` files) plus a preview image (`_screen.png`) for each. **Only 4 of the screens originally requested from Stitch actually exist** (Dashboard, POS Terminal, Product/Catalog Management, Inventory) — Login, Search Product, Sales/Transactions history, Transaction Details, Reports & Analytics, User Management, Settings, Add/Edit Product/User, and the Receipt confirmation screen still need to be generated or designed separately. **Cleanup still needed:** the old, ambiguously-named duplicates (5× `code.html`, 6× `screen.png`) are still sitting in the project alongside these renamed copies — delete them in the project's file view so there's only one copy of each screen. |
| `Group 22 POS Presentation.pptx` | Inception | Original stakeholder presentation |
| `Compiled Use Cases and Requirements.pdf` | Elaboration source | Superset use-case/requirement list used to build the detailed use cases above |
| `Layered Architecture.drawio.png` / `.drawio 1.pdf` | Elaboration Iter. 1 | Source architecture diagram that `layered_architecture.md` documents |
| `Untitled Diagram.drawio.png` | Elaboration Iter. 1 | Source conceptual class diagram that `domain_model.md` documents |
| `csc4630 Software projects_Marking_Guide1.pdf` | Reference | Grading rubric — what every phase must deliver and how it's marked |
| `applying_uml_and_patterns_...pdf` | Reference | Larman's textbook — the POS case study this design follows |
 
**Not yet created** (belongs to Construction/Transition, per Section 9 below): source code, test suite, defect log, beta testing report, user manual, final report.
 
## 4. Technology Stack
 
**Frontend**
- **React** (single-page app) on **Vite** — Create React App is unmaintained at this point; Vite is the current standard build tool (fast dev server, fast builds).
- **Tailwind CSS** for styling — **not** Ant Design as originally suggested; revised once the actual Google Stitch UI export was inspected (see Section 10). Stitch generated real implementation-ready markup, not just a visual mockup: Tailwind utility classes, a custom Material-Design-3-style color/typography token config, and Google Material Symbols for icons. Converting that directly into React components (Stitch's HTML → JSX, keeping the same Tailwind classes) is a much smaller lift than discarding it and rebuilding every screen in Ant Design's component API. Build `tailwind.config.js` from **`precision_retail_core.md`** (the actual design-system spec — colors, typography, spacing, elevation, component rules) rather than from a single screen's embedded config, since it's the complete, documented source the screens were generated from.
- **TanStack Query (React Query)** + **Axios** for talking to the backend. Handles loading/error/empty states (see Section 10's required UI states) with far less boilerplate than hand-rolling it or reaching for Redux.
**Backend**
- **FastAPI.** Its request/response models (Pydantic) map almost directly onto the classes already defined in `domain_model.md` / `design_class_diagram.md`, so the implementation stays traceable back to the design docs. It also generates interactive OpenAPI/Swagger docs for free — a ready-made artifact for the Week 15 live demo.
- **SQLModel** (built by FastAPI's author; combines Pydantic + SQLAlchemy) as the ORM — one model definition serves as both the API schema and the database table instead of maintaining two.
- **SQLite** for development and the coursework demo (zero setup, file-based). The connection string can be swapped for **PostgreSQL** later if this ever needs to run for real (supports NFR5 — scalability).
- **JWT** for authentication (`python-jose`) with `passlib`/`bcrypt` for password hashing — implements the Authentication Service inside Technical Services.
**Style:** Layered monolith — one deployable backend, internally organized into strict layers (see below), talking to the React UI only over HTTP/REST.
 
## 5. Architecture Summary
 
Four layers (see `layered_architecture.md` for full detail — component lists, and why each exists):
 
1. **UI Layer** — the React app (Sales Interface, Product Management, Inventory Management, Reporting Dashboard).
2. **Domain Layer** — business logic and rules (Sale, Product, Inventory, controllers, pricing/reporting/search services, the Payment abstraction).
3. **Business Infrastructure** — general-purpose services not specific to POS (CurrencyConverter, and the external APIs: payment gateway, SMS, email — see Section 6).
4. **Technical Services** — cross-cutting infrastructure: persistence (all data storage lives here), authentication, security, logging, notification.
**Do not put business logic inside UI components.** The React app talks to the Domain layer's controllers through the REST API only — it never touches persistence or external APIs directly.
 
**Code organization for Technical Services:** this layer bundles several unrelated concerns (persistence, auth, logging, notifications), so implement it as its own package with one subfolder per concern rather than one flat module — e.g. `technical_services/persistence/`, `technical_services/auth/`, `technical_services/logging/`, `technical_services/notifications/`. Grouping them under one layer at the architecture-diagram level doesn't require grouping them into one file at the code level; the subfolders keep both honest.
 
## 6. External API Integrations (Business Infrastructure Layer)
 
These sit behind the Business Infrastructure layer's `External APIs` box in `layered_architecture.md`, and behind the `iCreditAuthorizationService` interface for payments specifically — so the Domain layer never depends on a specific provider directly, and swapping a provider later is a config change, not a redesign.
 
- **Payment gateway — Flutterwave.** [Holds a payment system licence for Zambia](https://flutterwave.com/ng/blog/zambia-here-we-come-flutterwave-receives-license-to-power-payments-for-zambian-businesses) and supports both card and mobile money payments. Test mode is **free with no verification/KYC required** — every new account starts in test mode automatically, and test transactions never touch real funds — so it costs nothing for this project. Live production fees only apply if this ever goes live (card transactions are charged a percentage per transaction; check the dashboard's Zambia pricing before that point).
- **SMS — Africa's Talking.** Operates in Zambia (dedicated `zambia.africastalking.com` portal, with Zambia shortcode/USSD support) with a straightforward Python SDK. The **sandbox is completely free** — 2-way SMS, USSD, payments, and virtual numbers can all be prototyped for free in their simulator with no signup cost. Live/production SMS in Zambia is billed per message (roughly ZMW 0.06–0.10/SMS depending on volume) — irrelevant for the coursework build, only a consideration if this is ever deployed for a real store.
- **Email — Mailgun (not SendGrid).** Mailgun has a genuine free tier — **100 emails/day, no expiry** — which is enough for receipts/report emails on a project like this. SendGrid used to offer the same thing but no longer does: its free tier is now a 60-day trial only, after which it requires a paid plan (~$19.95/month), so it's a worse fit here despite showing up in a lot of older tutorials.
For the internal API (React ↔ FastAPI), lean on what FastAPI already provides for free: it generates an OpenAPI schema automatically, and a tool such as `openapi-typescript-codegen` or `orval` can turn that into a typed TypeScript client for the React app. That keeps frontend types and backend Pydantic/SQLModel models in sync automatically, instead of hand-writing (and letting drift) API types on the frontend.
 
**Scope note:** implement all three external integrations against their sandbox/test credentials. Going live with real payment processing would require Flutterwave merchant verification (KYC) that's outside this project's timeline — the interface-based design just means that becomes a later config change, not a rewrite.
 
## 7. Roles & Permissions
 
| Role | Responsibilities |
|---|---|
| **Administrator** | Manage employee accounts (create/edit/enable/disable), assign roles, view system-wide reports |
| **Manager** | Manage products and inventory, monitor stock levels (including low-stock), view sales reports and performance |
| **Cashier** | Process sales, search products, manage the current cart, process payments, complete transactions, generate/print receipts |
 
Role restrictions must be enforced by the backend, never by hiding navigation items in the UI alone.
 
## 8. Highest-Priority Workflow: Process Sale
 
**Process Sale / POS Checkout is the most important screen in the system** and should receive the greatest attention during implementation. The cashier must be able to: search products (name/category/barcode) → view price and stock → add to cart → adjust quantity / remove items → calculate totals (incl. discount and tax) → select payment method → enter payment amount → calculate change → complete the sale → update inventory → generate/print a receipt.
 
```
Search/Select Product → Add to Cart → Adjust Quantity → Calculate Total
   → Payment → Validate Payment → Complete Sale → Update Inventory → Receipt
```
 
This maps directly to the **Process Sale, Search Product, View Product Details, Modify Transaction, Apply Discount, Apply Tax, Generate Receipt** use cases in `detailed_use_cases_iteration1.md`.
 
## 9. Feature Priority & Construction Increments
 
Build in this order — do not spend disproportionate time on lower-priority items while Process Sale is incomplete:
 
1. Process Sale / POS
2. Product Search
3. Product & Inventory Management
4. Sales / Transaction History
5. Reports & Analytics
6. User Management
7. Settings and secondary functions
Within Construction (Weeks 9–12), split into four increments:
 
- **Increment 1 — Core POS:** login, product search, cart, calculations, payment, completed sale, inventory update, receipt.
- **Increment 2 — Products & Inventory:** product creation/editing, product status, stock monitoring, low-stock handling.
- **Increment 3 — Sales & Reporting:** transaction history, transaction details, reports, analytics, inventory reports, export.
- **Increment 4 — Administration:** user creation/editing, role assignment, account activation/deactivation.
Refine these as risks and requirements become clearer during Construction.
 
## 10. UI/UX Guidelines
 
### Primary UI reference: Google Stitch
 
The active visual/interaction reference for implementation is the **Google Stitch export**, not `ui_prototype.html` (which is kept only as the historical record of the Elaboration Iteration 2 deliverable). Stitch was prompted to generate a full implementation-ready screen set covering: Login, Dashboard (role-aware for Admin/Manager vs. Cashier), Point of Sale/Checkout, Search Product, Manage Products (+ Add/Edit Product), Manage Inventory, Sales/Transactions history (+ Transaction Details), Reports & Analytics, Manage Users (+ Add/Edit User), Settings, and the Successful Sale/Receipt confirmation — matching the workflows in Sections 7–9 above, not one screen per FR.
 
Each exported screen produced a `_code.html` (real implementation markup: Tailwind CSS utility classes, Google Material Symbols icons) plus a `_screen.png` preview. The full design-system rationale behind the colors/type/spacing used across all of them lives in `precision_retail_core.md`, not in the individual HTML files.
 
**Naming — resolved, but cleanup still needed.** The screens were re-uploaded with descriptive names (`dashboard_code.html`, `point_of_sale_terminal_code.html`, `inventory_stock_management_code.html`, `project_management_catalog_code.html`, `gadgetpos_logo_code.html`, plus matching `_screen.png` files and `staff_headshot.png`) and can now be told apart and referenced individually. However, the original ambiguous uploads (5× `code.html`, 6× `screen.png`) are still present in the project alongside them — delete those old copies so the file list doesn't carry two versions of the same screen, one nameable and one not. (One naming note: `project_management_catalog_code.html` looks like it should be `product_management_catalog` to match the original folder name — worth a quick rename for consistency, not urgent.)
 
**Coverage gap.** Only four real screens came out of the Stitch export — Dashboard, Point of Sale Terminal, Product/Catalog Management (with its Add/Edit modal), and Inventory & Stock Management — plus the logo and a staff headshot image, which are assets, not screens. The other screens from the original Stitch prompt (Login, Search Product as its own view, Sales/Transactions history, Transaction Details, Reports & Analytics, User Management, Settings, Add/Edit User, and the Successful Sale/Receipt confirmation) don't exist yet as Stitch output. Those will need their own Stitch generation pass (or a from-scratch build following `precision_retail_core.md`'s tokens) before Construction reaches the increments that need them.
 
### General rules
 
- **Design screens around use cases and workflows, not one screen per functional requirement.** Group related FRs into one coherent workflow (e.g. all user-management FRs → one User Management area; all reporting FRs → one Reports area).
- Desktop-first, responsive enough for later tablet/mobile adaptation.
- Professional electronics/gadget retail aesthetic; consistent sidebar, header, typography, spacing, buttons, forms, tables, cards, dialogs.
- Usability over decoration — avoid excessive gradients/animation/futuristic styling.
- Use realistic product and transaction data.
- Design for **every** state, not just the happy path: loading, empty data, success, validation errors, invalid login, insufficient/low/out-of-stock, failed transaction, successful payment, confirmation-before-destructive-action, disabled account.
- Any AI/tool-generated UI (Stitch included) is a **starting point, not the source of truth**. If a generated design conflicts with an approved requirement, use case, business rule, security requirement, or the architecture — change the UI, not the requirement. Reuse generated components where practical; simplify or redesign them when implementation needs it.
## 11. Business Rules
 
- A completed sale must contain at least one product.
- Product quantities must be valid; normal sales must not make stock negative.
- Inventory updates must occur when a sale successfully completes.
- Completed sales retain an auditable record.
- User roles must be validated; protected functions require authentication and authorization.
- Transaction totals must be calculated consistently (see `Sale.calculateTotal()` in `design_class_diagram.md`).
- Failed transactions must not leave inconsistent/partially updated data.
## 12. Security
 
Authenticate all protected actions; enforce role-based authorization server-side (never rely on frontend restrictions alone); validate all input; hash/protect passwords; never expose sensitive information; log important system actions.
 
## 13. Reporting
 
Should support: daily/weekly/monthly sales, transaction counts, sales trends, top-selling products, category performance, current stock, low-stock/out-of-stock products, inventory value — with date-range filters, charts/tables, and export.
 
## 14. Testing Priorities
 
Give special attention to the Process Sale workflow: valid sale, multiple products, quantity changes, product removal, insufficient stock, invalid payment, correct change calculation, inventory update, receipt generation. Also test authentication/authorization, inventory operations, and report calculations.
 
## 15. Definition of Done
 
A feature is not done just because its screen exists. It needs: working UI interactions, correct business logic, validation, error handling, correct data storage/retrieval, required authorization, tests, and a demonstrable use case.
 
## 16. The Guiding Question
 
> Does this feature help a real electronics/gadget store complete and manage sales effectively?
 
If not, it's lower priority than improving the core Process Sale workflow.