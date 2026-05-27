import { useCallback, useEffect, useRef, useState } from "react"
import { campaignService } from "../utils/campaignService"

const PAGE_SIZE = 18

export function useBrowseCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalElements, setTotalElements] = useState(0)

  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [selectedSort, setSelectedSort] = useState("recent")

  const abortRef = useRef(null)
  const filtersRef = useRef({ selectedCategory, selectedStatus, selectedSort })
  const isFetchingRef = useRef(false)

  useEffect(() => {
    campaignService.getCategories().then(setCategories).catch(() => {})
  }, [])

  const fetchPage = useCallback(async (pageNum, reset, filters) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    isFetchingRef.current = true

    if (reset) setIsLoading(true)
    else setIsLoadingMore(true)

    try {
      const data = await campaignService.browseCampaigns({
        categoryId: filters.selectedCategory?.id ?? null,
        status: filters.selectedStatus,
        sort: filters.selectedSort,
        page: pageNum,
        size: PAGE_SIZE,
        signal: controller.signal,
      })
      setCampaigns(prev => reset ? data.campaigns : [...prev, ...data.campaigns])
      setTotalElements(data.totalElements)
      setHasMore(pageNum < data.totalPages)
    } catch (err) {
      if (err.name === "AbortError") return
      console.error("Browse error:", err)
      setHasMore(false)
    } finally {
      isFetchingRef.current = false
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    const filters = { selectedCategory, selectedStatus, selectedSort }
    filtersRef.current = filters
    setPage(1)
    setHasMore(true)
    fetchPage(1, true, filters)
  }, [selectedCategory, selectedStatus, selectedSort, fetchPage])

  const loadingRef = useRef({ hasMore: true, page: 1 })
  loadingRef.current = { hasMore, page }

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [])

  const loadMore = useCallback(() => {
    const { hasMore, page } = loadingRef.current
    if (isFetchingRef.current || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchPage(nextPage, false, filtersRef.current)
  }, [fetchPage])

  const clearCategory = () => setSelectedCategory(null)

  const toggleCategory = (cat) =>
    setSelectedCategory(prev => prev?.id === cat.id ? null : cat)

  const setStatus = (status) =>
    setSelectedStatus(prev => prev === status ? null : status)

  const clearStatus = () => setSelectedStatus(null)

  const setSort = (sort) => setSelectedSort(sort)

  return {
    campaigns,
    isLoading,
    isLoadingMore,
    hasMore,
    totalElements,
    categories,
    selectedCategory,
    selectedStatus,
    selectedSort,
    loadMore,
    clearCategory,
    toggleCategory,
    clearStatus,
    setStatus,
    setSort,
  }
}
