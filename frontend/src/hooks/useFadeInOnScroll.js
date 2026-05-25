"use client"

import { useEffect, useRef, useState, useCallback } from "react"

/**
 * Devuelve un `ref` para attachear al elemento y un `className` que arranca
 * en estado oculto (opacity 0 + translateY) y pasa a visible cuando el
 * elemento entra al viewport. Una sola vez: una vez que aparece, se queda.
 */
export function useFadeInOnScroll({
  threshold = 0.1,
  rootMargin = "0px 0px -60px 0px",
  delay = 0,
} = {}) {
  const [node, setNode] = useState(null)
  const [visible, setVisible] = useState(false)
  
  // Usar callback ref para detectar cuando el elemento se monta
  const ref = useCallback((element) => {
    setNode(element)
  }, [])

  useEffect(() => {
    if (!node || visible) return

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (delay > 0) {
              const t = setTimeout(() => setVisible(true), delay)
              observer.disconnect()
              return () => clearTimeout(t)
            }
            setVisible(true)
            observer.disconnect()
          }
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [node, threshold, rootMargin, delay, visible])

  return {
    ref,
    className: visible ? "fade-in fade-in--visible" : "fade-in",
  }
}

export default useFadeInOnScroll