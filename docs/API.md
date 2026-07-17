# MailChamp HTTP API

Base URL (local): `http://localhost:8080`  
Public clients should use the Next.js BFF: `POST/GET/PATCH/DELETE /api/proxy/...` after an authenticated session.

All `/api/v1/*` routes except health require:

```http
Authorization: Bearer <HS256 JWT>
```

JWT claims: `sub` = Better Auth user id, `exp` required, TTL ≤ 5 minutes when minted by Next.js.

---

## `GET /api/v1/health`

No auth.

**200**

```json
{ "status": "ok" }
```

**503** — database unreachable.

---

## `POST /api/v1/emails/generate`

Rate limit: **10 requests / user / minute** (in-memory, per process).

**Request** (max body 1 MiB)

```json
{
  "intent": "Follow up after the demo",
  "key_facts": ["Met March 12", "Send deck by Friday"],
  "tone": "formal",
  "strategy": "advanced"
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `intent` | yes | Non-empty |
| `tone` | yes | Non-empty |
| `key_facts` | no | Array of strings |
| `strategy` | no | `advanced` (default) or `naive` |

**200**

```json
{
  "subject": "...",
  "body_text": "...",
  "body_html": "...",
  "model_used": "gemini-3.1-flash-lite-preview"
}
```

**400** invalid body / strategy  
**401** missing/invalid JWT  
**413** body too large  
**429** rate limited  
**502** generation failed  
**504** generation timed out (~85s server budget)

---

## `GET /api/v1/emails`

Query: `status` = empty \| `all` \| `draft` \| `sent` \| `archived`

- `all` / empty → `draft` + `sent` (All Mail)
- `archived` → Archive folder

**200**

```json
{ "emails": [ /* Email */ ] }
```

---

## `GET /api/v1/emails/{id}`

**200** Email object  
**404** not found or other user’s id

---

## `POST /api/v1/emails`

Create. Default `status` = `draft`.

```json
{
  "subject": "",
  "body_html": "<p></p>",
  "body_text": "",
  "intent": null,
  "key_facts": [],
  "tone": null,
  "strategy": "advanced",
  "to_address": null,
  "status": "draft"
}
```

**201** Email  
**400** invalid status/strategy

---

## `PATCH /api/v1/emails/{id}`

Partial update. Same field rules as create for `status` / `strategy`.

**200** Email  
**404** missing

---

## `DELETE /api/v1/emails/{id}`

Hard delete.

**204**  
**404** missing

---

## Email object

```json
{
  "id": "uuid",
  "user_id": "text",
  "status": "draft|sent|archived",
  "subject": "string",
  "body_html": "string",
  "body_text": "string",
  "intent": "string|null",
  "key_facts": ["..."],
  "tone": "string|null",
  "strategy": "advanced|naive|null",
  "to_address": "string|null",
  "created_at": "RFC3339",
  "updated_at": "RFC3339"
}
```

---

## Errors

JSON body shape:

```json
{ "error": "human-readable message" }
```

Internal Postgres/Gemini details are not returned to clients.
