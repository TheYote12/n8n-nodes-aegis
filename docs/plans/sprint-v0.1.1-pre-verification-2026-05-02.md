# Sprint v0.1.1 — Pre-verification polish

> **Date:** 2026-05-02
> **Branch:** `claude/v0.1.1-pre-verification-4e6e60`
> **Version:** `0.1.1`

## Goal

Land two surgical fixes so the package is fully compliant with n8n's verification and UX guidelines before Creator Portal submission.

## Context

A compliance audit (May 2, 2026) against the [n8n verification guidelines](https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/) and [UX guidelines](https://docs.n8n.io/integrations/creating-nodes/build/reference/ux-guidelines/) found two remaining issues after `@n8n/scan-community-package@0.15.0` passed all security checks:

1. **`npm run lint` warning:** `@n8n/community-nodes/resource-operation-pattern` — 8 operations without resource grouping (threshold: >5 requires resources).
2. **UX guideline violation:** `shared/utils.ts` used raw `throw new Error()` instead of `NodeOperationError`.

## Fixes

### 1. Resource grouping (`TokenSenseAi.node.ts`)

**Before:** Single flat `operation` selector with 8 options.

**After:** 5 resources, each with a scoped operation block:

| Resource | Operations |
|---|---|
| Chat (`chat`) | Chat Completion, Native Anthropic, Native Gemini |
| Image (`image`) | Generate Image |
| Embedding (`embedding`) | Create Embedding |
| Audio (`audio`) | Text to Speech, Transcribe Audio |
| Model (`models`) | List Models |

All operation `value` strings are preserved — no breaking changes for existing workflows. Every parameter's `displayOptions` was updated to include the corresponding `resource` filter.

### 2. `NodeOperationError` (`shared/utils.ts`)

**Before:** `throw new Error('No models matched filter')`

**After:**
```ts
throw new NodeOperationError(
  this.getNode(),
  'No models matched filter',
  { description: 'Adjust the model filter expression or remove it to see all available models' },
);
```

Imported `NodeOperationError` from `n8n-workflow`. The function already has `this: ILoadOptionsFunctions` context, so `this.getNode()` is available.

## Version bump

`package.json` version: `0.1.0` → `0.1.1`

## Acceptance criteria

| Check | Expected |
|---|---|
| `npm run lint` | 0 warnings, 0 errors |
| `npm test` | All tests passing (62 tests, 4 suites) |
| `npx @n8n/scan-community-package n8n-nodes-tokensense` | Passes all security checks |
| `grep -rn "throw new Error" nodes/ shared/ credentials/` | No results |
| Operation values unchanged | Backwards-compatible |

## Evidence trail

- Lint autofix applied for `node-param-resource-with-plural-option` (Models → Model display name) and `node-param-operation-option-action-miscased` (action strings to sentence case).
- Tests updated: `getOperationValues` helper now collects operations across all 5 resource-scoped blocks; new test asserts 5 resources exist.
