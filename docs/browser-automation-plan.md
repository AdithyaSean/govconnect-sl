# Browser Automation Integration Plan (browser-use)

Overview: Plan for integrating headless browser automation using the open-source `browser-use` project to submit external government service forms (prototype: passport renewal). References PLAN.md sections 2.2, 3.4.

Assumptions:
- No real execution in prototype; prompt + step sequence only.
- Automation runs are ephemeral; no PII persisted beyond needed fields.
- CAPTCHA may appear; triggers HITL checkpoint.

Chosen Project:
- Repo: https://github.com/browser-use/browser-use
- Pinned Commit: <commit-hash-placeholder>  // TODO: Set explicit commit SHA before first executable prototype (Week 7–8 per PLAN). Leaving placeholder avoids false reproducibility claim.

Prompt Construction Spec:
Input sources:
- service schema (subset of fields relevant to external site)
- user profile snapshot { name, nic, email }
- application details collected so far
Output JSON (automationPrompt):
```
{
  "goal": "Submit passport renewal form",
  "site": "https://example-gov/passport",
  "steps": [ StepInstruction ],
  "constraints": { "maxDurationSec": 180, "respectRobotsTxt": false },
  "hitlCheckpoints": ["captcha", "ambiguousField"],
  "fieldMap": { localFieldId: { selector: "css/xpath", type:"text|file|select" } }
}
```

Sequence (Passport Renewal):
1. Navigate to landing page.
2. Click "Renew Passport".
3. Fill Name.
4. Fill NIC.
5. Fill DOB (date picker).
6. Upload photo placeholder (test image path).
7. Set appointment date.
8. Select urgency option.
9. Submit form.
10. Wait for confirmation; capture confirmation number.
11. Return receipt object { externalRef, timestamp }.

Environment & Security Checklist:
- Secrets: headless browser API key (if SaaS), proxy credentials.
- Network isolation: run in sandbox container.
- Timeout: 3 min max per run.
- PII minimization: only required fields passed.
- Logging: store only high-level events (no raw DOM dumps with PII).

Risks & Fallbacks:
| Risk | Impact | Fallback |
|------|--------|----------|
| CAPTCHA | Blocks automation | Create HITL checkpoint; manual solve or defer |
| Layout drift | Selectors fail | Maintain selector versions; DOM snippet hashing |
| Rate limiting | Run aborted | Backoff & reschedule (one retry) |
| Session timeout | Partial submission | Re-login step injection |

Sample Prompt JSON (expanded fieldMap to reflect full schema fields):
```
{
  "goal": "Submit passport renewal form",
  "site": "https://example.gov/passport/renew",
  "steps": [
    { "action":"goto", "url":"https://example.gov/passport" },
    { "action":"click", "selector":"a#renew-link" },
    { "action":"type", "selector":"input[name=fullName]", "value":"Jane Doe" },
    { "action":"type", "selector":"input[name=nic]", "value":"902345678V" },
    { "action":"type", "selector":"input[name=dob]", "value":"1992-05-10" },
    { "action":"upload", "selector":"input[name=photo]", "filePath":"/tmp/photo.jpg" },
    { "action":"type", "selector":"input[name=appointmentDate]", "value":"2025-09-01" },
    { "action":"click", "selector":"input[value=urgent]" },
    { "action":"click", "selector":"button[type=submit]" },
    { "action":"waitForSelector", "selector":"#confirmationNumber" },
    { "action":"extractText", "selector":"#confirmationNumber", "as":"externalRef" }
  ],
  "constraints": { "maxDurationSec": 180 },
  "hitlCheckpoints": [ { "type":"captcha", "selector":"img.captcha" } ],
  "fieldMap": {
    "fullName": { "selector":"input[name=fullName]", "type":"text" },
    "nic": { "selector":"input[name=nic]", "type":"text" },
    "dob": { "selector":"input[name=dob]", "type":"date" },
    "photo": { "selector":"input[name=photo]", "type":"file" },
    "appointmentDate": { "selector":"input[name=appointmentDate]", "type":"date" },
    "urgency": { "selector":"select[name=urgency]", "type":"select" }
  }
}
```

Naming Consistency: Prompt registry uses key `chat` (not `chatFlow`). All sequence diagrams and code should normalize to `chat`, `suggestServices`, `summarizeServiceInfo`, `automation.fillForm` to avoid drift. Future automation-specific execution flows may introduce a separate `automation.externalSubmission` key if needed.

Open Questions:
- Need login flow now or postpone? (Not in prototype.)
- Do we snapshot full HTML for audit? (Probably no, summary only.)
- Standardize selectors repository for drift detection?
