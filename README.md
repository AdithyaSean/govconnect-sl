# GovConnect SL – Rapid Prototype

Purpose: Unified portal for Sri Lanka government service interactions (applications, payments, support, AI assistance) using Next.js App Router, Firebase Auth/Firestore, and Genkit AI flows.

Current Focus: Documentation-first rapid prototype introducing agentic browser automation (browser-use), dynamic service schemas, audit & observability, and HITL checkpoints.

Key Domains:
* Applications (schema-driven forms)
* Payments (status transitions + receipt plan)
* AI Flows (chat, suggest services, summarize service info)
* Notifications & Support Tickets
* Agent Runs (planned) & Audit Logs

Important Docs:
* PLAN: docs/PLAN.md
* Tasks (assigned workstreams): docs/TASKS.md
* UML ER & Sequence Diagrams: docs/er-diagrams / docs/sequence-diagrams

Getting Started (Dev Skeleton):
1. Install deps: npm install
2. Create .env.local with Firebase config & any API keys (LLM, etc.).
3. Run dev server: npm run dev

No production automation implemented yet—prototype phase emphasizes design clarity before coding deep integrations.

Next Steps After Prototype:
* Implement dynamic form renderer
* Persist agentRuns & auditLogs
* Introduce promptTemplates collection & versioning
* Add Firestore security rules refinements

License: TBD
