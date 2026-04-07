# PATCH DE PROTEÇÃO — BLOQUEIO DE MUDANÇAS NÃO AUTORIZADAS NO CRM/IA

**Timestamp:** 2025-01-06  
**Status:** ✅ ACTIVE - Protection Lock Enabled  
**Type:** Governance Documentation (No Code Changes)

---

## Executive Summary

**PROTECTION LOCK ACTIVE.** All unauthorized changes to CRM/IA WRITE functions, automation, and orchestration are BLOCKED until explicit approval.

**Purpose:** Preserve stable state, prevent regression, ensure controlled evolution.

---

## 🛡️ Protected Components (DO NOT CHANGE)

### Core Protected Assets

| Component | Protection Level | Status | Who Can Change |
|-----------|-----------------|--------|----------------|
| `agent_create_lead_interest` | 🔒 **LOCKED** | Production | Senior Dev + Architect Approval |
| n8n Orchestration Flow | 🔒 **LOCKED** | Production | Senior Dev + Architect Approval |
| Disparo Rules | 🔒 **LOCKED** | Production | Business + Architect Approval |
| Leads Table Structure | 🔒 **LOCKED** | Production | Architect + DBA Approval |
| Timeline Table Structure | 🔒 **LOCKED** | Production | Architect + DBA Approval |
| Agent Tokens (Scopes) | 🔒 **LOCKED** | Production | Architect Approval |

### What This Means

**🚫 WITHOUT EXPLICIT APPROVAL, YOU CANNOT:**

- Modify `agent_create_lead_interest` function
- Add new CRM WRITE functions
- Automate lead creation without user confirmation
- Change leads/timeline table structure
- Modify agent token scopes
- Add automatic n8n triggers for CRM operations

**✅ YOU CAN (WITH PROPER REVIEW):**

- Use existing READ functions freely
- Add new READ functions (with review)
- Fix bugs in existing functions
- Improve documentation
- Add monitoring/logging

---

## Rule 1: New CRM WRITE Functions

### Approval Process Required

Before creating any new CRM WRITE function, you MUST:

#### Step 1: Define Contract ✅
- Create contract document following `AGENT_CRM_ADD_TIMELINE_NOTE_CONTRACT.md` format
- Include: request/response, validation, error handling, examples
- Document WHEN to use vs existing functions

#### Step 2: Define Disparo Rules ✅
- Create disparo rules document following `AGENT_CREATE_LEAD_INTEREST_DISPARO_RULES.md` format
- Include: when to call, when NOT to call, examples
- Document business logic explicitly

#### Step 3: Create Function ✅
- Follow authentication pattern (x-agent-token + scope)
- Use consistent response format (ok/error)
- Add prefixed logs `[function_name]`
- Implement proper error handling

#### Step 4: Test ✅
- Unit tests for happy path
- Unit tests for error cases
- Integration test with n8n
- Manual testing with real agent token

#### Step 5: Document ✅
- Update `AGENT_FUNCTIONS_ORGANIZATION.md`
- Update `STATE_CHECKPOINT_CRM_IA_2025_01_06.md`
- Create or update disparo rules document
- Update n8n documentation

#### Step 6: Approve ✅
- Code review by Senior Developer
- Architect review
- Business review (if affects business logic)
- Document approval in CHANGELOG

### Approval Checklist

| Requirement | Status | Approved By | Date |
|-------------|--------|-------------|------|
| Contract defined | ⬜ | | |
| Disparo rules defined | ⬜ | | |
| Function implemented | ⬜ | | |
| Tests passed | ⬜ | | |
| Documentation updated | ⬜ | | |
| Senior Dev review | ⬜ | | |
| Architect review | ⬜ | | |
| Business review (if needed) | ⬜ | | |

**❌ MISSING ANY ITEM = BLOCKED. DO NOT MERGE.**

---

## Rule 2: Legacy Functions

### Status: DEPRECATED - DO NOT USE

| Legacy Function | Status | Action |
|-----------------|--------|--------|
| `agent_add_lead_note` | 🚫 **DEPRECATED** | Do NOT use in production |
| `agent_create_lead` | 🚫 **DEPRECATED** | Do NOT use in production |
| `agent_update_lead_status` | 🚫 **DEPRECATED** | Do NOT use in production |

### Reactivation Process

To reactivate any legacy function, you MUST:

1. **Analyze** why it was deprecated
2. **Document** use case that requires it
3. **Compare** with current active function
4. **Decide**: Reactivate vs Replace vs Create new
5. **Get approval** from Architect
6. **Update** `AGENT_FUNCTIONS_ORGANIZATION.md`
7. **Update** disparo rules (if needed)
8. **Test** thoroughly

