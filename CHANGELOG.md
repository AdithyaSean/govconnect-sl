<!--
CHANGELOG.md
Purpose: Track notable changes to documentation, data model diagrams, and implementation stubs during the prototype & early sprints.
Format: Keep chronological (most recent first). Use semantic grouping (Docs, Diagrams, Data Model, Code Stubs). Avoid listing trivial typo fixes.
Versioning Strategy (Prototype Phase): Date-based entries with optional tags (Prototype, Sprint-1, etc.). Formal semantic versioning can begin once a deployable MVP baseline is established.
-->

# Changelog

## [Unreleased]
Planned:
- Initial Sprint 1 implementations (dynamic form stub, prompt registry accessor, automation prompt builder, validators, checkpoint admin UI) per `docs/TASKS.md`.
- Add PromptTemplate metadata field & guardrail enforcement logic (PLAN §3.1).
- Pin exact commit SHA for `browser-use` integration plan (PLAN §3.4).

## 2025-08-13 – Documentation Consistency Alignment (Prototype)
Category | Change
-------- | ------
Docs (PLAN) | Added explicit `checkpoints` collection to Data Model Additions; clarified pending ER diagram updates.
Docs (HITL) | Added `CompleteApplication` note as synonym; clarified preference for `AutomationComplete`.
Docs (Browser Automation Plan) | Expanded fieldMap to include `appointmentDate` & `urgency`; added TODO for pinned commit SHA; standardized prompt key naming.
Docs (Prompt Registry) | Added consistency notes: standardized keys (`chat`, `suggestServices`, `summarizeServiceInfo`, `automation.fillForm`); metadata deferment rationale.
Docs (Firestore Rules Draft) | Included checkpoints in access matrix and draft rule snippet; noted future status transition validator.
Sequence Diagram (Application Submission) | Fixed step numbering to 3-step schema; standardized completion audit action; added notes on prompt keys & checkpoints.
Sequence Diagram (Chat) | Normalized prompt template key (`chat`).
ER Diagram | Added `Checkpoint` table and relationships (AgentRun & Application associations).

Notes:
- No runtime code alterations introduced with these documentation edits.
- Open deferrals tracked in PLAN §5 consistency note.

## Guidelines for Future Entries
When adding an entry:
1. Use ISO date (YYYY-MM-DD).
2. Group multiple related small edits under one heading if same context & date.
3. Reference originating doc or file paths (e.g., `docs/PLAN.md`).
4. Mark breaking conceptual shifts (e.g., renaming a collection) with a ⚠️ indicator.
5. For code stubs introduced, briefly describe purpose & link back to design doc section (e.g., PLAN §2.1).

Template:
```
## YYYY-MM-DD – Short Title
Category | Change
-------- | ------
Docs | ...
Diagrams | ...
Data Model | ...
Code Stubs | ...
```

End of file.
