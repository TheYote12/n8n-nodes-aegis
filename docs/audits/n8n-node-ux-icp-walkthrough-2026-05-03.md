# n8n Node UX — ICP Walkthrough

**Date:** 2026-05-03
**Package:** `n8n-nodes-tokensense@0.1.1`
**Companion to:** [`n8n-node-product-readiness-2026-05-03.md`](./n8n-node-product-readiness-2026-05-03.md)
**Author:** Cowork (audit; not a code-change session)

This doc walks the n8n node experience through each of TokenSense's three ICPs. The goal is to surface UX gaps the readiness audit caught generically but that **hit different audiences differently**, plus features that are invisible to one ICP but would be conversion-critical to another.

ICPs are equally weighted (per April 18 decision). No persona is primary. The walkthroughs are the same length and depth.

The framing standard is the [industry-standard floor](../../../../Library/Application%20Support/Claude/local-agent-mode-sessions/4cbab4fc-df21-434d-8552-062ab8d2f669/637ac021-1e62-48fd-89a7-248fae7f2208/spaces/444bf6a9-a5f0-4a45-a977-8f4d7e4f493e/memory/feedback_industry_standard_floor.md) rule: every "match competitor" recommendation is paired with "exceed competitor."

---

## The three ICPs (compressed)

**ICP 1 — Automation Agencies (2-10 person teams).** Run 5–30 client n8n / Make / Zapier workflows. Bill flat retainers; AI cost is a margin leak. "Project" = client. Buying trigger: surprise AI bill eats margin. Discovery: n8n forums, YouTube, community channels (NOT Google). Daily monitoring of workflows page. Pay $89/mo Agency tier for per-client attribution + budgets + audit trails + client-ready PDFs.

**ICP 2 — In-House Ops Teams (RevOps/BizOps at 20-200 person companies).** Already run n8n internally; AI is now creeping in. "Project" = department. Buying trigger: leadership urgency ("CEO asks why our OpenAI bill tripled"). May convert *faster* than agencies because urgency is external. Daily 5-second "is everything OK?" check. Start at Pro $29/mo, move to Agency for multi-department budgets.

**ICP 3 — Solo Builders / Technical Founders.** Single dev automating own stack. Price-sensitive, self-serve. "Project" = workflow category. Buying trigger: unexpected provider bill. Discovery: Google search. Weekly glance. Free tier → Pro $29/mo when free hits the cap.

**Universal pain across all three:** uncontrolled AI spend on automations. The marketplace card needs to land that pain in five words or less.

---

## The 9-step user journey

The walkthroughs below trace the same nine steps for each ICP. The steps are anchored in actual node behaviour, not idealised UX.

1. **Discovery** — how this person finds the package
2. **Marketplace card** — what `package.json#description` + the marketplace listing tell them
3. **Install** — the act of installing the package into their n8n instance
4. **Credential creation** — clicking "Test" on a fresh credential and getting it green
5. **First workflow build** — adding the node, picking model, running it
6. **First-execution feedback** — what they see in the n8n execution view + the TokenSense Dashboard
7. **Daily / weekly use** — how the node fits their cadence
8. **Failure modes** — what happens when something breaks
9. **Conversion to paid** — what tells them this is worth paying for

---

## ICP 1 walkthrough — Automation Agency

**Persona:** Sam, technical lead at a 6-person agency. Manages 24 active n8n workflows across 8 clients. Bills $2k–$5k retainers. AI nodes mostly OpenAI + Anthropic. Margin worry is the standing item on Monday team calls.

### 1. Discovery
Per ICP profile: agencies do not Google. Sam finds the package via the n8n community forum or YouTube (an automation creator demoing it). Today: zero forum post (correctly held until verified-status). Zero YouTube content. **Discovery surface for ICP 1 is currently nil.**

The forum post timing decision is correct (the post is the verification announcement) but the launch-message *content* needs to be agency-led. A generic "TokenSense is now verified on n8n" post lands flat for Sam. An agency-targeted opener — "If you're billing clients flat retainers but their AI costs are eating your margin, the new TokenSense node lets you tag every AI call with a Client and see margin-per-client in your dashboard" — converts.

### 2. Marketplace card
Sam clicks through to `npmjs.com/package/n8n-nodes-tokensense` or the verified marketplace card. Today's text: *"n8n community node for TokenSense — unified LLM proxy with cost tracking, multi-provider routing, and project management."* Sam reads "project management" as Asana-adjacent. The phrase that would close him in two seconds — "per-client cost attribution" or "tag every AI call with a client" — is missing.

