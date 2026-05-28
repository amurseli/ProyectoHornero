import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { campaignService } from "../utils/campaignService"

export function useHeroSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let cancelled = false
    campaignService.getCategories()
      .then(cats => { if (!cancelled) setCategories(cats) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const buildExplorarUrl = ({ q, cat }) => {
    const params = new URLSearchParams()
    const trimmed = (q ?? "").trim()
    if (trimmed) params.set("search", trimmed)
    if (cat?.id != null) params.set("categoryId", String(cat.id))
    const qs = params.toString()
    return qs ? `/explorar?${qs}` : "/explorar"
  }

  const submit = (overrides = {}) => {
    const q = overrides.query !== undefined ? overrides.query : query
    const cat = overrides.category !== undefined ? overrides.category : selectedCategory
    navigate(buildExplorarUrl({ q, cat }))
  }

  const toggleCategory = (cat) => {
    const next = selectedCategory?.id === cat?.id ? null : cat
    setSelectedCategory(next)
    submit({ category: next })
  }

  const clearCategory = () => setSelectedCategory(null)

  return {
    query,
    selectedCategory,
    categories,
    isLoading: false,
    setQuery,
    toggleCategory,
    clearCategory,
    submit,
  }
}
