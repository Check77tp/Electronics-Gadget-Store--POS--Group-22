# Layered Architecture — Electronics/Gadgets POS System

*Elaboration Iteration 1 deliverable: architectural proof-of-concept.*

## Technology Stack

- **UI:** React (single-page app)
- **Backend:** Python, exposed to the UI as a REST API
- **Style:** one deployable backend, internally organized into strict layers, communicating with the React UI over HTTP/REST

## Layer 1: UI Layer

**Purpose:** Handles all user interaction — collects input and displays output. Implemented as a React single-page application that talks to the backend only through the REST API (it does not call the Domain layer directly).

**Components:**
- Sales Interface (checkout/POS screen)
- Product Management Interface
- Inventory Management Interface
- Reporting Dashboard

## Layer 2: Domain Layer

**Purpose:** Contains the core business logic and business rules. Receives requests from the UI layer (via controllers) and coordinates the objects from the domain model (see `domain_model.md`) to fulfill them.

**Components:**
- Sale, Product, Product Type, Inventory, Receipt, Tax — domain concepts with behavior (see `design_class_diagram.md` for their methods)
- Authorization Controller — GRASP Controller for login/permission checks
- Price Calculation Service
- Product Search and Filtering Service
- Reporting and Analytics Module
- User Management Module
- POS Rule Engine — business rules (e.g. discount eligibility, tax rates, low-stock thresholds)
- Payment — with **bank payment** and **credit payment** variants behind an `<<interface>> iCreditAuthorizationService`, so a new payment method can be added without changing the Sale logic that uses it

## Layer 3: Business Infrastructure

**Purpose:** General-purpose, low-level business services that are not specific to POS/retail and could be reused across many business domains (Larman's "Business Infrastructure" layer). This layer isolates the Domain layer from the details of third-party integrations.

**Components:**
- CurrencyConverter
- External APIs: PaymentGatewayAPI, SMSServiceAPI, EmailAPI (these back FR7 — communication with external systems for online payment and notifications)

## Layer 4: Technical Services

**Purpose:** Cross-cutting infrastructure services used by every other layer.

**Components:**
- Persistence (database access — this is where all data storage responsibilities live)
- Authentication Service
- Security
- Logging
- Notification

## Why a Layered Architecture

- **Separation of concerns:** UI changes (e.g. redesigning the checkout screen) don't touch business rules; business rule changes don't touch persistence.
- **Testability:** the Domain layer can be unit-tested without a UI or a real database.
- **Matches the reference case study:** this mirrors the layered architecture used in Larman's POS case study, directly addressing risk R1 (lack of team experience with POS architecture) from the risk list.
- **Supports NFR6 (online/offline operation):** because Persistence and the External APIs are isolated behind their own layers, the Domain layer can be designed to queue sales locally and sync to the External APIs layer when connectivity returns, without changing sales-processing logic.