# Risk List, Feasibility Analysis &amp; Mitigation Plan

*Originally an Inception deliverable; updated during Elaboration Iteration 1 (mitigation strategies added) and Iteration 2 (progress status added)*

## Risk Register

| ID | Category | Risk | Likelihood | Impact | Mitigation Strategy | Status (Iteration 2) |
|----|----------|------|-----------|--------|---------------------------------|----------------------|
| R1 | Technical | Lack of experience with POS system architecture. | Medium | High | Base the design on an established reference architecture (Larman's POS case study, layered design) rather than designing from scratch; allocate research time in early Elaboration. | **Mitigated** — layered architecture (UI / Domain / Business Infrastructure / Technical Services) modeled on the reference case study, completed in Iteration 1. |
| R2 | Technical | Integration challenges between modules (sales, inventory, reporting). | Medium | Medium | Define clear layer boundaries and a single interface contract (REST API) between the UI and backend before any coding starts. | **In Progress** — layer boundaries and interfaces defined in the architecture; end-to-end integration testing is scheduled for Construction. |
| R3 | Technical | Data security vulnerabilities. | Medium | High | Hash/encrypt stored passwords, enforce role-based access control (NFR2), require HTTPS for all API calls, validate all input server-side. | **Planned** — addressed in design via the Authentication/Authorization Controller; implementation happens in Construction. |
| R4 | Technical | Incorrect scanning of a product/gadget barcode. | Medium | Medium | Provide a manual product-code/name search as a fallback to barcode scanning; validate scanned codes against the product database before adding an item to a sale. | **Mitigated in design** — the Search Product and View Product Details use cases provide the manual fallback path. |
| R5 | Business | System may not meet stakeholder expectations. | Low | High | Validate use cases and the UI prototype against the business case and marking guide at the end of every iteration. | **In Progress** — use cases and a UI prototype were produced this iteration specifically for that review. |
| R6 | Business | Budget or infrastructure limitations. | Low | Medium | Use free/open-source tooling throughout (Python backend, React UI, free-tier hosting) instead of paid infrastructure. | **Mitigated** — technology stack confirmed as free/open-source; no paid infrastructure required to complete the coursework. |

## Feasibility Analysis

### Technical Feasibility
The project is technically feasible using modern, freely available programming frameworks and databases (Python backend, React front end, a relational or lightweight database).

### Economic Feasibility
Development costs are manageable within the academic project scope; no paid infrastructure is required to complete and demonstrate the system.

### Operational Feasibility
Store staff can be trained easily due to the system's user-friendly design — reinforced by NFR3 and validated by the UI prototype built in Elaboration Iteration 2.