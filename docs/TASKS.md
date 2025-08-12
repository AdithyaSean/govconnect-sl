# TASKS (Next Prototype Iteration – Implementation Sprint 1)

Goal: Convert completed design docs into minimal runnable stubs: (a) dynamic schema-driven form renderer MVP for passport renewal, (b) promptTemplates seed & retrieval utility, (c) agentRuns + auditLogs collection wiring (client stubs), (d) basic Firestore rules draft file placed (not enforced), (e) checkpoint admin panel placeholder. Focus: vertical slice read-only + create operations; no full automation execution yet.

Design Docs Completed (Reference - DO NOT MODIFY):
- service-schema.md (User A)
- browser-automation-plan.md (User B)
- prompt-registry.md (User C)
- firestore-rules-draft.md (User D)
- hitl-checkpoints.md (User E)

Contributors: Same 5 users, now implement scoped code artifacts without exceeding design scope.

## User A – Dynamic Form Renderer Stub
Deliverables:
1. Create `src/lib/service-schemas/passport-renewal.ts` exporting the schema constant (from doc) with Zod types (no full validation logic beyond required fields).
2. Component `src/components/dynamic-form.tsx` that:
	- Renders steps & fields from schema (text/date/file/select only) for passportRenewalSchema.
	- Maintains internal state; on submit logs structured JSON to console.
3. Add page integration: import component into a new route `src/app/services/passport-renewal/demo/page.tsx`.
Verification:
- Console output matches mapping (field id -> value) when submitting sample data.

## User B – Automation Prompt Builder Utility
Deliverables:
1. `src/lib/automation/prompt-builder.ts` with function `buildAutomationPrompt(schema, data, user)` returning JSON (matches sample in browser-automation-plan.md).
2. Unit test (or simple script) logging sample output with dummy user & partial form data.
3. Placeholder invocation in dynamic form submit (feature-flagged constant). No external calls.
Verification:
- Logged JSON matches expected keys: goal, site, steps, fieldMap.

## User C – Prompt Registry Access Layer
Deliverables:
1. `src/lib/prompts/registry.ts` providing `getPrompt(key, locale)` -> { template, version } (mock in-memory seed array).
2. Seed file with examples for chat, suggestServices, summarizeServiceInfo, automation.fillForm.
3. Update existing Genkit flows (chat, suggest-services, summarize-service-info) to call this accessor (light edit) while preserving behavior.
Verification:
- Flows still compile; console log includes retrieved version.

## User D – Firestore Rules & Client Guard Stubs
Deliverables:
1. Add `firestore.rules` draft file mirroring firestore-rules-draft.md snippets.
2. Utility `src/lib/security/validators.ts` implementing status transition checker for Application (pure function).
3. Minimal unit test verifying allowed + disallowed transitions.
Verification:
- Test passes for sample transitions.

## User E – Checkpoint Admin Panel Placeholder
Deliverables:
1. `src/app/admin/checkpoints/page.tsx` listing mock checkpoints (static array) with columns: runId, type, createdAt, action button.
2. Component `src/components/checkpoint-table.tsx` reused by page.
3. Add resolution button that updates local state only and console logs audit action simulation.
Verification:
- Navigating to /admin/checkpoints shows table & resolving logs to console.

Shared Non-Functional Requirements:
- TypeScript strict types for new util modules.
- No network side-effects; Firestore calls may be commented placeholders.
- Keep components under 200 lines each.

Out of Scope This Sprint:
- Real browser automation execution.
- Actual Firestore security rule deployment.
- i18n & localization.
- Persistent checkpoint storage.

Submission Guidelines:
- Each user works only in assigned directories.
- Keep PRs small; link to design doc in top comment.
- Include TODO comments referencing future enhancements from PLAN.md sections.
- Update `CHANGELOG.md` with a dated entry summarizing each delivered artifact (Docs/Code Stubs) before requesting review; reference originating doc sections (e.g., PLAN §2.1, prompt-registry.md) and categorize changes.

Review Checklist (applies to every deliverable):
- [ ] Contains Overview (in file header JSDoc)
- [ ] Lists Assumptions (comments)
- [ ] Defines Data Shapes (types / interfaces)
- [ ] Provides At Least One Example (docstring or test)
- [ ] States Open Questions (TODO list)

End of Updated TASKS.
