// Stores a path the user should be redirected to after logging in.
// Survives external redirects (e.g. Google OAuth) and the registration email
// round-trip by living in localStorage.
//
// The target is bounded by time, not by navigation. Registering means leaving
// the site, opening an email client and coming back minutes later, and users
// browse around while they wait — so anything that dropped the target when the
// user stepped outside the auth pages would lose it exactly when it matters.
// Instead the target expires on its own, and is single-use.

const KEY = 'postLoginRedirect'

// Long enough to read an email and click the link; short enough that a target
// the user has forgotten about can't hijack an unrelated login tomorrow.
const TTL_MS = 30 * 60 * 1000

// Pages that make up the auth funnel: never a valid post-login destination,
// since storing one would bounce the user back into the funnel they just left.
// /oauth2/redirect is here because Google lands there before we redirect on.
const AUTH_FUNNEL_PREFIXES = [
  '/login',
  '/register',
  '/oauth2/redirect',
  '/email-sent',
  '/verify-email',
]

export function isAuthFunnelPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return false
  return AUTH_FUNNEL_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

// Only same-origin absolute paths. Rejects "https://evil.com" and the
// protocol-relative "//evil.com", so a poisoned localStorage entry can't turn
// the post-login navigate into an open redirect.
function isSafeInternalPath(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')
}

export function savePostLoginRedirect(path) {
  if (!isSafeInternalPath(path)) return
  if (isAuthFunnelPath(path)) return
  try {
    localStorage.setItem(KEY, JSON.stringify({ path, savedAt: Date.now() }))
  } catch {
    // localStorage unavailable; silently skip
  }
}

export function consumePostLoginRedirect() {
  let raw
  try {
    raw = localStorage.getItem(KEY)
    if (raw) localStorage.removeItem(KEY)
  } catch {
    return null
  }
  if (!raw) return null

  let entry
  try {
    entry = JSON.parse(raw)
  } catch {
    return null // legacy plain-string entry, or corrupted — drop it
  }

  if (!entry || !isSafeInternalPath(entry.path)) return null
  if (typeof entry.savedAt !== 'number') return null
  if (Date.now() - entry.savedAt > TTL_MS) return null

  return entry.path
}

export function clearPostLoginRedirect() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
