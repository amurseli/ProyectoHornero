"use client"

import { useEffect, useRef, useState } from "react"
import { campaignService } from "../utils/campaignService"

export const SEARCH_PAGE_SIZE = 12
const DEBOUNCE_MS = 1000

export function useCampaignSearch() {
  const [query, setQueryState] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [results, setResults] = useState([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const debounceTimerRef = useRef(null)
  const requestCounterRef = useRef(0)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    campaignService
      .getCategories()
      .then((cats) => { if (!cancelled) setCategories(cats) })
      .catch((err) => console.error("Error loading categories:", err))
    return () => { cancelled = true }
  }, [])

  const hasActiveQuery = query.trim().length > 0 || selectedCategory != null

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    if (!hasActiveQuery) {
      setResults([])
      setTotalPages(0)
      setTotalElements(0)
      setIsLoading(false)
      if (abortControllerRef.current) abortControllerRef.current.abort()
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      const requestId = ++requestCounterRef.current
      if (abortControllerRef.current) abortControllerRef.current.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setIsLoading(true)
      campaignService
        .searchCampaigns({
          search: query,
          categoryId: selectedCategory?.id ?? null,
          page,
          size: SEARCH_PAGE_SIZE,
          signal: controller.signal,
        })
        .then((data) => {
          if (requestId !== requestCounterRef.current) return
          setResults(data.campaigns)
          setTotalPages(data.totalPages)
          setTotalElements(data.totalElements)
          setIsLoading(false)
        })
        .catch((err) => {
          if (err.name === "AbortError") return
          if (requestId !== requestCounterRef.current) return
          console.error("Error searching campaigns:", err)
          setResults([])
          setTotalPages(0)
          setTotalElements(0)
          setIsLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [query, selectedCategory, page, hasActiveQuery])

  const setQuery = (value) => {
    setQueryState(value)
    setPage(1)
  }

  const toggleCategory = (cat) => {
    setSelectedCategory((current) => (current?.id === cat?.id ? null : cat))
    setPage(1)
  }

  const clearCategory = () => {
    setSelectedCategory(null)
    setPage(1)
  }

  const goNext = () => setPage((p) => (totalPages > 0 ? Math.min(totalPages, p + 1) : p))
  const goPrev = () => setPage((p) => Math.max(1, p - 1))

  return {
    query,
    selectedCategory,
    categories,
    page,
    results,
    totalPages,
    totalElements,
    isLoading,
    hasActiveQuery,
    pageSize: SEARCH_PAGE_SIZE,
    setQuery,
    toggleCategory,
    clearCategory,
    goNext,
    goPrev,
  }
}
