# n8n Node — Product Readiness Audit

**Date:** 2026-05-03
**Package:** `n8n-nodes-tokensense@0.1.1`
**Author:** Cowork (audit; not a code-change session)
**Scope:** Full launch readiness — submission to n8n Creator Portal **plus** post-verification commercial layer (operations, support, telemetry, positioning).
**Evidence basis:** Existing artifacts only — repo state, May 2 smoke pack, May 3 PM Pre-Flight, related vault notes. No live re-runs of scanner/build/tests/Docker. Items requiring live re-verification are flagged explicitly.

---

## Executive summary (Carlo-readable)

**Overall verdict: Conditional-ready.** The package itself is in a strong place — published to npm `latest` with provenance, security scanner clean, 62 tests passing, three runtime registrations confirmed in fresh n8n 2.16.1 Docker, end-to-end attribution working in a real Logicfox workflow. Submission to n8n's Creator Portal is the right next move *after* a focused v0.1.2 polish pass.

**What's stopping us from clicking "submit" today:**

1. The **README** still lists a "TokenSense Embeddings" sub-node that doesn't exist. A reviewer or a curious user will spot this in 30 seconds.
2. The **marketplace card description** in `package.json` reads as engineer-jargon ("unified LLM proxy with multi-provider routing"). Sitting next to OpenRouter and Vercel AI Gateway, that's a missed first impression.
3. The **credential dialog's "Get help" link** points at the GitHub README root. A user trying to *get an API key* lands on a page about installation. Friction at exactly the moment we want zero.

These three are surgical fixes — drafted in the May 3 PM Pre-Flight note, ~30–45 minutes of Claude Code time as a v0.1.2 sprint.

**Beyond submission, the launch isn't ready in three other places:**

- **No 30-day success metric defined** — we won't know if launch worked.
- **NPM_TOKEN expires ~May 19** — if we miss it, the publish pipeline breaks at the worst possible time (mid-launch).
- **No support plan for the first n8n Cloud user who hits a problem at 2am** — first 1-star review risk.

**Recommended next move:** dispatch the v0.1.2 sprint (Blockers 1+2+3), bundle in the AI Tool variant README mention (low-effort yes), decide credential `documentationUrl` target, set the success metric, rotate NPM_TOKEN to Trusted Publishers, then submit. Total path-to-submission: ~half a day of focused work.

---

## Verdict matrix

| # | Dimension | Verdict | One-line read |
|---|---|---|---|
| 1 | Package quality | ✅ Ready | Tests, lint, scanner, provenance all clean. CI+publish+maintenance pipelines functional. |
| 2 | n8n verification compliance | 🟡 Conditional | Mechanical compliance is in. Two strategic concerns (multi-API wrapping, AI-Gateway competition) need handling in the submission *text*, not the package. |
| 3 | Marketplace UX | 🔴 Not ready | The 3 hard blockers from the Pre-Flight all live here. README, package.json description, credential link. |
| 4 | Functional product fit | 🟡 Conditional | Code is solid. Two visibility gaps: AI Tool variant invisible to users; no Cloud install path docs; embeddings architecture inadequately explained. |
| 5 | Error handling & resilience | 🟡 Conditional | Happy path is excellent. Bad-creds-mid-execution and rate-limit surfaces are untested; `loadModels` swallow-and-fallback may mask config-time problems. |
| 6 | Discoverability & positioning | 🟡 Conditional | Forum-post timing decision is correct. Marketplace card competitive read is currently weakest of the four AI gateways. No comparison content in README. |
| 7 | Operations | 🔴 Not ready | NPM_TOKEN expiry imminent (~May 19). No support intake plan. Trusted Publishers migration is hygiene, not blocker. |
| 8 | Telemetry & success metrics | 🔴 Not ready | Nothing instrumented. 30-day success metric undecided. We will not know if launch worked. |

---

## 1. Package quality — ✅ Ready

### Evidence

- **Version:** `0.1.1` published to npm `latest` 2026-05-03 morning. CI publish workflow ran clean (1m17s).
- **Tests:** 62 across 4 suites — `TokenSenseAi.test.ts` (393 lines, covers operation count, resource grouping, auth contract, no-secret-leakage), `TokenSenseChatModel.test.ts` (74 lines), `utils.test.ts` (112 lines, covers `normalizeBaseUrl` edge cases + `buildMetadata` step/execution_id), `TokenSenseApi.credentials.test.ts` (50 lines).
- **Security scanner:** `@n8n/scan-community-package@0.15.0` against published 0.1.1 — passes all checks (per Pre-Flight log; needs live re-verify before submission).
- **Provenance:** SLSA attestation present on npm (verified May 2). Meets May 1 2026 Creator Portal requirement.
- **Dependencies:** **Zero runtime deps.** Only peer deps: `n8n-workflow >=2.13.0 <3.0.0` and `@n8n/ai-node-sdk >=0.7.0 <0.9.0`. This is a major verification advantage — supply-chain attack surface is the smallest of any AI gateway node on n8n.
- **Build pipeline:**
  - `.github/workflows/ci.yml` — runs lint + build + test on every push/PR to main, Node 22.
  - `.github/workflows/publish.yml` — auto-detects dist-tag from version (prerelease → `beta`, stable → `latest`), publishes with `--provenance`, runs build+test before publish. Override input available via `workflow_dispatch`.
  - `.github/workflows/maintenance.yml` — `workflow_dispatch` for `deprecate / undeprecate / dist-tag-add / dist-tag-rm`. Uses `NPM_TOKEN` to bypass account 2FA OTP. Logs registry state after every op.