Proposed v0.1.2 description ("Track AI costs per workflow in n8n. Set budgets, see what each workflow spends across OpenAI, Anthropic, Google, and more.") is better but still says *workflow*, not *client*. For Sam, "workflow" is one level too low — he has 24 workflows but cares about 8 clients.

### 3. Install
Trivial once verified. Sam is likely on self-hosted n8n (agencies often run their own n8n on a VPS to avoid Cloud per-execution pricing for agency-scale traffic). Self-hosted path works today via Settings → Community Nodes.

### 4. Credential creation
Sam pastes endpoint + API key. Hits Test. Credential dialog has a "Get help" link (`documentationUrl`) — currently points at the GitHub README root (Blocker 3). Sam doesn't need the help link because he can find his way around — but the agency's *junior team member* he hands the workflow off to does. The proposed `tokensense.io/n8n-setup` page (Strategic Decision D2 Option 1) helps Sam onboard his team, not just himself.

### 5. First workflow build
Sam swaps an existing workflow's OpenAI Chat Model for TokenSense Chat Model. Picks `gpt-4o`. Sets `Project = "Acme Corp"`. Runs. Works.

**Critical UX gap surfaced here:** the `Project` field is **free-text per-node** (`nodes/TokenSenseAi/TokenSenseAi.node.ts:166-176`, `nodes/TokenSenseChatModel/TokenSenseChatModel.node.ts:65-70`). Sam has 24 workflows × 3 AI nodes per workflow = ~72 places to type the client name. Will it be "Acme Corp" or "Acme" or "acme corp" or "AcmeCorp"? When the dashboard groups by project, inconsistent strings split one client into multiple projects. **For agencies this is the single most damaging UX gap in the node** — it directly breaks the dashboard view they're paying $89/mo to use.

Industry standard: free-text tagging fields exist in OpenRouter / Cloudflare AI Gateway / n8n's built-in. Match.
**Exceed:** auto-complete project names from the user's existing TokenSense projects (one extra `loadOptions` call hitting an `/v1/projects` endpoint), or expression-driven auto-derivation (`{{ $workflow.tags.client }}` if the user tags workflows themselves). Either turns 72 typo opportunities into zero.

### 6. First-execution feedback
n8n execution view shows the response JSON, including `cost`, `provider`, `latencyMs`, `requestId`. Sam can right-click the output and see exact cost in USD. **This is excellent and undocumented.** README mentions it nowhere.

Then Sam logs into TokenSense Dashboard and goes to the workflows page. Per memory, "post 20 workflows, page needs filtering/sorting." Sam has 24. He's at the edge of the limit and the dashboard's workflows page is the surface he lives on. This is dashboard-side, not node-side, but the node is the thing piping data into a view that's about to feel cramped — fixing dashboard filtering is on the must-fix list before agency-scale users self-onboard.

### 7. Daily / weekly use
Sam visits the dashboard daily. The node feeds data; he doesn't touch the node again until a new client engagement. His daily question: "Is any client about to blow their budget?" Per-key budgets exist on Pro+ tier (PR #111, Apr 2026). README doesn't mention them. **Surface in v0.1.2 README:** "Set per-client budgets in your dashboard — the node enforces them automatically. A workflow that exceeds the cap returns a clean 402 error so you can route it to email/Slack." Pairs naturally with the error-message fix (E2 in the readiness audit).

Industry standard: budget caps exist on Cloudflare AI Gateway and Helicone. Match.
**Exceed:** per-*client* budgets (multi-tenant accounting), not just per-account. No competitor offers this on n8n.

### 8. Failure modes
Sam's worst night: client's runaway loop at 3am hits the Anthropic API 1,200 times before the provider rate-limits it. Today, with TokenSense in the middle:
- The proxy enforces budget caps → request 1,201 onwards gets blocked. Good.
- The n8n workflow node returns "Request failed with status code 402" — ungeneric error, no actionable next step (Audit Dimension 5 E2).
- Sam wakes up to a workflow stuck in error state with no clue what happened until he checks the dashboard.

For agencies, this is the single most expensive UX gap. The node should catch budget-block 402 and re-throw with: *"Your TokenSense client budget for 'Acme Corp' is exhausted. Increase the budget at app.tokensense.io/billing or wait for the period to reset."* Sam reads that error and knows in 5 seconds: the system worked, no surprise bill, he can call the client in the morning. **This single message reframes a TokenSense incident from "tool broke" to "tool saved me $400."**

