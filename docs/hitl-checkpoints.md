# HITL Checkpoints & Audit Taxonomy

Overview: Human-in-the-loop (HITL) checkpoint design for pausing automation / AI flows until manual intervention. Cross-links: PLAN.md sections 2.3, 5.

Assumptions:
- Checkpoints stored either embedded in agentRuns or separate collection `checkpoints` (option chosen: separate for query efficiency).
- Each checkpoint references agentRunId + applicationId (optional).

Alignment Update: PLAN.md now explicitly lists `checkpoints` as a new collection (Data Model Additions). The ER diagram will be revised to include this collection in the next modeling pass.

Checkpoint Schema:
```
Checkpoint {
  id: string
  runId: string (agentRuns.id)
  applicationId?: string
  type: string (captcha|dataClarification|manualApproval)
  state: string (created|pending|resolved|expired|canceled)
  createdAt: Timestamp
  expiresAt?: Timestamp
  resolvedAt?: Timestamp
  payload: Map<string,any> (e.g., { imageSelector, question })
  resolution?: { actorId: string, value: any }
}
```
Lifecycle:
created -> pending -> (resolved | expired | canceled)
- Transition to pending when surfaced to UI
- Expired when past expiresAt
- Canceled if automation aborts

Audit Action Taxonomy (subset):
```
AuthUserLoaded, AuthUserMissing,
CreateApplication, StartAgentRun, AgentCheckpointCreate, AgentCheckpointResolve,
AgentCheckpointExpire, ResumeAgentRun, AutomationComplete, CreatePayment,
CreateNotification, SupportTicketCreate, SupportTicketReply, SupportTicketClose,
StartChat, CompleteChat, ChatError, StartSuggestServices, CompleteSuggestServices,
SuggestServicesError, StartSummarizeServiceInfo, CompleteSummarizeServiceInfo,
SummarizeServiceInfoError, PromptOutputValidationFailed,
CompleteApplication // Optional: used in some sequence diagrams; treat as synonym for end-to-end application finalization (manual or automated). Prefer AutomationComplete for automation path.
```

Admin Dashboard Checkpoint Queue (ASCII Wireframe):
```
+--------------------------------------------------------------+
| Pending Checkpoints (Filters: type ▼ state ▼ age ▼)          |
+------------+-----------+-----------+-------------+-----------+
| Run ID     | Type      | Created   | Application | Action    |
+------------+-----------+-----------+-------------+-----------+
| run_abc123 | captcha   | 10:14:05  | app_xyz789  | [Resolve] |
| run_def456 | dataClar. | 10:15:22  | app_qwe111  | [View]    |
+------------+-----------+-----------+-------------+-----------+
[ Auto-Refresh 30s ]  [ Export ]
```

Escalation Flow:
- Job scans pending checkpoints; if now > createdAt + SLA (e.g., 5m) -> create notification to admin role.
- If > 15m unresolved -> mark expired; log AgentCheckpointExpire; automation either aborts or proceeds with default.

Example Serialized Checkpoint JSON + Audit Entries:
```
Checkpoint:
{
  "id":"chk_001","runId":"run_abc123","applicationId":"app_xyz789",
  "type":"captcha","state":"pending","createdAt":"2025-08-13T10:14:05Z",
  "payload":{ "imageSelector":"img.captcha","prompt":"Enter characters" }
}
Audit Logs (ordered):
1 { action: "StartAgentRun", entityId:"run_abc123" }
2 { action: "AgentCheckpointCreate", entityId:"chk_001" }
3 { action: "AgentCheckpointResolve", entityId:"chk_001", after:{ value:"X7PQ" } }
4 { action: "AutomationComplete", entityId:"run_abc123" }
```

Open Questions:
- Separate collection vs embedded array trade-offs? (Chose separate.)
- Need SLA per checkpoint type? (Potential future field: slaSec.)
- Should unresolved captcha fallback to manual full submission?
