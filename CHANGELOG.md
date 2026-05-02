# Changelog

## 0.1.1 — 2026-05-02

### Fixed
- **Lint:** `TokenSenseAi` node operations are now grouped under 5 resources (Chat, Image, Embedding, Audio, Models) to satisfy n8n's `resource-operation-pattern` UX guideline. No breaking changes — operation values are preserved.
- **Errors:** Replaced raw `throw new Error()` in `shared/utils.ts` with `NodeOperationError` per n8n's error UX guidelines (provides structured "what happened" + "how to fix").

### Notes
- Pre-verification polish ahead of n8n Creator Portal submission.
- All `@n8n/scan-community-package@0.15.0` security checks pass.