### 9. Conversion to paid
Free tier is too small for an agency. Pro tier ($29/mo) is the obvious starting point — but per-key budgets and per-client PDFs require Agency ($89/mo). Sam's path:
1. Installs node, configures one client's workflow, sees per-step costs
2. Opens dashboard, realizes per-client view is exactly what he's missed
3. Tries to set a per-client budget cap → hits Pro paywall → upgrades to Pro
4. Tries to send a client a cost report → hits Agency paywall → upgrades to Agency

The node accelerates step 1; the dashboard handles 2-4. The node README should mention the Agency-tier features (per-client PDF reports, audit trails) explicitly. Today it mentions none. **Add a "Built for agencies" callout in README** with one sentence about per-client billing attribution + a link to the Agency tier page.

### Sam's verdict
Today: install works, attribution works, but the marketplace card doesn't catch his eye, project tagging is fragile at scale, error messages don't tell him "the system saved you," and Agency-tier features are invisible. The node *technically* serves him; it doesn't *land* with him.

---

## ICP 2 walkthrough — In-House Ops Lead

**Persona:** Priya, RevOps lead at a 70-person SaaS. Runs 9 internal n8n workflows: lead enrichment, CRM updates, weekly content drafts. AI nodes added in Q1; Q2 OpenAI bill came in 3.5× expected. CEO asked. Priya needs an answer by Friday.