### ⚠️ Quick Check

**If you're tempted to use a legacy function:**

❌ DON'T - Use `agent_create_lead_interest` instead  
❌ DON'T - Legacy functions may have bugs or obsolete logic  
❌ DON'T - No one will maintain legacy code  

✅ DO - Document why you need a different function  
✅ DO - Discuss with team  
✅ DO - Follow proper approval process  

---

## Rule 3: Orchestration (n8n) Protections

### Automatic Triggers: RESTRICTED

**🚫 FORBIDDEN AUTOMATIONS:**

- ❌ Automatic lead creation on ANY message
- ❌ Automatic lead creation on product questions
- ❌ Automatic timeline creation without intent
- ❌ Automatic CRM operations without user confirmation

**✅ ALLOWED AUTOMATIONS:**

- ✅ Monitoring and logging
- ✅ Error alerts and notifications
- ✅ Reporting and analytics
- ✅ READ operations (products, orders, etc.)

### Manual Triggers: CONTROLLED

When adding new n8n nodes that call CRM functions:

1. **Verify** function is approved for production use
2. **Check** disparo rules apply
3. **Confirm** user explicitly requested action
4. **Add** logging for traceability
5. **Test** end-to-end
6. **Document** in workflow

### Example: Adding New CRM Call to n8n

**❌ WRONG:**
```
User: "Qual o preço do produto X?"
→ n8n: [Automatic call to agent_create_lead_interest]
→ System: Lead created without intent
```

**✅ CORRECT:**
```
User: "Quero que me liguem sobre o produto X"
→ IA: Detects intent "request_callback"
→ IA: Confirms with user: "Posso registrar seu interesse?"
→ User: "Sim, por favor"
→ n8n: [Call to agent_create_lead_interest with explicit intent]
→ System: Lead created with documented intent
```

---

## Rule 4: Documentation Updates

### Documentation Governance

| Action Required | Update This File | Example |
|------------------|------------------|---------|
| New function created | `AGENT_FUNCTIONS_ORGANIZATION.md` | Add to CRM domain |
| Function contract defined | Create new `[NAME]_CONTRACT.md` | Follow template |
| Disparo rules defined | Create `[NAME]_DISPARO_RULES.md` | Follow format |
| System state changed | `STATE_CHECKPOINT_CRM_IA_2025_01_06.md` | Add version entry |
| Protection rules changed | `CRM_IA_PROTECTION_LOCK.md` (this file) | Update rules |
| Function deprecated | Mark in `AGENT_FUNCTIONS_ORGANIZATION.md` | Add ⚠️ status |

### Documentation Checklist Before Merge

| Checklist Item | Status | Notes |
|----------------|--------|-------|
| Contract documented | ⬜ | Follows existing format |
| Disparo rules documented | ⬜ | Follows existing format |
| Organization file updated | ⬜ | Function added to domain |
| State checkpoint updated | ⬜ | New version entry |
| Changelog entry created | ⬜ | Changes documented |

**❌ MISSING ANY ITEM = DO NOT MERGE.**

---

## Enforcement Process

### Level 1: Code Review

**Pull Request Reviewer Must Check:**

- [ ] Is this a new CRM WRITE function?
  - [ ] If YES: Do we have approved contract?
  - [ ] If YES: Do we have approved disparo rules?
  - [ ] If NO to either: ❌ BLOCK PR
- [ ] Does this modify `agent_create_lead_interest`?
  - [ ] If YES: ❌ BLOCK PR (requires architect approval)
- [ ] Does this use a legacy function?
  - [ ] If YES: ❌ BLOCK PR (use `agent_create_lead_interest`)
- [ ] Does this add automation to n8n?
  - [ ] If YES: Does it have disparo rules?
  - [ ] If NO: ❌ BLOCK PR
- [ ] Is documentation updated?
  - [ ] If NO: ❌ BLOCK PR

### Level 2: Architect Review

**Required For:**

- Any change to `agent_create_lead_interest`
- Any new CRM WRITE function
- Any database schema change (leads/timeline)
- Any agent token scope change
- Any n8n automation that creates/updates CRM data

### Level 3: Business Review

**Required For:**

- Changes that affect customer experience
- Changes that affect sales workflow
- Changes that affect reporting/analytics

---

## Emergency Exception Process

### When This Lock Can Be Bypassed

**ONLY in emergency situations:**

