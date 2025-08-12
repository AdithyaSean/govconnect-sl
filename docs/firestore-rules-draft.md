# Firestore Rules Draft & Security Model

Overview: Initial RBAC & field constraints for core collections. Cross-links: PLAN.md sections 5, 6.

Assumptions:
- Custom claims (roles[]) set on Auth token: may include "user", "worker", "admin".
- Least privilege: users only access own records by userId / nic.
- Prototype: rules not enforced yet, design only.

Collections & Access Matrix (R=read, W=write, A=admin elevated):
```
| Collection       | user            | worker                   | admin |
|------------------|-----------------|--------------------------|-------|
| users            | R (self)        | R (assigned?)            | R/W   |
| applications     | R/W (own)       | R/W (all limited fields) | R/W   |
| payments         | R (own)         | R                        | R/W   |
| notifications    | R (own)         | R (for escalation)       | R/W   |
| supportTickets   | R/W (own)       | R/W                      | R/W   |
| agentRuns        | R (own)         | R (assigned)             | R/W   |
| auditLogs        | R (filtered own)| R (limited fields)       | R/W   |
| promptTemplates  | R               | R                        | R/W   |
| checkpoints      | R (own via run) | R (assigned)             | R/W   |
```

Status Transition Constraints:
Application.status allowed transitions:
```
Pending -> In Progress | Pending Payment
Pending Payment -> In Progress | Rejected
In Progress -> Approved | Rejected | Completed | In Review
In Review -> Approved | Rejected
Approved -> Completed
```
Payment.status transitions:
```
(null) -> Success | Failed
Failed -> Success (retry)
```

PII Handling Strategy:
- Encrypt client-side (future) fields: application.details.nicScan, user.nicImage.
- Encryption envelope: `{ cipher: base64, iv: base64, alg: "AES-GCM", keyRef: "k1" }`.
- Key management: rotate keyRef; store encrypted master key in secure backend.

Rule Snippets (Pseudo):
Users:
```
match /users/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid || hasRole('admin');
  allow write: if hasRole('admin');
}
```
Applications:
```
match /applications/{id} {
 allow read: if isOwner(resource.data.userId) || hasRoleAny(['worker','admin']);
 allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
 allow update: if isOwner(resource.data.userId) || hasRoleAny(['worker','admin']);
 allow delete: if hasRole('admin');
}
```
Payments:
```
match /payments/{id} {
 allow read: if isOwner(resource.data.userId) || hasRoleAny(['worker','admin']);
 allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
}
```
Audit Logs:
```
match /auditLogs/{id} {
 allow read: if hasRoleAny(['worker','admin']) || (isOwner(resource.data.actorId) && resource.data.actorType=='user');
 allow write: if request.auth != null; // append-only via server
}
```
Prompt Templates:
```
match /promptTemplates/{id} {
 allow read: if true;
 allow write: if hasRole('admin');
}
```
Helper Functions:
```
function hasRole(r) { return r in request.auth.token.roles; }
function hasRoleAny(arr) { return arr.exists(r => r in request.auth.token.roles); }
function isOwner(uid) { return request.auth != null && request.auth.uid == uid; }

Checkpoints (Draft):
```
match /checkpoints/{id} {
  allow read: if hasRoleAny(['worker','admin']) || (isOwner(resource.data.actorUserId));
  allow update: if hasRoleAny(['worker','admin']); // resolution actions only
  allow create: if request.auth != null; // typically via server action
}
```

Status Transition Enforcement: A future client/server-side validator (`validators.ts`) will enforce the Application.status graph before writes; rules may later inline allowed transitions using a map literal for defense-in-depth.
```

Open Questions:
- Need field-level redaction for auditLogs before worker read?
- Should workers be restricted by service assignment list?
- How to enforce status transition graph strictly (map of allowed pairs)?
