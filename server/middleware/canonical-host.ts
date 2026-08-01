/**
 * One indexable host: www.peterlewis.dev.
 *
 * Vercel regenerates project and branch URLs on every deploy
 * (`lifeline-<project>.vercel.app`, `lifeline-git-main-….vercel.app`, and
 * a fresh `lifeline-<hash>-….vercel.app` per deployment), so deleting
 * them with `vercel alias rm` doesn't stick — they come back with the
 * next push. Each one serves the identical site, which is a duplicate of
 * the canonical domain.
 *
 * A redirect would fix indexing and break preview deployments, which are
 * the whole point of those URLs. `noindex` keeps previews usable and
 * keeps them out of search, which is the part that actually matters. The
 * canonical <link> already points at the right place; this is the
 * stronger signal behind it.
 */
const CANONICAL_HOST = "www.peterlewis.dev"

export default defineEventHandler((event) => {
  const host = getRequestHost(event, { xForwardedHost: true })

  // Everything that isn't the canonical host gets the header, localhost
  // included. That's deliberate: `pnpm preview` then serves exactly what
  // a preview deployment serves, so this is testable locally instead of
  // being a rule that only exists in production.
  if (!host || host === CANONICAL_HOST) return

  setResponseHeader(event, "x-robots-tag", "noindex")
})
