import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { consumePostLoginRedirect } from './postLoginRedirect'

/**
 * Returns a function that sends the user wherever they were headed before the
 * auth funnel grabbed them, falling back to the home page.
 *
 * The stored target is single-use: the first consume() wins and every later one
 * sees null. An auth page typically has more than one thing racing to redirect
 * (the submit handler, plus an effect watching `user`, plus StrictMode's
 * double-invoke of that effect), so an unguarded caller would consume the token,
 * navigate correctly, then have the next caller consume null and bounce the user
 * to "/". The ref makes the whole redirect idempotent: first call navigates,
 * the rest are no-ops.
 */
export function usePostLoginNavigate() {
  const navigate = useNavigate()
  const redirectedRef = useRef(false)

  return useCallback(() => {
    if (redirectedRef.current) return
    redirectedRef.current = true
    navigate(consumePostLoginRedirect() || '/', { replace: true })
  }, [navigate])
}
