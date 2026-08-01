# Handoff: GitHub registry resolution for shadcn-vue

**Goal.** Make this work in `shadcn-vue`, with no configuration:

```bash
npx shadcn-vue@latest add peter-lewis/lifeline/personal
```

It already works in the React CLI (`npx shadcn add evilrabbit/lifeline/personal`).
This document is everything needed to open the issue and write the PR.

- **Target repo:** <https://github.com/unovue/shadcn-vue>
- **Reference implementation:** <https://github.com/shadcn-ui/ui> (`packages/shadcn`)
- **Versions at time of writing:** `shadcn` 4.16.1, `shadcn-vue` 2.8.1

---

## 1. What the React CLI actually does

Verified by inspecting the published `shadcn@4.16.1` bundle and the
`shadcn-ui/ui` source. A bare `owner/repo/item` specifier is resolved by
fetching a **root `registry.json` over `raw.githubusercontent.com`**, then
looking up the named item inside it. The bundle carries the giveaway error
string:

> `raw.githubusercontent.com did not return a root registry.json file. Check that the public repository has …`

Two source files carry the work, and **shadcn-vue has no equivalent of
either**:

| Concern | React (`packages/shadcn/src/registry/`) | shadcn-vue (`packages/cli/src/registry/`) |
| --- | --- | --- |
| Parse a specifier | `address.ts` (182 lines) + `address.test.ts` | `parser.ts` (24 lines) |
| Fetch from GitHub | `github.ts` (307 lines) + `github.test.ts` | **missing** |
| Resolve a git ref | `github-ref.ts` + `github-ref.test.ts` | **missing** |
| Build URLs / fetch | `resolver.ts`, `fetcher.ts` | `resolver.ts`, `fetcher.ts` |

Notable constants in React's `github.ts`:

```ts
const GITHUB_RAW_URL = "https://raw.githubusercontent.com"
const GITHUB_VALIDATION_CONCURRENCY = 8
```

and its exported surface — a useful shape to mirror:

```ts
export async function fetchGitHubRegistryItem(...)
export async function fetchGitHubRegistryCatalog(...)
export async function validateGitHubRegistrySource(...)
```

React's `address.ts` validates owner and repo strictly before it will
touch the network:

```ts
const GITHUB_OWNER_PATTERN = /^(?!.*--)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/
const GITHUB_REPO_PATTERN  = /^[a-zA-Z0-9._-]+$/
const INVALID_GITHUB_REPO_NAMES = new Set([".", ".."])
const CONTROL_CHARACTER_PATTERN = /[\x00-\x1F\x7F]/
```

with helpers `resolveItemAddress`, `isGitHubItemAddress`,
`resolveGitHubRegistrySource`, `isGitHubRegistrySource`, `isValidGitHubRef`.

## 2. Where shadcn-vue stands today

`packages/cli/src/registry/parser.ts` is the whole specifier parser, and it
recognises exactly one non-URL form — `@namespace/item`:

```ts
const REGISTRY_PATTERN = /^(@[a-z0-9](?:[\w-]*[a-z0-9])?)\/(.+)$/i

export function parseRegistryAndItemFromString(name: string) {
  if (!name.startsWith("@")) {
    return { registry: null, item: name }
  }
  const match = name.match(REGISTRY_PATTERN)
  if (match) return { registry: match[1], item: match[2] }
  return { registry: null, item: name }
}
```

Anything without a leading `@` falls through as a bare item name and is
looked up in the default shadcn-vue registry — which is why
`peter-lewis/lifeline/personal` fails today rather than resolving.

Namespaced registries **do** already work, and are the current workaround
(see §6). The gap is specifically the zero-configuration GitHub form.

## 3. Proposed behaviour

Accept a third specifier shape alongside the existing two:

| Form | Resolution |
| --- | --- |
| `https://…/r/item.json` | fetch directly *(exists)* |
| `@ns/item` | look `@ns` up in `components.json` → `registries` *(exists)* |
| `owner/repo/item` | **new** — GitHub |
| `owner/repo/path/to/item` | **new** — item in a subdirectory registry |
| `owner/repo@ref/item` | **new** — pin a branch, tag, or SHA |

