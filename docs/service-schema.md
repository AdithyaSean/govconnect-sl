# Service Schema & Dynamic Form Spec (Prototype)

Overview: Defines JSON/Zod-driven schema for dynamic service application forms (initial example: Passport Renewal). Cross-link: see PLAN.md sections 2.1, 5.

Assumptions:
- Forms are rendered client-side from schema; no server validation yet.
- Conditional logic evaluated locally.
- File uploads handled as base64 then replaced with storage refs later.
- NIC field can be auto-populated from authenticated user profile.

Data Shape:
```
ServiceFormSchema {
  serviceSlug: string
  version: number
  steps: Step[]
  paymentConfig?: { amount: number | (details)=>number, currency: string, requiredBeforeSubmission?: boolean }
  submissionMode: "direct" | "pdf" | "externalAutomation"
  fields: Field[] (flat registry by id for reference in steps)
}
Step { id: string; title: string; description?: string; fields: string[] (ids referencing Field); condition?: Expr }
Field (discriminated union by type):
  Base: { id: string; label: string; required?: boolean; helpText?: string; dependsOn?: ConditionRef[] }
  Text: Base & { type:"text"; inputMode?: "text"|"email"|"nic"; maxLength?: number }
  Date: Base & { type:"date"; min?: string|Relative; max?: string|Relative }
  Select: Base & { type:"select"; options: { value:string; label:string }[]; multiple?: boolean }
  File: Base & { type:"file"; accept: string[]; maxSizeMB?: number }
  Rating: Base & { type:"rating"; scale: number }
  AutocompleteNIC: Base & { type:"nic"; autoFill:true }
Validation:
  - Required enforced per field.required.
  - Custom rules: regex, numeric ranges, file size.
Conditional Logic (Expr): simple DSL: and/or/not + comparisons on other field values.
Mapping -> Firestore application.details: { [field.id]: value }
```

Example Mapping Table (excerpt):
```
| Field ID | Firestore Path                | Notes |
|---------|-------------------------------|-------|
| fullName| application.details.fullName  | text  |
| nic     | application.details.nic       | auto-filled from user.nic if blank |
| dob     | application.details.dob       | ISO date |
| photo   | application.documents.photo   | file stored; name => ref |
```

Extension: paymentConfig & submissionMode
- paymentConfig: allows dynamic computation based on field values (e.g., urgency flag) later.
- submissionMode: guides downstream automation: direct (store only), pdf (generate PDF), externalAutomation (browser-use run).

Example Schema Stub (Passport Renewal) (abbreviated):
```
export const passportRenewalSchema /*: ServiceFormSchema*/ = {
  serviceSlug: "passport-renewal",
  version: 1,
  submissionMode: "externalAutomation",
  paymentConfig: { amount: 5000, currency: "LKR", requiredBeforeSubmission: false },
  fields: [
    { id:"fullName", type:"text", label:"Full Name", required:true },
    { id:"nic", type:"nic", label:"National ID", required:true, helpText:"Auto-filled", autoFill:true },
    { id:"dob", type:"date", label:"Date of Birth", required:true },
    { id:"photo", type:"file", label:"Passport Photo", accept:["image/jpeg"], required:true, maxSizeMB:2 },
    { id:"appointmentDate", type:"date", label:"Preferred Appointment Date" },
    { id:"urgency", type:"select", label:"Urgency", options:[{value:"normal",label:"Normal"},{value:"urgent",label:"Urgent"}] }
  ],
  steps: [
    { id:"personal", title:"Personal Info", fields:["fullName","nic","dob"] },
    { id:"documents", title:"Documents", fields:["photo"] },
    { id:"appointment", title:"Appointment", fields:["appointmentDate","urgency"] }
  ]
}
```

ASCII Mock (Rendered):
```
[Step 1: Personal Info]
 Full Name: ______________________
 NIC (auto): 9XXXXXXXXV (readonly)
 Date of Birth: [YYYY-MM-DD]
 [Next]

[Step 2: Documents]
 Passport Photo: [Choose File] (max 2MB)  [Next]

[Step 3: Appointment]
 Preferred Appointment Date: [YYYY-MM-DD]
 Urgency: ( ) Normal ( ) Urgent
 [Submit]  [Back]
```

Open Questions:
- How to localize field labels (plan: key-based + locale templates)?
- Will conditional steps be needed for fee variations now or later?
- Do we pre-reserve application ID before payment when requiredBeforeSubmission=true?