- **Auth contract:** All ops route through `helpers.httpRequestWithAuthentication`. Tests assert no secret in URL, no manual `x-tokensense-key` or `Authorization` header, and `returnFullResponse: true` on JSON ops (per `test/TokenSenseAi.test.ts:106-152`).
- **Code-quality smell-test:**
  - `shared/utils.ts:20-28` — `normalizeBaseUrl` uses fixed-point loop to strip trailing slashes + `/v1` defensively, despite credential regex blocking `/v1` at input. Defence-in-depth, well-commented.
  - `shared/utils.ts:44-68` — `buildMetadata` populates `source`, `workflow_tag` (with workflow-name fallback), `project`, `provider` (gated by `includeProvider` opt-in), `step` (`getNode().name`), `execution_id` (`getExecutionId()`). The opt-in for `provider` correctly avoids n8n's stale-stored-value gotcha.
  - `nodes/TokenSenseAi/TokenSenseAi.node.ts:21` — `usableAsTool: true` triggers the auto-generated `tokenSenseAiTool` registry entry confirmed in May 2 smoke.
  - `credentials/TokenSenseApi.credentials.ts:24-31` — endpoint regex blocks `/v1` at the property level with a clear `errorMessage` ("Enter the bare origin only..."). API key field is `password: true` (line 38).
  - Test `defines exactly 8 operations` (`test/TokenSenseAi.test.ts:27`) still passes after v0.1.1 resource refactor because operation `value` strings are preserved across the 5 resource buckets — a backward-compatibility win.

### Gaps