Algorithm for the new form:

1. Reject early on the owner/repo patterns above. Never fetch on a
   malformed specifier.
2. Resolve the ref: explicit `@ref` if given, else the repository's default
   branch. **Do not hardcode `main`** — plenty of registries still sit on
   `master`, and a wrong guess produces a confusing 404.
3. `GET https://raw.githubusercontent.com/{owner}/{repo}/{ref}/registry.json`
4. Parse against the existing `registrySchema`, find `items[].name === item`.
5. Resolve that item's files. Each `files[].path` is repo-relative, so it
   fetches from the same raw base.
6. `registryDependencies` may be absolute URLs (this is what both
   `evilrabbit/lifeline` and `peter-lewis/lifeline` do) — hand those to the
   existing resolver untouched. Bare names should resolve within the same
   repo.

## 4. Suggested shape of the PR

Keep it close to the reference so it is easy to review and to keep in sync:

1. **`packages/cli/src/registry/parser.ts`** — extend to classify GitHub
   addresses. Consider splitting into an `address.ts` mirroring React's,
   since `parser.ts` is only 24 lines and will roughly quadruple.
2. **`packages/cli/src/registry/github.ts`** *(new)* — `fetchGitHubRegistryItem`,
   `fetchGitHubRegistryCatalog`, `validateGitHubRegistrySource`.
3. **`packages/cli/src/registry/github-ref.ts`** *(new)* — default-branch
   lookup and ref validation, with caching.
4. **`resolver.ts`** — route GitHub addresses in
   `resolveRegistryItemsFromRegistries` / `fetchRegistryItems`.
5. **`namespaces.ts`** — `resolveRegistryNamespaces` walks
   `registryDependencies` to discover namespaces; make sure a GitHub
   address is not mistaken for an unconfigured namespace and does not
   raise `RegistryNotConfiguredError`.
6. **Tests** — port `address.test.ts` and `github.test.ts` from the React
   repo. They already encode the edge cases.
7. **Docs** — `apps/www` registry documentation.

## 5. Edge cases worth getting right

- **Private repos.** `raw.githubusercontent.com` will not serve them. Fail
  with a message that says so, rather than a bare 404.
- **Default branch.** As above — resolve it, don't assume it.
- **Rate limits.** Unauthenticated raw requests are limited. Cache the
  `registry.json` per `(owner, repo, ref)` for the run; React caps
  concurrency at 8.
- **Subdirectory registries.** A monorepo may keep `registry.json` below
  the root. Decide whether `owner/repo/path/item` means a nested item name
  or a nested registry path, and document it.
- **Security.** A registry item can write files anywhere the `target` says.
  Path traversal in `files[].target` must be rejected — this is a bigger
  deal for a zero-config GitHub form than for a URL the user pasted
  deliberately.
- **Ambiguity.** `owner/repo/item` and a bare item name containing slashes
  are hard to tell apart. React resolves this by validating owner/repo
  strictly first; do the same.

## 6. Test fixture

This repository is a ready-made end-to-end fixture, and is already in the
shape the resolver expects:

- `registry.json` at the repo root, real repo-relative `path` values.
- Eight items, one of which (`personal`) has a two-level
  `registryDependencies` chain.
- Published mirror at <https://lifeline-peter-lewis.vercel.app/r/registry.json>.

Once merged, this should install 39 files with no `components.json` entry:

```bash
npx shadcn-vue@latest add peter-lewis/lifeline/personal
```

The equivalent works today via a namespace, which is the fallback to keep
documented either way:

```json
{ "registries": { "@lifeline": "https://lifeline-peter-lewis.vercel.app/r/{name}.json" } }
```

```bash
npx shadcn-vue@latest add @lifeline/personal
```

## 7. Before opening the PR

- Read `CONTRIBUTING.md` in `unovue/shadcn-vue`.
- Open an issue first describing the feature and linking the React
  implementation — the maintainers may have a view on whether they want
  parity here or a different resolution scheme.
- Search existing issues. Nothing open matched "registry" + GitHub
  resolution at time of writing; the closest neighbour is
  [#582](https://github.com/unovue/shadcn-vue/issues/582), "Providing a way
  to update components from remote registry".
