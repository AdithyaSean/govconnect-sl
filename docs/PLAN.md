<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Execution Plan (Rapid Prototype + Agentic Browser Automation)

## 1. Current Baseline & Target Adjustments

The repository already includes:
* Next.js App Router + TypeScript UI
* Firebase Auth + Firestore (implicit via `firebase.ts`)
* Genkit AI flows: chat, suggest services, summarize service info
* Core domain collections: users, applications, payments, notifications, supportTickets, vehicles, fines

Still missing / to mature:
* Formal service catalog metadata & dynamic form schema strategy
* Structured audit / agent run logging
* Human-in-the-loop (HITL) pause / resume checkpoints for AI & automation
* Internationalization (Sinhala / Tamil) for UI & prompts
* Role-based access (admin / worker segregation enforcement in middleware)
* Security hardening (Firestore rules expansion, PII encryption at rest client-side before write if needed)
* Synthetic monitoring & drift detection for external government sites

## 2. Rapid Prototype Scope (Week 1–2)
Objective: Demonstrate end-to-end DOCUMENTED (not fully implemented) flow:
User fills dynamic (schema-described) passport renewal form -> application record planned -> agentRun plan created -> browser-use automation prompt prepared -> hypothetical external submission -> audit + potential HITL checkpoint -> payment plan -> notification.
Focus on architecture docs, schemas, and sequence alignment; minimal code stubs only if essential for clarity.

Out-of-Scope for Prototype: Production-grade automation execution, full Firestore rules enforcement, complete i18n implementation, PDF generation runtime, robust external site scraping.

Artifacts to Produce (see TASKS.md assignments):
1. Service schema spec & sample (User A)
2. Browser-use integration plan + prompt spec (User B)
3. Prompt registry & guardrails design (User C)
4. Security & Firestore rules draft (User D)
5. HITL checkpoints & audit taxonomy (User E)

Success Criteria for Prototype Phase:
* All five docs completed, cross-linked to PLAN sections.
* Updated UML reflects agentRuns, promptTemplates, HITL checkpoints, browser-use orchestration.
* Single canonical prompt JSON example for automation captured.
* Risks & mitigations enumerated; at least 3 guardrails defined.

Validation Method: Internal review checklist (in TASKS.md) + UML diagram consistency.

2.1 Service Catalog & Dynamic Forms (Documentation First)
* Define schema spec – no runtime form yet.
* Provide example passport renewal schema stub.
* Document mapping strategy (schema -> application.details).

2.2 Audit & Agent Observability (Design / Spec Only)
* Specify collection schemas & example documents.
* Define minimal event taxonomy (expanded in section 5 / User E doc).

2.3 HITL Checkpoints (Lifecycle Definition)
* Document states & resolution triggers.
* Provide one example (captcha challenge).

2.4 Payments Alignment (Planned Flow)
* Define status transition diagram & receipt JSON shape.

2.5 Firestore Security Rules (Draft Only)
* Provide role matrix & sample rule snippets.

## 3. Post-Prototype Roadmap (Sprint 2–4)

3.1 AI Flow Hardening
* Introduce system prompt registry with versioning (collection: promptTemplates { key, version, template, locale }).
* Add caching layer for deterministic summarizations (hash(input) -> summary stored).
* Introduce guardrails (max input length trimming, JSON schema validation of LLM outputs where structured).

3.2 Internationalization (i18n)
* Adopt next-intl or similar; externalize UI text.
* Provide localized system / user prompts for Sinhala & Tamil with fallback.
* Add user profile preferredLocale field.

3.3 Automated Form PDF Generation
* For submissionMode=pdf services: generate filled PDF via server action using a template (PDF form fill library) -> store in storage -> create application record referencing stored file.

3.4 External Site Automation (Future Hook)
* Abstract automation adapter interface (browserless / playwright cluster) to prepare for headless submissions.
* Store automation job results linked to application (application.automationStatus, lastAttemptAt, attempts[]).

