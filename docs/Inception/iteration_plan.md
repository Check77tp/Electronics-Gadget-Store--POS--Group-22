# Iteration Plan (Unified Process)


| Weeks | UP Phase | Milestone | Status |
|-------|----------|-----------|--------|
| 1–2 | Inception | Vision & Feasibility | Complete |
| 3–5 | Elaboration (Iteration 1) | Core Architecture & Requirements | Complete |
| 6–8 | Elaboration (Iteration 2) | Risk-Driven Design |  Complete |
| 9–12 | Construction (Iterations 3–4) | Feature Implementation | Complete |
| 13–14 | Transition (Iteration 5) | Polishing & Deployment Prep | Complete |
| 15 | Transition | Demo & Final Submission |  Not started |

## Iteration 1 — Inception (Weeks 1–2) 

### Objectives
- Define project scope
- Identify stakeholders
- Develop high-level requirements
- Identify major risks
- Prepare initial project documentation

### Deliverables
- Business case
- High-level requirements
- Use case list (8 high-level use cases)
- Risk list
- Iteration plan

## Iteration 2 — Elaboration, Part 1 (Weeks 3–5) 

### Objectives
- Detail ~30% of use cases (key/high-risk scenarios), with system sequence diagrams
- Build the domain model (conceptual class diagram)
- Produce an architectural proof-of-concept (layered design)
- Update the risk list with mitigation strategies

### Deliverables
- `detailed_use_cases_iteration1.md` — 9 detailed use cases with SSDs
- `domain_model.md` — conceptual class diagram write-up
- `layered_architecture.md` — reconciled layered architecture (UI / Domain / Business Infrastructure / Technical Services)
- `risk_list.md` — updated with likelihood/impact/mitigation

## Iteration 3 — Elaboration, Part 2 (Weeks 6–8) 

### Objectives
- Detail the remaining ~70% of use cases, with system sequence diagrams
- Refine the domain model into a design class diagram (with methods)
- Build a UI prototype
- Track risk mitigation progress

### Deliverables
- `detailed_use_cases_iteration2.md` — remaining 9 detailed use cases with SSDs
- `design_class_diagram.md` — design classes with methods (GRASP patterns applied)
- `ui_prototype.md` + HTML mockup — Login, Sales/Checkout, Inventory, Reporting screens
- `risk_list.md` — mitigation progress/status column added

## Iteration 4 — Construction (Weeks 9–12) 

### Objectives
- Implement prioritized features per the design: sales processing, inventory management, reporting
- Write unit and integration tests
- Set up version control / continuous integration
- Track defects

### Planned Deliverables
- Working code for the layered architecture (Python backend behind a REST API, React front end)
- Unit + integration test suite
- Git repository with commit history
- Defect tracking log

## Iteration 5 — Transition (Weeks 13–14) 

### Objectives
- Beta test with representative users/scenarios and collect feedback
- Performance and security tuning
- Finalize documentation (updated models, user manual)

### Planned Deliverables
- Beta testing report
- Performance/security fix log
- User manual + final updated models

## Final Submission (Week 15) Not started

### Planned Deliverables
- Live demo of key scenarios
- Final report (UP process reflection, lessons learned)
- Complete code & documentation repository