1. **Critical Bug** blocking all production traffic
2. **Security Vulnerability** requiring immediate fix
3. **Data Loss** situation requiring immediate action

### Emergency Process

1. **Document** emergency situation in ticket/issue
2. **Get approval** from Architect AND Tech Lead
3. **Implement** minimal fix
4. **Document** what was changed and why
5. **Schedule** proper review within 48 hours
6. **Update** all documentation (checkpoint, etc.)

### ⚠️ Emergency Example

**SITUATION:** `agent_create_lead_interest` is failing for all requests

**APPROVED EMERGENCY FIX:**
- Fix the bug causing failure
- Minimal change only
- Document in issue: "Emergency fix for agent_create_lead_interest failure"
- Get Architect + Tech Lead approval
- Deploy
- Within 48h: Proper code review, documentation update, state checkpoint update

**NOT AN EMERGENCY:**
- "I want to add a new feature quickly"
- "Legacy function would be faster to use"
- "I don't have time to follow the process"

---

## Monitoring and Alerts

### What Gets Monitored

| Metric | Threshold | Alert |
|--------|-----------|-------|
| New CRM WRITE function calls | Any | Alert team |
| Legacy function calls | Any | Alert team (DEPRECATED) |
| Failed `agent_create_lead_interest` calls | > 5% | Alert team |
| n8n CRM automation triggers | Any | Review with team |
| Token scope changes | Any | Alert team |

### Daily Review

**Review with team:**

1. Any new CRM functions deployed?
2. Any legacy function usage detected?
3. Any n8n automation added?
4. Any database schema changes?
5. Any protection lock violations?

---

## Change Log

### Version History

| Version | Date | Change | Approved By |
|---------|------|--------|-------------|
| 1.0 | 2025-01-06 | Initial protection lock | - |
| 1.1 | YYYY-MM-DD | [Future change] | [Approver] |

### How to Add Version Entry

When updating protection rules:

```markdown
### Version X.Y
**Date:** YYYY-MM-DD
**Changes:**
- [Change 1]
- [Change 2]
**Approved By:** [Name]
**Reason:** [Why this change was needed]
```

---

## Quick Reference Card

### ❌ FORBIDDEN (Without Approval)

- ❌ Modify `agent_create_lead_interest`
- ❌ Create new CRM WRITE function without contract
- ❌ Create new CRM WRITE function without disparo rules
- ❌ Use legacy functions in production
- ❌ Automate lead creation without user confirmation
- ❌ Add n8n triggers without disparo rules
- ❌ Change leads/timeline table structure
- ❌ Modify agent token scopes

### ✅ ALLOWED (With Review)

- ✅ Create READ functions
- ✅ Fix bugs in existing functions
- ✅ Improve documentation
- ✅ Add monitoring/logging
- ✅ Create new CRM WRITE functions (with full approval)

### 📋 Approval Required For

- Any change to `agent_create_lead_interest`
- Any new CRM WRITE function
- Any database schema change
- Any agent token scope change
- Any n8n automation that modifies CRM data

### 🚨 Emergency Exceptions

- Critical bug blocking all traffic
- Security vulnerability
- Data loss situation

---

## Contact and Escalation

### For Questions About This Lock

- **Documentation:** Read this file thoroughly
- **Technical Questions:** Contact Senior Developer
- **Architectural Questions:** Contact Architect
- **Business Questions:** Contact Product Owner

### To Request Exception or Change

1. Document request in ticket/issue
2. Explain WHY this exception is needed
3. Propose solution
4. Get approval from appropriate approver(s)
5. Follow approval process

---

## Conclusion

**THIS PROTECTION LOCK IS ACTIVE.**

All changes to CRM/IA WRITE functions, automation, and orchestration are governed by these rules.

**Purpose:** Ensure stable, controlled evolution of CRM/IA system.

**Result:** Clean CRM, no regressions, predictable behavior.

**Remember:**
- 🛡️ Protected components are LOCKED
- 📋 Approval process is MANDATORY
- 🚫 Legacy functions are DEPRECATED
- ✅ Documentation must ALWAYS be updated

---

**Protection Lock ID:** CRM-IA-LOCK-2025-01-06-001  
**Status:** ✅ ACTIVE  
**Last Updated:** 2025-01-06  
**Next Review:** When changes are proposed  
**Owner:** Development Team + Architect

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Senior Developer | - | 2025-01-06 | ✅ |
| Architect | - | 2025-01-06 | ✅ |
| Product Owner | - | 2025-01-06 | ✅ |

---

**END OF PROTECTION LOCK**  
**ALL SYSTEMS PROTECTED.** 🛡️