3.5 Monitoring & Telemetry
* Add lightweight usage metrics collection (cloud function or edge logger) aggregating counts per service.
* Synthetic job: daily ping each service URL (if external) storing uptime / drift hash of DOM snippet.

## 4. Pilot & Feedback (Post Sprint 4)
* Select 3–5 services for end-to-end pilot (mix of payment, pdf-only, info summarization).
* Instrument funnels: applicationStarted -> paymentCompleted -> applicationCompleted.
* Track manual HITL interventions per flow.
* Conduct accessibility review (WCAG AA color contrast & keyboard nav).

## 5. Data Model Additions
New collections / fields (aligned with ER diagram update):
* agentRuns
* checkpoints (separate collection for HITL checkpoints; previously implicit — now explicit to match hitl-checkpoints.md)
* auditLogs
* promptTemplates (future may add metadata: { maxTokens, outputSchemaKey })
* (optional) automationJobs (if separated from agentRuns for browser tasks)
* applications: add timeline[] (array of { at, event, meta }) for quick UI rendering.
* users: preferredLocale, roles[] (multi-role for future granularity).

Consistency Note: ER diagram update pending to add Checkpoint table & relationships (AgentRun 1..* Checkpoint, Application 1..* Checkpoint). PromptTemplate metadata intentionally deferred; will be integrated when guardrails are enforced (PLAN §3.1).

## 6. Security & Compliance
* Expand Firestore rules with role claim injection (custom claims) & field-level validation (e.g., status transitions whitelist).
* Encrypt sensitive PII fields client-side (NIC snapshots) if regulatory review requires (Web Crypto AES-GCM; store IV + ciphertext).
* Implement consent logging: auditLogs entries when user agrees to data processing or locale switch affecting prompt context.

## 7. Performance & Cost Controls
* Token accounting per agentRun; compute approximate cost and show in admin analytics.
* Cache idempotent AI outputs (summaries, suggestions) keyed by stable hash to reduce LLM calls.
* Lazy-load heavy components (chat interface, large forms) via dynamic imports.

## 8. Developer Experience
* Add ESLint + strict TypeScript config for domain types.
* Add lightweight unit tests for Genkit flow wrappers & util functions.
* Storybook (optional) for dynamic form field components & HITL checkpoint UI.

## 9. Definition of Done (Per Feature)
* Firestore rules updated
* Audit logs present for key actions
* Tests (unit or integration) for core logic
* LLM prompts versioned & documented
* Accessibility check completed
* Monitoring metric emitted

## 10. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Unstable external gov sites | Form submission failures | Synthetic DOM drift checks & rapid config override |
| LLM hallucination | Incorrect service guidance | Guardrails + retrieval of canonical service metadata |
| Data leakage | Compliance breach | Field-level encryption + minimized retention |
| Cost overrun (LLM) | Budget impact | Caching & token budgeting per flow |
| Role escalation | Unauthorized access | Enforced custom claims + rule-based RBAC |

## 11. High-Level Timeline (Rolling)
Week 1–2 (Prototype): Docs + UML updates + schema stubs
Week 3–4: Implement dynamic form + audit/agentRuns + baseline rules
Week 5–6: Prompt registry persistence + caching + i18n scaffolding
Week 7–8: External automation adapter prototype (browser-use) + accessibility + pilot readiness

## 12. Success Metrics
* < 2 min average time from form submit to stored application record
* ≥ 85% AI suggestions accepted or interacted with (pilot set)
* < 5% manual HITL interventions after week 6 for supported flows
* 0 critical security rule violations in staged tests
* ≥ 50% cache hit rate for summarization prompts after week 8

---

This execution-focused plan pivots to a documentation-first rapid prototype emphasizing clarity of agentic browser automation workflow before deep implementation, aligning Next.js + Firebase + Genkit with future browser-use orchestration.


***

