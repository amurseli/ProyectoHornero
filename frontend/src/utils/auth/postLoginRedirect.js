// Stores a path the user should be redirected to after logging in.
// Survives external redirects (e.g. Google OAuth) by living in localStorage.
// Cleared automatically when the user navigates outside the auth funnel
// (see AuthRedirectCleaner in App.jsx).

const KEY = 'postLoginRedirect'

export function savePostLoginRedirect(path) {
  if (!path || typeof path !== 'string') return
  try {
    localStorage.setItem(KEY, path)
  } catch {
    // localStorage unavailable; silently skip
  }
}

export function consumePostLoginRedirect() {
  try {
    const path = localStorage.getItem(KEY)
    if (path) localStorage.removeItem(KEY)
    return path || null
  } catch {
    return null
  }
}

export function clearPostLoginRedirect() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