### 1. Discovery
Priya Googles "n8n track openai cost" → lands on TokenSense flagship article *How to Track AI API Costs Per Workflow in n8n* (PR #145, Apr 18 SEO foundation). Article links to npm package + sign-up. ICP 2 discovery path is functional today, *if* the article ranks.

GSC verification gap (Audit Dimension 8 T4) bites her path: we don't currently know if the article ranks for her queries. Priya's path is unmeasured.

### 2. Marketplace card
Priya is approval-bound. Her IT team requires verified packages. **Verification is the entire blocker for ICP 2** — she can't install on n8n Cloud (where ~50% of mid-sized orgs run n8n) until we ship verified status. The Pre-Flight is right that this elevates verification from marketing moat to product gap.

The proposed v0.1.2 description ("Track AI costs per workflow in n8n. Set budgets...") lands well for her. Maps directly to the CEO question. *Fits her pain in <10 words.* Don't overthink it — for ICP 2 the proposed line is correct.

### 3. Install
Cloud install path. Today: **she literally can't.** Until verification ships. Self-hosted instructions in the README are useless to her — her IT team doesn't allow self-hosted n8n.

This is why the readiness audit's Strategic Concern A and B mitigations are so important: the submission text needs to land first time. Every week of delay is a week Priya can't install.

### 4. Credential creation
Once she can install, she's the user who most needs the `documentationUrl` to be a tailored page. She isn't a developer. She wants:
1. Make an account
2. Get an API key
3. Paste it
4. Done

The proposed `tokensense.io/n8n-setup` page (D2 Option 1) is built for her. Three steps, large screenshots, "copy your API key" button, **and** a link to a 60-second Loom that walks her through the same flow visually. Pairs the page with the post-launch backlog Loom item.

Industry standard: Vercel AI Gateway and Cloudflare AI Gateway both have walk-through pages. Match.
**Exceed:** auto-detect that the user came from n8n marketplace via a `?source=n8n` UTM, skip onboarding noise, take her straight to "create your first key." Vercel doesn't do this; nor does Cloudflare. The page would be cleaner *and* the install→signup attribution would be measurable (Audit T2).

### 5. First workflow build
Priya is often *building new* not migrating. Her first workflow: "Daily content draft using GPT-4o → email to me." She adds TokenSense AI (Chat resource → Chat Completion) directly. Sets `Project = "Marketing"`. Runs. Works.

The 5-resource selector (`Chat / Image / Embedding / Audio / Model` — v0.1.1 refactor at `nodes/TokenSenseAi/TokenSenseAi.node.ts:33-47`) is **better for Priya than for solo builders or agencies**, who tend to use only Chat. Priya's content workflow may also use TTS for podcasts, image generation for newsletter graphics, etc. Browsing by resource feels organized.

### 6. First-execution feedback
Same as Sam: cost in execution JSON. Priya doesn't know to look. README needs the line: *"Every TokenSense response includes the exact cost in USD — visible right in n8n's execution view, no dashboard required."* For Priya specifically, this is **the answer to the CEO question** — she can take a screenshot of an n8n execution view and put a dollar sign on it.

Industry standard: OpenRouter responses include cost. Match.
**Exceed:** include `step` and `execution_id` in the execution view so Priya can answer "this draft cost $0.42 in *this* run from *this* automation" — no other gateway does this. Already implemented at `shared/utils.ts:62-65`. Just needs README surfacing.

### 7. Daily / weekly use
Priya wants 5-second "is everything OK?" answers. Her surface is the dashboard, not the node. But she'd kill for **proactive alerts** — Slack/email when a workflow exceeds threshold, when a budget passes 80%, when error rate spikes. These are dashboard-side features (alert triggers per `Positioning & ICP.md:33`) that the node doesn't surface.

**README addition:** "Configure alerts at app.tokensense.io/alerts to get Slack/email when this workflow's AI spend crosses a threshold." This converts node-installer → daily-active-dashboard-user.

### 8. Failure modes
Priya's failure mode: workflow hits budget, returns generic error, leadership asks "why did it stop?" — and Priya has to dig into logs. Same gap as Sam's, with a different framing for the fix.

For Priya, the budget-block error message should read: *"Your monthly AI budget is exhausted (good — that's what you set it for). Increase it at app.tokensense.io/billing or wait until June 1."* The "good — that's what you set it for" reframe is the difference between Priya filing a Jira ticket and Priya screenshotting the message to her CEO as proof the system is working.

### 9. Conversion to paid
Per-key budgets are on Pro+ ($29). Priya's leadership pre-approved the spend — she'll convert within the first week, often within the first day. ICP 2 is the **fastest converter** of the three. The node's job is just to not get in her way during signup.

The path: install node → run a workflow → see cost → realize free tier is 10K requests → upgrade to Pro on day 1 because the cost of the upgrade is dwarfed by the cost of one runaway workflow.

For Priya, the README's pricing transparency line (Pre-Flight S2) is **conversion-critical** — without it, she can't tell her finance team how much TokenSense costs. *"Free tier includes 10K requests/month. Paid plans from $29/mo. Your AI bill is unchanged — TokenSense doesn't mark up provider rates."* That last clause matters most for Priya: finance hates "another tool that takes a percentage." Knowing TokenSense doesn't is what unblocks the purchase order.

### Priya's verdict
Today: she literally cannot install (until verification). Once she can, the ICP 2 path is the cleanest of the three — direct pain, fast conversion, low friction — *if* the README explains pricing transparency, surfaces the cost-in-execution-view feature, and the budget-block error message is framed as a feature.

---

## ICP 3 walkthrough — Solo Builder

**Persona:** Marcus, indie SaaS founder. Solo dev. Runs 14 personal n8n workflows on a $20/mo VPS. Stack is 70% OpenAI, 30% Anthropic. Stripe receipt last month was $87 for AI; he expected $30. Annoyed, Googling.

### 1. Discovery
Marcus Googles "which of my n8n workflows is using the most openai" → lands on flagship article. Functional path. Same GSC measurement gap.

Marcus may also discover via Reddit (r/n8n, r/AutomateUserOps) or HackerNews if a launch post lands there. Currently no plan for HN/Reddit launch coordination.

### 2. Marketplace card
Marcus is the most price-sensitive of the three. The *first thing he wants to know* is "is there a free tier and will TokenSense charge me on top of OpenAI?" The proposed v0.1.2 description doesn't mention free tier or markup behaviour. **For ICP 3 specifically, the marketplace card should somewhere include "free tier available" or "free for solo devs."**

Tradeoff: the description is 110 chars. Adding "Free tier available" pushes to 130 chars. n8n's verified marketplace card truncates around 120 chars. Decision needed: include in description (slight truncation risk) or rely on README-first-paragraph to carry it. Recommend: lead README first paragraph with one line about pricing. Pre-Flight S2 already covers this — for ICP 3, **bump it to must-fix-pre-submission**, not soft-gap.

### 3. Install
Marcus is self-hosted. Audit Dimension 4 G4 — `--ignore-scripts` install gotcha — bites him hardest. If `npm install n8n-nodes-tokensense` on his VPS errors out with cryptic Python+gyp warnings about `isolated-vm@6.1.2`, he bounces. He doesn't have a teammate to ask.

Today: this is unverified for the n8n-UI install path on a stock VPS. Audit recommends a 30-min spot-check session.

Industry standard: zero competitors require build-script workarounds. Match.
**Exceed:** documented "n8n self-hosted on Ubuntu / Debian / Docker" install path in README — explicit screenshots, troubleshooting section ("if you see ENOENT python errors, see this section"). Pre-empts the bounce.

### 4. Credential creation
Marcus is alone. The `documentationUrl` blocker hits him hardest. **He has no team.** If the credential help link sends him to a README full of installation he's already done, he gets confused, doesn't know where his API key is, gives up.

The proposed `/n8n-setup` page is most valuable for Marcus. ICP 1 needs it for handoff; ICP 2 needs it for signup-without-noise; ICP 3 needs it because **he has no fallback support channel.**

### 5. First workflow build
Marcus's killer use case: "Compare GPT-4o-mini vs Claude Haiku 3.5 vs Gemini 2.0 Flash for my classifier — which is cheapest at acceptable quality?" The Provider Override field (`nodes/TokenSenseAi/TokenSenseAi.node.ts:189-204`) is **gold for ICP 3** and **invisible in the README**.

README should have a "Use case: A/B test providers without rewriting your workflow" section showing the same workflow running with three different `providerOverride` values, with the resulting cost-per-request comparison from the dashboard. This is **the single most ICP-3-specific feature in the package** and it's currently buried as an implementation detail.

Industry standard: OpenRouter offers provider routing but ties it to model choice. Match.
**Exceed:** TokenSense's `providerOverride` lets the user *override* the routing for any compatible model and see the cost difference instantly. Pair with the per-step attribution view in the dashboard, and Marcus has a comparison tool no one else offers on n8n.

### 6. First-execution feedback
Same as Sam and Priya: cost in execution JSON. For Marcus specifically, the execution view IS his feedback surface — he doesn't visit dashboards weekly. He scans his n8n executions, sees `cost: 0.0042` next to each AI call, mentally adds them up, learns which workflows are expensive.

The dashboard's job for Marcus is the **monthly summary** — one glance per month at "where did $87 go?" Workflow-level cost view solves this. Per-step view is overkill for him.

### 7. Daily / weekly use
Weekly glance. The node is invisible to Marcus most of the week — it just runs. README should not pretend Marcus needs to babysit anything.

### 8. Failure modes
Marcus's worst case: he installs the node, the credential test passes (because the static `DEFAULT_MODELS` fallback in `shared/utils.ts:114` works even when his actual key is wrong), he builds a workflow, it runs and *uses the model he picked from the static list*, but the **provider override silently doesn't apply** because the credential isn't really validated. Hours of debugging.

This is Audit E3 — the swallow-and-fallback pattern. For Marcus this is the most damaging single bug class. The fix (differentiate transient errors from terminal config errors) is 15 minutes of work and eliminates an entire category of "is my credential actually working?" frustration. **For ICP 3, recommend bumping E3 from should-fix-pre-submission to must-fix-pre-submission.**

Industry standard: Cloudflare AI Gateway has explicit credential validation messages. Match.
**Exceed:** in addition to fixing E3, surface a "Last successful call: 2 minutes ago" indicator somewhere in the credential dialog. Reassures Marcus the credential is alive.

### 9. Conversion to paid
Marcus has the longest free→paid lifecycle. He'll happily live on free tier for months. He converts when:
1. Free tier 10K requests cap hits (could be week 2 or month 6)
2. He realizes per-key budgets would let him cap his own personal spend on cost-runaway experiments
3. He wants to add n8n alerts on cost spikes

For Marcus, the **conversion message is "stop yourself before you spend"**, not "track for clients" or "answer the CEO." README should not bury this — *"Set a hard $20/mo cap on your own AI spending — TokenSense enforces it server-side, even if your code has a bug that loops."* Reframes Pro tier from "tool I pay for" to "spending insurance I pay for."

### Marcus's verdict
Today: install gotcha could bounce him, swallow-and-fallback could waste hours, provider-override use case is buried, pricing transparency is missing, and the conversion message isn't tuned to his pain. ICP 3 has the lowest tolerance for friction and the most ICP-specific upside if friction is removed.

---

## Differential gap matrix

UX gaps from the readiness audit, scored by which ICP they hit hardest. ★★★ = severe; ★★ = moderate; ★ = mild; — = not applicable.

| Gap (audit ref) | ICP 1 Agency | ICP 2 Ops | ICP 3 Solo | One-line read |
|---|---|---|---|---|
| Verification not yet shipped (§4) | ★★ | ★★★ | ★★ | ICP 2 cannot install at all on n8n Cloud; ICPs 1 + 3 are mostly self-hosted |
| README lists nonexistent Embeddings sub-node (Blocker 1) | ★ | ★ | ★★★ | Solo builder hits this most — alone, no fallback to ask |
| Marketplace card description (Blocker 2) | ★★★ | ★ | ★★ | Agency conversion line ("client billing attribution") is missing; Ops is fine with proposed rewrite; Solo wants free-tier mention |
| Credential `documentationUrl` (Blocker 3) | ★★ | ★★★ | ★★★ | Hits non-developer Ops + alone-Solo hardest; Agency has team to backstop |
| Free-text `Project` field (§3 *new*) | ★★★ | ★ | — | **Single biggest agency UX gap.** 24 workflows × 3 nodes = 72 typo opportunities. Breaks dashboard attribution. |
| Bad-creds mid-execution silent error (E1) | ★★ | ★★ | ★★ | Affects all three; Agency notices via runaway, Ops via budget alert, Solo via mystery debugging |
| Rate limit / budget-block ungeneric error (E2) | ★★★ | ★★★ | ★ | **Reframe these as feature signals**, not failures, for ICPs 1 + 2; Solo experiences them less |
| `loadModels` swallow-and-fallback (E3) | ★ | ★ | ★★★ | Solo builder has no teammate to debug with; static fallback masks credential errors |
| AI Tool variant invisible (G1) | ★★ | ★ | ★★ | Multi-agent orchestration use case applies to ICPs 1 + 3; Ops less likely to use today |
| n8n Cloud install path docs missing (G3) | ★ | ★★★ | — | Ops is the only mostly-Cloud audience; Agencies/Solo run self-hosted |
| `--ignore-scripts` install gotcha (G4) | ★ | — | ★★★ | Solo on a VPS, alone — bounces silently; Ops on Cloud (n8n handles it); Agency has team |
| Provider Override use case buried | ★ | ★ | ★★★ | **Highest-leverage ICP-3 feature** — A/B providers without rewriting; agencies/ops use it less |
| Pricing transparency missing (S2) | ★ | ★★★ | ★★★ | Ops needs it for finance approval; Solo needs it to know free tier exists |
| Per-client / per-project budget visibility | ★★★ | ★ | ★ | Agency-tier feature; node README should mention; Ops needs single budget; Solo needs personal cap |
| Per-client PDF reports invisible | ★★★ | — | — | Agency-only feature (justifies Agency tier); README never mentions |
| Real-time alerts not surfaced from node | ★ | ★★★ | — | Ops-team essential for daily 5-sec check; Agency uses dashboard; Solo doesn't need |
| Cost-in-execution-view feature undocumented | ★★ | ★★★ | ★★★ | All three benefit; Ops + Solo benefit *most* (they live in n8n, not dashboard) |
| No screenshots in README (S3) | ★ | ★★ | ★★★ | Solo's lowest tolerance for ambiguity |

**Read of the matrix:** the universal blockers (verification, README rewrite, credential URL, marketplace description) help all three ICPs. The differential gaps are: **agencies need consistent project tagging + per-client framing**, **ops teams need install-path-docs + alert surfacing**, **solo builders need credential robustness + provider-override visibility + free-tier transparency**.

---

## ICP-aware recommendations (matches and exceeds)

For each ICP, the changes that turn the package from "works for them" into "lands for them." Each pairs an industry-standard match with a concrete way to exceed.

### Agency-specific

**A1. `Project` field as a `loadOptions` dropdown, not free text.**
Code change: `nodes/TokenSenseAi/TokenSenseAi.node.ts:166-176` and `nodes/TokenSenseChatModel/TokenSenseChatModel.node.ts:65-70` — change `type: 'string'` to `type: 'options'`, add `typeOptions: { loadOptionsMethod: 'getProjects' }`. Add `getProjects` method calling `/v1/projects` (proxy endpoint exists if memory serves; verify or add).
*Match:* Cloudflare AI Gateway, Vercel both offer tag dropdowns.
*Exceed:* fall back gracefully to text input via "expression" mode for users who want template-driven tagging (`{{ $workflow.tags.client }}`). Best of both worlds — typo-proof for the common case, dynamic for the advanced.
**Hardness:** ~1h Claude Code; needs proxy endpoint confirmation.

**A2. README "Built for agencies" callout.**
Two-paragraph section in README under "Use cases":
- Per-client cost attribution: *"Tag every AI call with a Client. See margin per client. Set per-client budgets that hard-stop at the cap."*
- Client reporting: *"Export client-ready PDF cost reports from your TokenSense Dashboard. Audit trails included on Agency tier."*
*Match:* OpenRouter has team/org docs.
*Exceed:* link to a *real* example PDF from the dashboard. Visual proof beats marketing copy.

**A3. Forum-post launch message agency-led.**
Lock the verification-announcement copy now. Lead with: *"If you bill clients flat retainers but their AI workflows are eating your margin..."* — then verification status, then features. Save the generic version for blog/newsletter announcements; the **forum** post earns its keep by speaking to the community member who's burned.
*Match:* every gateway posts a launch announcement.
*Exceed:* pair the post with a 90-second YouTube demo on a single client billing scenario. Agencies are video-discovery-driven per ICP profile.

### Ops-team-specific

**B1. Verification submission is the entire ICP-2 unblocker.**
Already covered in audit. No new content; treat as "the work that has to happen before any other ICP-2 work lands."

**B2. README "Built for in-house ops" callout.**
*"Already running n8n internally? Add TokenSense to answer 'why did our OpenAI bill triple this month?' in five seconds. Per-department cost views. Slack/email alerts when budgets hit thresholds."*
*Match:* Cloudflare AI Gateway has team views.
*Exceed:* embed a 30-second Loom in the README showing the **CEO question → dashboard answer** flow. Sales asset, repurposable.

**B3. Surface the cost-in-execution-view feature in README.**
*"Every TokenSense response includes the exact cost in USD — visible right in n8n's execution view. No dashboard switch required for the daily 'how much did this cost?' question."*
*Match:* OpenRouter shows cost in response.
*Exceed:* TokenSense's response includes `step` and `execution_id`, so the question becomes "how much did *this run* of *this step* cost?" Already implemented. Just document it.

**B4. README pricing transparency line (must-fix for ICP 2).**
*"Free tier: 10K requests/month. Paid plans from $29/mo. **TokenSense does not mark up provider rates** — your OpenAI/Anthropic bill is unchanged."*
*Match:* every gateway has a pricing page.
*Exceed:* the "no markup" line directly addresses the ops-finance objection. No competitor says this on their marketplace card / README.

**B5. Reframe budget-block 402 error.**
The error message should sound like a feature win, not a failure. From E2 in the readiness audit, but with ICP-2 framing:
*"Your monthly AI budget cap is hit — exactly what you configured. Increase the cap at app.tokensense.io/billing, raise the per-workflow limit, or wait until [reset date]."*
**Hardness:** ~30 min Claude Code, single wrapper around `authRequest`.

### Solo-builder-specific

**C1. Fix `loadModels` swallow-and-fallback (bump E3 to must-fix).**
Differentiate 401/403 from 5xx — throw `NodeOperationError` for terminal config errors, return fallback only for transient. Today's silent-fallback wastes solo builder time disproportionately.
*Match:* Cloudflare AI Gateway shows credential errors.
*Exceed:* the `NodeOperationError` description should include the exact diagnostic — *"TokenSense returned 401 Unauthorized when loading models. Check that your API key in this credential matches a key shown at app.tokensense.io/keys, and that the endpoint is `https://api.tokensense.io` (no `/v1` suffix)."*
**Hardness:** ~15 min.

**C2. README "Use case: A/B test providers without rewriting your workflow."**
Highlight `providerOverride` field. Show a single-workflow screenshot with three runs at three providers. Pair with "result: 4x cost difference, 15% latency difference" callout box.
*Match:* OpenRouter offers provider routing.
*Exceed:* TokenSense lets the user override per-call and see cost-per-step in the dashboard. No competitor offers per-call override + per-step cost on n8n.
**Hardness:** README addition; ~15 min.

**C3. Document the n8n self-hosted install path with troubleshooting.**
README section: *"Installing on self-hosted n8n (Ubuntu / Debian / Docker)"* with screenshots of the Settings → Community Nodes flow + a troubleshooting block: *"If you see 'ENOENT python' or 'gyp ERR' errors during install, see [this section]."*
*Match:* every n8n community node has install docs.
*Exceed:* explicit troubleshooting for the `isolated-vm@6.1.2` peer-dep build issue. Pre-empts the bounce.
**Hardness:** README addition; ~30 min.

**C4. Marketplace card or README first paragraph mentions free tier.**
Recommend README first paragraph (less character-pressure than the marketplace card). One sentence: *"Free for up to 10K requests/month — try it on your own automations before you commit."*
**Hardness:** README addition; ~5 min.

**C5. "Last successful call" indicator in credential dialog.**
Surface the result of the most recent successful credential test in the credential UI. Reassures the solo builder that the credential is alive without forcing him to re-test.
*Match:* nothing standard.
*Exceed:* this is post-launch backlog, but it's a meaningful trust signal.
**Hardness:** moderate (~2h, requires storing test result somewhere accessible to the credential dialog). Defer to post-verification.

---

## Suggested re-prioritization of the readiness audit's roadmap

The original audit's must-fix list is correct, but the ICP lens shifts a few items. Recommendations:

**Bump from "should-fix" to "must-fix-pre-submission":**
- **E3** (swallow-and-fallback in `loadModels`) — ICP 3 critical. Adds 15 min to v0.1.2 sprint.
- **E2** (rate-limit / budget-block error reframe) — ICPs 1 + 2 critical. Adds 30 min to v0.1.2 sprint.
- **README pricing transparency line** (was Pre-Flight S2) — ICPs 2 + 3 critical. Adds 5 min.

**Bump from "post-verification backlog" to "should-fix-pre-submission":**
- **A1** (`Project` field as dropdown) — biggest agency UX gap. ~1h. Pairs naturally with the v0.1.2 README rewrite. Whether it lands in v0.1.2 or v0.1.3 depends on whether `/v1/projects` proxy endpoint exists; verify before sprint dispatch.
- **C2** (provider A/B README section) — ~15 min, biggest invisible-feature win for ICP 3.
- **B3** (cost-in-execution-view feature surfaced) — ~5 min README addition, conversion lift for ICPs 2 + 3.
- **A2 / B2** (Built for agencies / ops callouts in README) — ~15 min combined, makes README ICP-equally-weighted vs today's generic framing.

**Add as new must-fix-pre-submission:**
- Lock forum-post launch copy with agency-led opener — A3. ~30 min. Doesn't change the package, changes the launch narrative.

**Stays where it is:**
- Verification submission, NPM_TOKEN rotation, GSC verification, success metric decision, screenshots, comparison row, error-mode live probes — all already correctly tiered.

### Updated v0.1.2 sprint shape

If all the above bumped items land, the v0.1.2 sprint becomes:

| Item | Source | Size |
|---|---|---|
| README rewrite (Blockers 1+S1+S2 + AI Tool + agency callout + ops callout + cost-in-view + provider A/B + self-hosted install w/ troubleshooting) | Audit + ICP doc | ~60 min |
| `package.json` description rewrite (Blocker 2) | Audit | 5 min |
| Credential `documentationUrl` change (Blocker 3) | Audit + D2 | 5 min (or 3h if building `/n8n-setup` page) |
| `loadModels` E3 fix (transient vs terminal errors) | Audit + ICP | 15 min |
| `authRequest` wrapper for 401/403/429/budget-block error reframes (E1+E2) | Audit + ICP | 30 min |
| `Project` field as dropdown via `loadOptions` (A1) — *if* `/v1/projects` exists | ICP | 1h |
| Version bump, CHANGELOG, sprint plan, lint clean, tests passing | standard | 15 min |

**Total v0.1.2 with all ICP bumps: ~3 hours** (excluding optional `/n8n-setup` page). With the page: ~6 hours. **Without `Project` dropdown if endpoint doesn't exist: ~2 hours.** Defer `Project` dropdown to v0.1.3 if proxy work is required.

This is still well under a day. The ICP lens didn't add scope — it added *aim*.

---

## What this doc isn't

- Not a list of features to build for each ICP — those already exist (per-client budgets, alerts, PDFs are dashboard-side, shipped).
- Not a separate sprint — every recommendation here folds into v0.1.2 / v0.1.3, not a new initiative.
- Not a ranking of ICPs — equally weighted throughout, per the April 18 decision and the no-primary-ICP rule.

---

## Closing note

Today's node serves all three ICPs technically — install works, attribution works, dashboards populate. Where it underperforms is in **landing**: the marketplace card doesn't catch any of the three pains; the README is generically pitched and uses the word "proxy"; the failure modes don't reframe themselves as feature wins; the provider-override and cost-in-execution-view features are buried; the project field is fragile at agency scale.

The fixes are small, surgical, mostly in README + one wrapper file + one field-type change. None require architectural work. The combined ICP lift from a ~3-hour v0.1.2 sprint is greater than any individual readiness-audit item would suggest, because the gaps compound: a agency-led forum post that links to a README with per-client framing that links to a `/n8n-setup` page that hands off to a dashboard with consistent project names that supports per-client budgets that surface as feature-positive errors in n8n executions — that's the chain. Today, it breaks at every link.

---

**Related**

- [`n8n-node-product-readiness-2026-05-03.md`](./n8n-node-product-readiness-2026-05-03.md) — the underlying readiness audit
- [`Positioning & ICP.md`](../../../../SecondBrain/01%20Projects/TokenSense/Positioning%20%26%20ICP.md) — locked positioning
- [`ICP Readiness Audit Findings.md`](../../../../SecondBrain/01%20Projects/TokenSense/ICP%20Readiness%20Audit%20Findings.md) — April audit, 5/6 resolved
- [`n8n Verification Submission Pre-Flight.md`](../../../../SecondBrain/01%20Projects/TokenSense/n8n%20Verification%20Submission%20Pre-Flight.md) — May 3 PM review
