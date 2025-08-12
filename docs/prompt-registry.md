# Prompt Registry & Guardrails Design

Overview: Centralize prompt templates under collection `promptTemplates` with versioning and guardrails for AI flows (chat, suggestServices, summarizeServiceInfo, automation.fillForm). Cross-links: PLAN.md sections 3.1, 5, 7.

Assumptions:
- Templates retrieved by { key, locale, latest active version }.
- Immutable templates after publish; new version increments version number.
- Guardrails enforce output schema when structured.

Collection Schema (`promptTemplates`):
```
{
  id: string (auto)
  key: string (e.g., "chat", "suggestServices", "summarizeServiceInfo", "automation.fillForm")
  version: number
  locale: string (e.g., "en", "si", "ta")
  template: string (full text with placeholders {{var}} )
  createdAt: Timestamp
  deprecated: boolean (soft flag)
  metadata?: { maxTokens?: number, outputSchemaKey?: string }
}
```

Versioning Workflow:
1. Draft locally (not stored).
2. Create new doc with version = prevVersion + 1.
3. Deploy referencing explicit version.
4. If rollback needed, use earlier version explicitly.

JSON Examples:
Chat Prompt:
```
{
  "key":"chat","version":1,"locale":"en","template":"You are a helpful civic assistant. User message: {{message}}" }
```
Suggest Services Prompt:
```
{ "key":"suggestServices","version":1,"locale":"en","template":"Given user query: {{query}} return a JSON array of up to 5 service slugs." }
```
Summarize Service Info Prompt:
```
{ "key":"summarizeServiceInfo","version":1,"locale":"en","template":"Summarize the following service details: {{details}} in <=120 words." }
```
Automation Fill Form Prompt (guidance for automation agent):
```
{ "key":"automation.fillForm","version":1,"locale":"en","template":"Using the field map {{fieldMapJson}} and user data {{userJson}} plan granular browser steps to submit the service form." }
```

Guardrails:
- Max tokens: metadata.maxTokens enforced per flow contract; trim history/context if > threshold.
- Schema validation: For structured outputs (suggestServices, summarizeServiceInfo in JSON), validate via Zod / JSON Schema; if invalid:
  1. Attempt automatic repair using function:repairInvalidJson(rawOutput)
  2. If still invalid, log audit action (PromptOutputValidationFailed) and return fallback.
- Deterministic caching key: `hash(key + version + locale + stableStringify(userInputSubset))` for summarization & suggestions.

Invalid -> Remediation Example:
Raw Output: `Service: passport-renewal, license-renewal`
Validation Failure: not JSON array.
Repair Attempt: wrap tokens -> `["passport-renewal","license-renewal"]`
Success -> store & return.
If still fails -> fallback: empty array + audit log.

Before / After Prompt Version Upgrade:
Before v1 (suggestServices): "Given user query: {{query}} return a JSON array." (often produced extraneous text)
After v2: "Given user query: {{query}} respond ONLY with minified JSON array of up to 5 lowercase service slugs, no commentary." (reduced hallucination)

Open Questions:
- Need per-locale variant at prototype? (English only now.)
- Storage for outputSchema definitions: embed vs separate collection?
- Should we store token usage snapshot per prompt invocation?

Consistency Notes:
1. Standardized Keys: Use `chat`, `suggestServices`, `summarizeServiceInfo`, `automation.fillForm` (avoid variants like `chatFlow` in diagrams/code). Sequence diagrams will be updated accordingly in the next diagram revision pass.
2. ER Diagram Gap: Current ER diagram omits the `metadata` object field shown here; slated for inclusion when checkpoint collection is also added (see PLAN.md section 5 update).
3. Automation Prompt Separation: If future differentiation needed, introduce `automation.externalSubmission` rather than overloading `automation.fillForm`.
