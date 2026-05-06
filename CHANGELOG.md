# Changelog

## v0.1.2 — 2026-05-06

### Marketplace readiness (pre-Creator Portal submission)

- **README:** Remove incorrect "TokenSense Embeddings" sub-node listing — embeddings is a Create Embedding operation on the general node, not a separate sub-node
- **README:** Rewrite description for marketplace clarity — plain language, pricing transparency, AI Tool variant and provider comparison sections added
- **Credentials:** `documentationUrl` now points to `https://tokensense.io/docs/integrations/n8n/setup` instead of GitHub repo
- **No code changes** to node logic — all 62 tests still pass, zero runtime dependency changes

## 0.1.1 — 2026-05-02

### Fixed
- **Lint:** `TokenSenseAi` node operations are now grouped under 5 resources (Chat, Image, Embedding, Audio, Models) to satisfy n8n's `resource-operation-pattern` UX guideline. No breaking changes — operation values are preserved.
- **Errors:** Replaced raw `throw new Error()` in `shared/utils.ts` with `NodeOperationError` per n8n's error UX guidelines (provides structured "what happened" + "how to fix").

### Notes
- Pre-verification polish ahead of n8n Creator Portal submission.
- All `@n8n/scan-community-package@0.15.0` security checks pass.