- **None blocking.** Two minor cosmetic items:
  - `shared/utils.ts:114` — `loadModels` has a bare `catch {}` that swallows all errors and falls back to `DEFAULT_MODELS`. Good for resilience (UI doesn't break on transient API hiccup), but **masks credential errors at config time** — a user with a bad key sees the static fallback list instead of an error indicating their credential is wrong. See Dimension 5.
  - `package.json` declares `engines.node: ">=22.16"`. n8n Cloud and most self-hosted run Node 22.x by default in 2026, so this is fine, but the strict floor will warn (not error) on older Node 20.x self-hosted installs. Worth verifying once on a stock Node 20 n8n image; if warnings are noisy, loosen to `>=20.9.0` to mirror Dashboard's range. Low priority.

### Verdict: Ready.

**Live re-verification needed before submission:** re-run `npx @n8n/scan-community-package@0.15.0 n8n-nodes-tokensense@0.1.1` (last run was against a pre-publish artifact). 30 seconds, ~zero risk of failure.

---

## 2. n8n verification compliance — 🟡 Conditional

### Evidence

Audited against [verification-guidelines](https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/), [submit-community-nodes](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/), and [ux-guidelines](https://docs.n8n.io/integrations/creating-nodes/build/reference/ux-guidelines/). Audit captured in `n8n Community Node.md` lines 73–82.

**Mechanical pass items:**

- ✅ Package name format (`n8n-nodes-*`)
- ✅ `n8n-community-node-package` keyword in `package.json:6`
- ✅ Nodes + credentials declared in `package.json#n8n` (`package.json:46-55`)
- ✅ `@n8n/node-cli@^0.23.1` (>= required 0.23.0)
- ✅ Built with `n8n-node build`
- ✅ Zero runtime dependencies
- ✅ Zero env-var or filesystem access in node code (grep confirmed)
- ✅ API key field `typeOptions: { password: true }` (`credentials/TokenSenseApi.credentials.ts:38`)
- ✅ SLSA provenance attestation present on npm
- ✅ Title Case display names ("TokenSense AI", "TokenSense Chat Model", "TokenSense API", "Chat Completion", etc.)
- ✅ Boolean descriptions start with "Whether..." (`jsonMode`, `streaming`)
- ✅ English-only copy
- ✅ MIT license, npm/GitHub author match
- ✅ **Resource-operation pattern** lint warning fixed in v0.1.1 — 5 resources (Chat / Image / Embedding / Audio / Model) per `nodes/TokenSenseAi/TokenSenseAi.node.ts:33-107`
- ✅ **`NodeOperationError` UX guideline** fixed in v0.1.1 — `shared/utils.ts:106-110` uses structured `{ description: 'Adjust the model filter expression or remove it...' }` for the only throw site

### Gaps

**Strategic concern A — "Don't wrap multiple unrelated APIs":** verification rules say packages that "wrap multiple unrelated APIs or act as a proxy layer for several services generally don't qualify."

- **Mitigation in submission text:** counter with the OpenRouter Chat Model and Vercel AI Gateway Chat Model precedent — both verified in n8n's registry, both single SaaS that route to multiple LLM providers. TokenSense is structurally identical: one service (`api.tokensense.io`), one credential, one billing surface, one dashboard. Not a proxy of unrelated APIs.
- **Submission text already drafted** in `n8n Community Node.md:88` — preserve verbatim.

**Strategic concern B — "Don't compete with n8n's paid features":** n8n shipped its own AI Gateway in v2.17.0 (April 2026).

- **Mitigation in submission text:** complementary framing — n8n's AI Gateway = credentials management. TokenSense = per-workflow cost tracking, budget enforcement, multi-tenant attribution, execution-level observability. Many users will use both.
- **Submission text already drafted** in `n8n Community Node.md:90` — preserve verbatim.

### Verdict: Conditional.

Mechanical compliance is fully in. The verdict is "conditional" only because the two strategic concerns are real reasons a reviewer could push back, and the mitigation lives in the submission text — not the package. Submission text needs to lead with the precedent (OpenRouter + Vercel) and the complementary framing, not bury them.

**Live re-verification needed before submission:** none for this dimension.

---

## 3. Marketplace UX — 🔴 Not ready

This is where every hard blocker from the May 3 PM Pre-Flight lives.

### Blocker 1 — README lists a sub-node that doesn't exist

**Where:** `README.md:11-15` ("Nodes included" table) + lines 42-44 (Usage: RAG Pipeline section).

**What's wrong:** The table claims a separate `TokenSense Embeddings` sub-node. Live n8n registry (May 2 smoke, `05-tokensense-nodes-registered.json`) shows three entries: `tokenSenseAi` + `tokenSenseChatModel` + `tokenSenseAiTool`. **There is no `TokenSense Embeddings` sub-node.** Embeddings is reachable only via the general node's "Create Embedding" operation (`nodes/TokenSenseAi/TokenSenseAi.node.ts:79-83`, `nodes/TokenSenseAi/TokenSenseAi.node.ts:269-298`).

**Risk:** Reviewer cross-checks README against package contents and flags the discrepancy → submission rejected or held. Or a Cloud user installs, searches "TokenSense Embeddings" in the nodes panel, finds nothing, leaves a 1-star review citing missing functionality.

**Fix:** Replace the "Nodes included" table with the **two-row** version below, and rewrite the "Usage: RAG Pipeline" section to redirect users to the General TokenSense AI node, Resource: Embedding.

```markdown
| Node | Type | Use case |
|------|------|----------|
| **TokenSense Chat Model** | AI Agent sub-node | Attach to any n8n AI Agent as the language model. Tool calling, memory, multi-turn, streaming, structured output. |
| **TokenSense AI** | General-purpose node + AI Agent Tool variant | Chat completions, image generation, embeddings, TTS, transcription, native Anthropic, native Gemini, list models. Surfaces in the AI Agent Tool slot via `usableAsTool: true` for agent-as-tool patterns. |
```

### Blocker 2 — Marketplace card description is engineer-jargony

**Where:** `package.json:4`.

**Current:**
> "n8n community node for TokenSense — unified LLM proxy with cost tracking, multi-provider routing, and project management"

**Why it fails:**
- Wastes the opener on "n8n community node for TokenSense" — declares format, not value. The marketplace card already shows it's a community node.
- "Unified LLM proxy" — "proxy" is engineer language. n8n's audience is non-technical workflow builders.
- "Multi-provider routing" — implementation detail; users care WHAT they get, not HOW.
- "Project management" reads as Asana-adjacent, not cost attribution.

**Suggested rewrite (110 chars, leads with benefit):**
> "Track AI costs per workflow in n8n. Set budgets, see what each workflow spends across OpenAI, Anthropic, Google, and more."

This is what shows next to OpenRouter / Vercel AI Gateway / Cloudflare AI Gateway in the verified marketplace browse view. First impression matters disproportionately.

### Blocker 3 — Credential `documentationUrl` points at GitHub README root

**Where:** `credentials/TokenSenseApi.credentials.ts:11`.

**What's wrong:** When a user opens the credential dialog in n8n, they want to **get an API key** (active job). Sending them to a README full of installation+usage docs is friction at exactly the moment we want zero.

**Fix options (in order of preference):**
1. **Build `tokensense.io/n8n-setup`** — a dedicated 3-step page: "Create account → get API key → paste it here." ~3 hours of work, dramatically better conversion. Pairs with telemetry (Dimension 8) since the page is instrumentable.
2. **Point at `https://app.tokensense.io/keys` directly** — the API key creation page. ~2 minutes of work. Worse UX (drops user into the dashboard mid-flow without context) but functional.
3. **Stopgap to README#setup anchor** — `https://github.com/TheYote12/n8n-nodes-tokensense#setup`. Ugly, but better than the current root.

Decision needed from Carlo (see Strategic Open Decisions §2 below).

### Soft gaps from the Pre-Flight

**S1 — README "Installation" assumes self-hosted n8n** (`README.md:17-22`)
Once verified, n8n Cloud users see TokenSense in their nodes panel via search — no Settings detour. Add a "n8n Cloud (verified)" path: *"Open the nodes panel, search 'TokenSense', click to install."* Self-hosted path stays as a secondary option.

**S2 — No pricing transparency in README**
A curious n8n user has three obvious questions: Is there a free tier? What does it cost? Does my AI bill go UP because TokenSense is in the middle? README answers none. Even one line — *"Free tier includes 10K requests/month. Paid plans from $29/mo. Your AI bill is unchanged — TokenSense doesn't mark up provider rates."* — would reduce bounce significantly.

**S3 — No screenshots in the README**
Verified nodes that convert well in the n8n marketplace have at least one screenshot of (a) the configured node and (b) the resulting dashboard view. Ours has zero. Not a verification blocker, but a conversion gap vs. competitors.

### Other UX observations from this audit

- **Image model dropdown still lists DALL-E 2 and DALL-E 3 marked "Deprecated"** (`nodes/TokenSenseAi/TokenSenseAi.node.ts:222-224`). They should either be removed (cleaner) or the deprecation should be documented (READme footnote / hover description). Currently they're discoverable, selectable, and labelled inconsistently with how the rest of the dropdown is structured. Low priority but cosmetic.
- **Native Anthropic / Native Gemini operations exist as separate selections under Chat resource.** Strategic question (see §4): does this shape the marketplace pitch? "Native" vs OpenAI-compat is a meaningful capability that's currently buried two levels deep in the operation selector. Could be surfaced in README "Features" list to pre-empt the "but does it actually use Anthropic prompt caching" question from sophisticated users.
- **`buildMetadata` opt-in for provider** — well-designed, but `nodes/TokenSenseAi/TokenSenseAi.node.ts:619, 659, 708, 760, 808` (Embedding, TTS, STT, Native Anthropic, Native Gemini) all call `buildMetadata(this, i)` *without* `includeProvider`, even though provider override would be meaningful for the OpenAI-compat path. Audit this — likely intentional (these ops have implicit providers), but worth a one-line comment in `buildMetadata` clarifying the rule.

### Verdict: Not ready.

The 3 hard blockers must land before submission. S1 + S2 should land too — they're under 30 minutes of work combined and they directly affect first-impression conversion. S3 (screenshots) can ship post-verification if needed.

**Live re-verification needed before submission:** render `icons/tokensense.svg` (606 bytes) at n8n's standard 32px and 64px and verify contrast against n8n's panel background light + dark themes. Pre-Flight flagged this as post-launch backlog; fine to defer if visual is OK on inspection.

---

## 4. Functional product fit — 🟡 Conditional

### What's working

- **Three runtime registrations confirmed clean** in n8n 2.16.1 (`05-tokensense-nodes-registered.json`):
  - `tokenSenseAi` (output `main`, AI category, Language Models subcategory)
  - `tokenSenseChatModel` (output `ai_languageModel`, plugs into AI Agent Chat Model slot)
  - `tokenSenseAiTool` (output `ai_tool`, plugs into AI Agent Tool slot — auto-generated from `usableAsTool: true`)
- **Native provider support** via TokenSense proxy: OpenAI native, Anthropic native (`/v1/messages`, PR #98), Gemini native (`/v1beta/models/:model:generateContent`, PR #105), xAI/Mistral/fal via OpenAI-compat.
- **Step + execution_id attribution** (`shared/utils.ts:62-65`) populates `request.body.metadata` automatically via `context.getNode().name` and `context.getExecutionId()`. Confirmed working in Apr 21 smoke (11/11 log rows) and in May 3 morning Logicfox eyeball test (3 successful executions, full attribution).
- **Dynamic model dropdowns** on all nodes, pulling live from `/v1/models` (`shared/utils.ts:86-117`).
- **Resource grouping** (5 resources, 8 operations) preserves operation `value` strings across v0.1.0 → v0.1.1 — no breaking changes for existing user workflows.

### Attribution coverage matrix (re-verified from `n8n Community Node.md:96-103`)

| Feature | Node (self-hosted users) | Base URL/key (Cloud users until verified) |
|---|---|---|
| Per-call cost, tokens, model | ✅ auto | ✅ auto |
| `workflow_tag` (per-workflow grouping) | ✅ auto | ✅ via API-key default OR set per-key |
| `step` (which node burned the money) | ✅ auto | ❌ effectively no |
| `execution_id` (which run an event belonged to) | ✅ auto | ❌ effectively no |
| Native Anthropic, native Gemini | ✅ | ❌ OpenAI-compat only |

**Implication:** until verification ships and Cloud users can install the node from the marketplace, ~50% of the ops-lead ICP gets a measurably reduced product (per-workflow attribution only, not per-step or per-execution). This is the strongest argument for verification urgency.

### Gaps

**G1 — AI Tool variant is invisible to users.**
`tokenSenseAiTool` registers cleanly (May 2 smoke confirmed), but it's never mentioned in the README, the package.json description, or the Pre-Flight nodes table. A user who wants TokenSense as a tool callable by another agent (multi-agent orchestration) would have to discover it by accident in the nodes panel. Strategic open decision (Pre-Flight Q4) leans toward "low-effort yes" — surface it in README + bump the marketplace description if room.

**G2 — Embeddings architecture is poorly explained.**
A user expecting an "Embeddings" sub-node finds nothing under that name. The reason — `@n8n/ai-node-sdk` lacks `supplyEmbeddings`, so embeddings can only ride the general node — is invisible to them. README needs **one paragraph** explaining "embeddings live under TokenSense AI → Resource: Embedding because n8n's AI SDK doesn't yet support a dedicated Embeddings sub-node — full RAG pipelines are supported, just configure them inside the General node." Otherwise the user concludes we don't support embeddings.

**G3 — n8n Cloud install path not documented.**
README's installation section (lines 17-22) is the **unverified self-hosted** path. After verification, Cloud users skip Settings entirely and install via the nodes panel search. Without this documented, half the future audience reads the README and thinks the package isn't available to them. Pre-Flight S1.

**G4 — `--ignore-scripts` install gotcha unverified for n8n's own UI.**
The May 2 smoke required `npm install n8n-nodes-tokensense@0.1.0 --ignore-scripts` because transitive peer-dep `isolated-vm@6.1.2` requires Python+gyp to build. n8n's UI installer should handle this differently (separate install pipeline + n8n bundles its own runtime binding), but **this hasn't been re-verified post-v0.1.1 nor through the verified-marketplace install path**. If n8n Cloud's install pipeline can't resolve `isolated-vm`, install fails silently or loudly — first 1-star review territory. **Action: re-smoke v0.1.1 install via the actual n8n UI on a fresh self-hosted instance, not the raw npm path, before submission.**

**G5 — No streaming Chat Model smoke against v0.1.1 specifically.**
The agent loop streaming + tools + memory smoke from Apr 28 was against `0.1.0-beta.3`. v0.1.1's resource refactor doesn't touch the Chat Model sub-node or `supplyData`, so regression risk is low, but a 5-minute spot-check via n8n UI ("attach Chat Model to AI Agent → run with streaming on → confirm tokens flow") would close the gap before submission.

### Verdict: Conditional.

Code is working; the gaps are documentation/visibility. G1-G3 land naturally in the v0.1.2 README rewrite. G4-G5 are live-test items, not code changes — schedule a 30-minute spot-check session before submission.

---

## 5. Error handling & resilience — 🟡 Conditional

### Evidence

- **Single throw site** in node code: `shared/utils.ts:106-110`, properly converted to `NodeOperationError` in v0.1.1 with structured "Adjust the model filter expression or remove it" description. ✅
- **`continueOnFail` honoured** at `nodes/TokenSenseAi/TokenSenseAi.node.ts:870-874` — error becomes a row in returnData with `{ error: msg }` rather than crashing the workflow.
- **Multipart-form contract** for transcribeAudio is well-commented (`nodes/TokenSenseAi/TokenSenseAi.node.ts:725-733`) — explicit warning not to import `form-data` package because community nodes' `no-restricted-imports` rule blocks it.
- **`returnFullResponse: true` contract** is pinned by tests (`test/TokenSenseAi.test.ts:103-118`) for every JSON op.
- **Credential test** (`credentials/TokenSenseApi.credentials.ts:53-61`) — declarative, hits `/v1/models`, catches obvious bad keys at config time. ✅

### Gaps

**E1 — No handling for invalid API keys mid-execution.**
Grep of `nodes/`, `shared/`, `credentials/` for `401`, `403`, `Unauthorized` returns nothing. Credential test catches obvious bad keys at config time, but mid-workflow key revocation (admin rotates the key, user's already-running workflow keeps firing) surfaces whatever generic error the proxy returns. Recommended: catch 401/403 in the `try` block at `nodes/TokenSenseAi/TokenSenseAi.node.ts:527-877` and re-throw with `NodeOperationError(this.getNode(), 'Your TokenSense API key is invalid or revoked', { description: 'Re-test the credential in Settings → Credentials, or rotate the key in your TokenSense Dashboard.' })`. ~30 min of work, one place to add it (a wrapper around `authRequest`). Pre-Flight S4.

**E2 — No handling for rate-limit or budget-blocked responses.**
Same gap class as E1. TokenSense returns 429 on rate limit, and a structured 402-ish on budget block. Both surface as raw HTTP errors today. User sees "Request failed with status code 429" with no actionable next step. Recommended: catch 429 → "Your TokenSense rate limit has been hit. Wait X seconds or upgrade your plan." Catch 402 / budget-block → "Your TokenSense workflow budget is exhausted. Increase the budget in your TokenSense Dashboard or wait for the period to reset."

**E3 — `loadModels` swallow-and-fallback masks credential errors at config time.**
`shared/utils.ts:114` — bare `catch {}` returns `DEFAULT_MODELS` on any error. Good for resilience (UI doesn't break on transient hiccup). Bad because a user with a wrong endpoint, wrong key, or wrong scheme sees the **static fallback list** instead of a clear error like "Cannot reach TokenSense — check your endpoint and API key." Recommended: differentiate transient errors (5xx, network) from terminal config errors (401, 403, DNS resolution) — return fallback for the former, throw `NodeOperationError` for the latter so the UI shows it.

**E4 — Native Gemini response-headers shape may be brittle.**
`nodes/TokenSenseAi/TokenSenseAi.node.ts:836-849` reads `tokensense` cost/model/request_id from response **headers** (`x-tokensense-request-id`, `x-tokensense-cost`, `x-tokensense-model`) instead of the body envelope used by every other op. If the proxy changes how it returns those values for Gemini, the Native Gemini op silently loses cost attribution. Recommended: confirm with Proxy team that the headers contract is intentional and stable (it likely is, given Gemini's response shape), and add a comment block at line 836 documenting the decision.

### Verdict: Conditional.

Happy path is excellent. Failure-mode UX is the weakest point in the package — these aren't blockers for submission, but they're the most likely source of negative early reviews. E1+E2 should land in v0.1.2 if scope allows; otherwise they're top of the post-verification backlog.

**Live re-verification needed:** none for code. Live error-mode probes (bad creds mid-run, rate limit, budget exhaustion) were explicitly out of scope for this audit per the "review existing artifacts" choice. Schedule a separate 30-minute Docker session before submission to validate user-facing error messages on those three cases.

---

## 6. Discoverability & positioning — 🟡 Conditional

### Competitive landscape (verified marketplace, May 2026)

Four direct competitors in the n8n verified marketplace:

| Competitor | Verified | Architecture | What they emphasize |
|---|---|---|---|
| **OpenRouter Chat Model** | ✅ | Single SaaS routing to 200+ LLMs | Provider breadth, BYOK, model fallback |
| **Vercel AI Gateway Chat Model** | ✅ | Single SaaS routing to multi-provider | Vercel-platform integration, observability |
| **Cloudflare AI Gateway Chat Model** | ✅ | Single SaaS routing + caching | Caching, rate limiting, cost analytics |
| **n8n's own AI Gateway** (v2.17.0+, April 2026) | N/A — built-in | Credentials management primitive | "Bring your own keys, n8n manages routing" |

TokenSense's strongest differentiators against this set:
1. **Per-workflow + per-step + per-execution cost attribution** (no competitor offers all three)
2. **Multi-tenant (workspace-scoped) accounting** — agencies tracking spend across client workflows
3. **Budget enforcement at request time** (most competitors track but don't enforce)
4. **Native provider APIs** (Anthropic Messages, Gemini generateContent) — most competitors are OpenAI-compat only

### Marketplace card competitive read

Today (per `package.json:4`):
> "n8n community node for TokenSense — unified LLM proxy with cost tracking, multi-provider routing, and project management"

Cloudflare AI Gateway: "Use Cloudflare AI Gateway as a Chat Model in your n8n workflows."
Vercel AI Gateway: "Use Vercel AI Gateway as a Chat Model in your n8n workflows."
OpenRouter: "Use OpenRouter as a Chat Model in your n8n workflows."

We're more verbose, less benefit-led, and bury the strongest differentiator (per-workflow attribution). The proposed rewrite (Blocker 2 fix) addresses this directly.

### Gaps

**P1 — README has no positioning context.**
A user landing on the README (whether via the verified marketplace card or via search) doesn't see *why TokenSense vs. the four alternatives*. A 4-row comparison table — TokenSense vs OpenRouter vs Vercel vs Cloudflare — addressing per-workflow attribution, budget enforcement, native APIs, multi-tenant would land in 30 minutes and be defensible (we don't trash competitors, we surface differences). Pre-Flight tracks this as post-launch backlog; recommend pulling forward to v0.1.2 or v0.1.3.

**P2 — Forum-post timing is correctly held.**
Per `n8n Community Node.md:38-42` and Decisions Log, the n8n community forum post is held until verified-status announcement. This is correct — posting before verification splits the launch moment and dilutes the announcement. Keep held.

**P3 — Search visibility for "n8n + AI cost tracking" not yet measured.**
The TokenSense main site has flagship article *How to Track AI API Costs Per Workflow in n8n* (per `Marketing Content Catalogue`), shipped as part of the SEO foundation Apr 18 (PR #145). But there's no current measurement of whether the npm package + the article are co-discoverable. Worth a one-time SERP check ("n8n AI cost tracking", "n8n token usage tracking", "n8n OpenAI cost", "n8n community node OpenAI") before launch — both to baseline and to identify which queries TokenSense + npm + article rank for vs. competitors. 30 min.

### Verdict: Conditional.

Forum-post timing is correctly handled. Marketplace card description is the biggest miss (covered in Blocker 2). README comparison row is a soft gap that should land soon but isn't a submission blocker. Search visibility is a measurement gap, not a content gap.

---

## 7. Operations — 🔴 Not ready

### Evidence

- **CI workflow** (`.github/workflows/ci.yml`) — runs on every push/PR to main: `npm ci → lint → build → test`, Node 22. Cache enabled. ✅
- **Publish workflow** (`.github/workflows/publish.yml`) — fires on any `v*` tag push. Auto-detects dist-tag from version. Uses `--provenance` (SLSA attestation). ✅
- **Maintenance workflow** (`.github/workflows/maintenance.yml`) — `workflow_dispatch` for `deprecate / undeprecate / dist-tag-add / dist-tag-rm`. Uses `NPM_TOKEN`. Logs registry state after every op. ✅
- **NPM_TOKEN expiry:** ~3 weeks from Apr 28 published auth — **due ~May 19, 2026.** (`n8n Community Node.md:119`)

### Gaps

**O1 — NPM_TOKEN expires ~May 19. Publish pipeline breaks if missed.**
This is the operational blocker. If verification submission lands and review takes the expected 1-2 weeks, the v0.1.2 post-verification follow-up (or a hotfix for an issue surfaced during review) would arrive *exactly* in the dead-zone where the token expired and CI publish fails silently or loudly.
- **Option A (recommended):** migrate to **npm Trusted Publishers** (May 2026 recommended publish auth, replaces NPM_TOKEN entirely; OIDC-based; no expiry to manage). ~2 hours of work, sets-and-forgets. Pre-Flight tracked this as "hygiene, not blocker" — re-classify as **launch blocker** because the timing window is bad.
- **Option B:** rotate NPM_TOKEN with a 90-day automation-scoped token. ~15 minutes. Kicks the can.

**O2 — No support intake plan.**
The first n8n Cloud user to install verified TokenSense and hit a bug at 2am their time has nowhere to go except the GitHub issue tracker. We have:
- ✅ `bugs.url` set in `package.json:43-45` to GitHub issues
- ❌ No issue templates (`.github/ISSUE_TEMPLATE/`)
- ❌ No SLA for first response (informal)
- ❌ No on-call rotation (Carlo is the only support surface)
- ❌ No Discord / Slack / forum link in README

**Recommended pre-launch:** add `.github/ISSUE_TEMPLATE/bug_report.md` + `feature_request.md` (15 min), add a "Need help?" section to README pointing at the issue tracker + a TokenSense Dashboard support email + the n8n community forum thread link (when it exists). Document an internal SLA: best-effort 24h first-response weekdays, 48h weekends, for at least the first 30 days post-launch.

**O3 — Local git tag missing for `0.1.0-beta.3`.**
Per `n8n Community Node.md:151` — cosmetic only (the code is correctly published on npm under the right dist-tag). Worth fixing for repo hygiene: `git tag v0.1.0-beta.3 <sha-of-beta3-publish-commit> && git push origin v0.1.0-beta.3`. 2 min.

**O4 — No monitoring on the publish pipeline.**
If `publish.yml` fails — npm transient outage, scanner regression, CI runner change — there's no notification. Recommended: enable GitHub Actions failure email or wire a Slack/Discord webhook into the workflow. 10 min if the channel already exists.

### Verdict: Not ready.

O1 is the launch blocker. O2 is the launch-quality concern. O3 is hygiene. O4 is post-launch hygiene. Sequence: O1 (this week, before submission) → O2 (this week, before submission) → O3 + O4 (post-verification cleanup pass).

---

## 8. Telemetry & success metrics — 🔴 Not ready

### Evidence

- **Marketing site SEO** — sitemap, robots, llms.txt, JSON-LD, canonicals shipped Apr 18 (PR #145). 7 blog posts + 2 landing pages live. 1 flagship article on n8n cost tracking.
- **Cloudflare AI crawler policy** — explicitly allowed via Cloudflare 2026-04-27 (was the root cause of zero AI search visibility before; now unblocked).
- **Dashboard funnel** — TokenSense Dashboard signup flow exists; Stripe billing wired. No instrumentation tying n8n marketplace install → signup → first execution → paid conversion.

### Gaps

**T1 — 30-day post-verification success metric is undecided.**
Without this, we cannot tell if launch worked. Pre-Flight Q3 lists three candidates:
- (a) >50 marketplace installs
- (b) >20 first executions with valid credentials
- (c) >5 free-tier users converting to paid

**My recommendation:** **(b) >20 first executions with valid credentials.** Reasoning: (a) is a vanity metric (install ≠ use). (c) is too sensitive to billing-funnel friction we haven't shipped yet (welcome email sequence is still in Open Questions). (b) is **the true product activation moment** — credential paste + a real workflow run + attribution flowing to dashboard. Set it as the primary; (a) and (c) as secondary. Even better: add a tertiary "(d) >3 marketplace reviews with avg rating ≥4.0" — public signal of perceived quality.

**T2 — Marketplace install → signup attribution unbuilt.**
The proposed `tokensense.io/n8n-setup` page (Blocker 3 fix Option 1) is the natural funnel landing point. Instrument it: `?source=n8n-marketplace` UTM on the credential `documentationUrl`, event capture on "API key copied to clipboard," PostHog or equivalent for the page-to-keys-page-to-first-execution path. ~2-3 hours including the page itself.

**T3 — npm download numbers are not tracked anywhere.**
npm provides public download counts. A simple weekly query (`npm view n8n-nodes-tokensense downloads.last-week`) plotted over time gives launch-curve visibility. Could live as a row on the dashboard's internal-only metrics page or as a scheduled task. 30 min.

**T4 — Google Search Console not yet verified for `tokensense.io`.**
Per `Open Questions.md:39` — "verify tokensense.io ownership, submit sitemap, start baseline tracking. Not done." Without GSC, we can't see organic search traffic to the marketing site, can't measure whether the n8n marketplace listing pulls people through, can't see what queries land on the flagship article. Should land *before* the marketplace listing goes live so the Apr 18 → launch baseline is measured. ~20 min.

**T5 — No marketplace-listing screenshots/reviews tracked.**
Once verified, n8n marketplace pages show install counts, ratings, and reviews. There's no plan to monitor or respond to reviews. Recommended: weekly check during the first 30 days, respond to every review within 48h.

### Verdict: Not ready.

T1 (success metric) blocks "did launch work" judgement. T4 (GSC) blocks "did SEO work" judgement and should land before launch. T2 + T3 + T5 are launch-week instrumentation. None of these block submission, but submitting without T1 + T4 means we won't know what to do post-verification.

---

## Strategic open decisions

The four decisions deferred from the May 3 Pre-Flight, with my recommendation on each so this becomes a sign-off rather than a fresh debate.

### D1 — Submission timing

**Pre-Flight call:** held pending v0.1.2 fixes.
**My read:** correct hold. Half-day delay for clean artifacts beats 1-2 weeks of review with avoidable issues. **No change.**

### D2 — Credential `documentationUrl` target

**Options:**
1. Build `tokensense.io/n8n-setup` 3-step page (~3h, best conversion)
2. Point at `app.tokensense.io/keys` (~2 min, mid)
3. Stopgap to `README#setup` anchor (~30 sec, worst)

**My recommendation: Option 1.** Reasoning:
- The credential dialog is the **single highest-conversion-friction point** in the whole funnel. A tailored 3-step page beats a generic dashboard landing.
- This page is the **natural attribution surface** for measuring whether n8n marketplace installs convert (T2). Without it, we can't tie marketplace traffic to signups.
- Adds 3 hours to v0.1.2 sprint scope, but the 3 hours buy launch-week telemetry that would otherwise take a separate sprint.
- The page is reusable: the same `/n8n-setup` URL can be linked from blog posts, the marketplace card description ("Get started: tokensense.io/n8n-setup"), and the future community forum post.

If 3 hours is too much, fall back to Option 2 — but commit to building the page within 30 days post-verification.

### D3 — 30-day post-verification success metric

**My recommendation: primary = (b) >20 first executions with valid credentials. Secondary = (a) >50 installs, (c) >5 free→paid conversions, (d) ≥4.0 avg marketplace rating from ≥3 reviews.**

Reasoning in §8 T1 above.

### D4 — AI Tool variant marketing

**My recommendation: yes, surface in README + add a one-line mention in the marketplace description if room.**

Reasoning:
- It's a real capability that's invisible today — pure visibility gap, not a feature claim.
- Multi-agent orchestration is a fast-growing pattern; "TokenSense as a callable tool" is a meaningful differentiator vs OpenRouter/Vercel which only offer Chat Model.
- README mention is ~3 lines of text. Marketplace description bump is borderline if we're at 110 chars already.

Suggested README inclusion (in Features list):
> - **Use TokenSense as an AI Agent tool** — the General TokenSense AI node also surfaces in the AI Agent Tool slot, so one agent can call TokenSense as a sub-task while another agent runs as the orchestrator.

---

## Remediation roadmap

Ordered sequence of work to reach "fully ready." Tagged by owner: **CC** = Claude Code dispatch, **C** = Carlo decision, **OPS** = ops/account work.

### Must-fix-pre-submission (target: this week)

| # | Item | Owner | Size | Dimension |
|---|------|-------|------|-----------|
| 1 | Decide D2 (credential URL target) | C | 5 min | §3 / §8 |
| 2 | Decide D3 (success metric) | C | 5 min | §8 |
| 3 | Migrate NPM_TOKEN → Trusted Publishers (or 90-day rotation as fallback) | OPS | 2h / 15 min | §7 O1 |
| 4 | Verify GSC ownership for tokensense.io, submit sitemap | OPS | 20 min | §8 T4 |
| 5 | v0.1.2 sprint: fix Blockers 1+2+3, plus README rewrite covering G1+G2+G3+S1+S2, plus AI Tool variant mention (D4), plus image-model dropdown DALL-E cleanup | CC | 30-45 min | §3, §4 |
| 6 | (If D2 = Option 1) Build `tokensense.io/n8n-setup` page with UTM-instrumented signup CTA | CC | 3h | §3 / §8 |
| 7 | Add `.github/ISSUE_TEMPLATE/bug_report.md` + `feature_request.md` | CC | 15 min | §7 O2 |
| 8 | Add "Need help?" section to README | CC | (folded into #5) | §7 O2 |
| 9 | Re-run `@n8n/scan-community-package@0.15.0 n8n-nodes-tokensense@0.1.1` on the published artifact | OPS | 30 sec | §1 |
| 10 | Live spot-check: install v0.1.2 via n8n UI on a fresh self-hosted instance, verify Chat Model streaming + Tool variant + 5-resource selector renders correctly | OPS | 30 min | §4 G4 + G5 |
| 11 | Live spot-check: error-mode probes (bad creds mid-run, rate limit hit, budget block) — confirm user-facing error quality | OPS | 30 min | §5 |
| 12 | Submit to n8n Creator Portal with submission text from `n8n Community Node.md:88-90` | C | 20 min | §2 |

### Should-fix-pre-submission (if scope allows)

| # | Item | Owner | Size | Dimension |
|---|------|-------|------|-----------|
| 13 | E1+E2: 401/403/429/budget-block error handling in `authRequest` wrapper | CC | 30 min | §5 E1 + E2 |
| 14 | E3: differentiate transient vs terminal errors in `loadModels` | CC | 15 min | §5 E3 |
| 15 | SERP baseline check for "n8n AI cost tracking" + 3 sibling queries | OPS | 30 min | §6 P3 |
| 16 | Local git tag for `v0.1.0-beta.3` (cosmetic) | OPS | 2 min | §7 O3 |

### Post-verification backlog (track for after approval lands)

| # | Item | Owner | Size | Dimension |
|---|------|-------|------|-----------|
| 17 | Add screenshots to README (configured node + dashboard view) | C+CC | 1h | §3 S3 |
| 18 | Loosen `engines.node` to `>=20.9.0` if the 22.16 floor causes user-visible warnings on stock n8n | CC | 5 min | §1 |
| 19 | Comparison row in README: TokenSense vs OpenRouter / Vercel / Cloudflare AI Gateway | CC | 30 min | §6 P1 |
| 20 | Telemetry on n8n-setup page (install → signup → first execution funnel) | CC | 1h | §8 T2 |
| 21 | Weekly npm download tracking on dashboard | CC | 30 min | §8 T3 |
| 22 | Marketplace review monitoring + 48h response SLA for first 30 days | OPS | weekly | §8 T5 |
| 23 | Icon contrast review at 32px + 64px on light + dark themes | OPS | 15 min | §3 |
| 24 | 60-second Loom walkthrough linked from README | C | 1h | §3 (post-launch backlog) |
| 25 | `package.json` `funding` field, sponsor link, contributor guidelines if community grows | C+CC | 15 min | §7 |
| 26 | Audit `provider_override` opt-in coverage in `buildMetadata` callers | CC | 15 min | §3 |
| 27 | Document Native Gemini headers contract (`x-tokensense-*`) in code | CC | 5 min | §5 E4 |

### Time budget

- Path-to-submission (must-fix only): **~6 hours of work + ~10 min of Carlo decisions**, of which ~3 hours is the optional `/n8n-setup` page. Without the page, ~3 hours.
- Path-to-fully-ready: above + **~75 min** of should-fix-pre-submission items.

---

## Evidence appendix

### Files reviewed

**Repo (`n8n-nodes-tokensense/`)**
- `package.json` — version, deps, n8n declaration, engines
- `README.md` — full
- `CHANGELOG.md` — v0.1.1 entry
- `credentials/TokenSenseApi.credentials.ts` — endpoint regex, password field, documentationUrl
- `nodes/TokenSenseAi/TokenSenseAi.node.ts` — full (882 lines), all 8 ops + resource grouping + auth contract + execute()
- `nodes/TokenSenseChatModel/TokenSenseChatModel.node.ts` — full (127 lines), supplyData
- `shared/utils.ts` — full, `normalizeBaseUrl` + `buildMetadata` + `loadModels`
- `.github/workflows/ci.yml`
- `.github/workflows/publish.yml`
- `.github/workflows/maintenance.yml`
- `test/TokenSenseAi.test.ts` (393 lines)
- `test/TokenSenseChatModel.test.ts` (74 lines)
- `test/utils.test.ts` (112 lines)
- `test/TokenSenseApi.credentials.test.ts` (50 lines)
- `docs/plans/sprint-v0.1.1-pre-verification-2026-05-02.md`
- `icons/tokensense.svg` (606 bytes)

**TokenSense vault (private)**
- `n8n Community Node.md`
- `n8n Verification Submission Pre-Flight.md`
- `Open Questions.md`

**Smoke evidence pack (private — local fixtures from May 2 Docker smoke)**
- `00-SMOKE-RESULT.md`
- `02-n8n-boot-logs.txt`
- `03-installed-package.json`
- `05-tokensense-nodes-registered.json`
- `06-tokensense-credentials-registered.json`

### Items NOT verified in this audit (live re-test required)

- `@n8n/scan-community-package@0.15.0` against published v0.1.1 (last run was pre-publish artifact)
- `npm run lint`, `npm run build`, `npm test` against current main
- Fresh Docker smoke against v0.1.1 (May 2 smoke was against v0.1.0)
- n8n UI install path (May 2 smoke used raw `npm install --ignore-scripts`)
- Error-mode probes: bad creds mid-run, rate limit, budget block
- Icon visual at 32/64px on light + dark themes
- Streaming Chat Model + AI Agent + memory + tools loop on v0.1.1

### Live re-test session (recommended ~75 min before submission)

1. Fresh n8n 2.16.1 Docker → install via UI (not CLI) → verify install completes without `--ignore-scripts` workaround
2. Verify all 3 runtime registrations + credential
3. Configure credential, hit Test, see green checkmark
4. AI Agent + TokenSense Chat Model + tools + memory + streaming → run → confirm response streams + tools fire + dashboard logs all 3 attribution fields (step, execution_id, workflow_tag)
5. Bad credential test: revoke key in Dashboard mid-execution → re-run → capture user-facing error message
6. Rate limit test: hammer 100 reqs in 5s on a tier with low limit → capture user-facing message
7. Budget block test: set workflow budget to $0.01, run a request that exceeds it → capture user-facing message
8. Re-run scanner: `npx @n8n/scan-community-package@0.15.0 n8n-nodes-tokensense@0.1.1`

If steps 5-7 surface ugly errors, items 13+14 in the remediation roadmap become must-fix-pre-submission.

---

## Closing notes

The package is in good shape. The gaps are concentrated in three places: surface presentation (README + marketplace description + credential link), operations hygiene (NPM_TOKEN expiry, support intake), and telemetry (success metric, GSC, install→signup attribution). All are fixable in well under a day of focused work.

The strongest argument for moving fast is in §4: until verification ships, ~50% of the ICP gets a measurably reduced product (per-workflow attribution only, not per-step or per-execution, no native APIs). Every week of delay is a week of that gap continuing.

Recommended call: ship v0.1.2, set the success metric, rotate the publish token, run the spot-check, submit. Total path-to-submission: half a day.

---

**Related**

- TokenSense vault: `n8n Community Node` (parent vault note), `n8n Verification Submission Pre-Flight` (May 3 PM review)
- [`docs/plans/sprint-v0.1.1-pre-verification-2026-05-02.md`](../plans/sprint-v0.1.1-pre-verification-2026-05-02.md) — completed sprint
- Dashboard launch-readiness companion pair: [`tokensense` repo PR #208](https://github.com/TheYote12/tokensense/pull/208)
- Verified n8n submission rules: https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/
- Submission portal: https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/
